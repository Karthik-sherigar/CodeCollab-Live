import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../services/api';
import CodeEditor from '../components/CodeEditor';

const LANG_COLORS = {
    javascript: '#f59e0b', typescript: '#3b82f6', python: '#10b981',
    java: '#f97316', cpp: '#8b5cf6', go: '#06b6d4', rust: '#ef4444',
};
const getLangColor = (l = '') => LANG_COLORS[(l || '').toLowerCase()] || '#6b7280';

const fmt = (ms) => {
    if (!ms || ms < 0) return '0:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const MAX_GAP_MS = 2000; // cap idle gaps to 2 s

const PlaybackPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [session, setSession]     = useState(null);
    const [compressed, setCompressed] = useState([]); // [{playTime, code}]
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [code, setCode]           = useState('');
    const [speed, setSpeed]         = useState(2);

    // Keep refs so setTimeout callbacks never use stale state
    const compRef     = useRef([]);
    const speedRef    = useRef(2);
    const timeoutsRef = useRef([]);
    const editorRef   = useRef(null);

    // Sync refs when state changes
    useEffect(() => { compRef.current  = compressed; }, [compressed]);
    useEffect(() => { speedRef.current = speed;       }, [speed]);

    /* ── Fetch ─────────────────────────────────────────────────────── */
    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const [sesRes, evtRes] = await Promise.all([
                    fetch(`${BASE_URL}/api/sessions/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(`${BASE_URL}/api/sessions/${id}/events`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                const sesData = await sesRes.json();
                if (!sesData.success) {
                    setError(sesData.message || 'Session not found');
                    setLoading(false);
                    return;
                }

                setSession(sesData.session);
                setCode(sesData.session?.code || '');

                const evtData = await evtRes.json();
                if (evtData.success && evtData.events?.length > 0) {
                    const raw = evtData.events.filter(e => e.type === 'CODE_CHANGE');
                    if (raw.length > 0) {
                        let playTime = 0;
                        const comp = raw.map((evt, i) => {
                            if (i > 0) {
                                const gap = raw[i].relativeTime - raw[i - 1].relativeTime;
                                playTime += Math.min(Math.max(gap, 0), MAX_GAP_MS);
                            }
                            return { playTime, code: evt.payload?.code ?? '' };
                        });
                        setCompressed(comp);
                        compRef.current = comp;
                        // Start editor on first frame
                        setCode(comp[0]?.code || sesData.session?.code || '');
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load playback data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    /* ── Playback helpers ──────────────────────────────────────────── */
    const clearAll = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    };

    /* play from a given index using refs (no stale closure) */
    const playFrom = (startIdx) => {
        const comp  = compRef.current;
        const spd   = speedRef.current;
        if (!comp.length) return;

        clearAll();
        setIsPlaying(true);

        const baseTime = comp[startIdx]?.playTime ?? 0; // ← FIX: explicit parentheses

        comp.slice(startIdx).forEach((evt, i) => {
            const delay = (evt.playTime - baseTime) / spd; // ← FIX: no operator precedence bug
            const t = setTimeout(() => {
                setCode(evt.code);
                setCurrentIdx(startIdx + i);
            }, delay);
            timeoutsRef.current.push(t);
        });

        // Final: mark finished
        const lastTime  = comp[comp.length - 1].playTime;
        const doneDelay = (lastTime - baseTime) / spd + 150;
        const doneT = setTimeout(() => {
            setIsPlaying(false);
            setCurrentIdx(comp.length - 1);
        }, doneDelay);
        timeoutsRef.current.push(doneT);
    };

    const handlePlay  = () => playFrom(currentIdx);
    const handlePause = () => { clearAll(); setIsPlaying(false); };
    const handleReset = () => {
        clearAll();
        setIsPlaying(false);
        setCurrentIdx(0);
        setCode(compRef.current[0]?.code || session?.code || '');
    };

    const handleSpeed = (s) => {
        const wasPlaying = isPlaying;
        const idx        = currentIdx;
        if (wasPlaying) { clearAll(); setIsPlaying(false); }
        setSpeed(s);
        speedRef.current = s;
        // Resume from same position with new speed
        if (wasPlaying) {
            // small delay to let state flush
            setTimeout(() => playFrom(idx), 0);
        }
    };

    useEffect(() => () => clearAll(), []);

    /* ── Derived ───────────────────────────────────────────────────── */
    const totalDuration   = compressed.length > 0 ? compressed[compressed.length - 1].playTime : 0;
    const currentPlayTime = compressed[currentIdx]?.playTime ?? 0;
    const progress        = totalDuration > 0 ? (currentPlayTime / totalDuration) * 100 : 0;
    const hasEvents       = compressed.length > 0;

    /* ── Loading / Error ───────────────────────────────────────────── */
    if (loading) return (
        <div className="pb-screen">
            <div className="pb-spinner" />
            <p className="pb-loading-text">Loading playback…</p>
        </div>
    );

    if (error) return (
        <div className="pb-screen">
            <div className="pb-error-box">
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                <p>{error}</p>
                <button className="pb-btn pb-btn--sec" onClick={() => navigate(-1)}>← Go Back</button>
            </div>
        </div>
    );

    if (!session) return null;

    const langColor = getLangColor(session.language);

    return (
        <div className="pb-root">

            {/* ── Header ── */}
            <header className="pb-header">
                <div className="pb-header-left">
                    <button className="pb-btn pb-btn--back" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        <span className="pb-back-label">Back</span>
                    </button>

                    <div className="pb-header-identity">
                        <h1 className="pb-title">{session.title}</h1>
                        <div className="pb-chips">
                            <span className="pb-lang-chip"
                                style={{ background: `${langColor}18`, color: langColor, borderColor: `${langColor}44` }}>
                                <span className="pb-lang-dot" style={{ background: langColor }}/>
                                {session.language?.toUpperCase()}
                            </span>
                            <span className="pb-events-chip">{compressed.length} events</span>
                        </div>
                    </div>
                </div>

                <div className="pb-header-right">
                    <span className="pb-mode-badge">▶ Playback</span>
                </div>
            </header>

            {/* ── Editor ── */}
            <div className="pb-editor">
                <CodeEditor
                    language={session.language?.toLowerCase()}
                    code={code}
                    readOnly={true}
                    onEditorMount={(editor) => { editorRef.current = editor; }}
                />
            </div>

            {/* ── Controls: Timeline row (progress bar always visible) ── */}
            <div className="pb-timeline-row">
                <span className="pb-time">{fmt(currentPlayTime / speed)}</span>
                <div className="pb-timeline-track">
                    <div className="pb-timeline-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="pb-time">{fmt(totalDuration / speed)}</span>
            </div>

            {/* ── Controls: Buttons row ── */}
            <div className="pb-controls-row">
                {/* Play / Pause */}
                {!isPlaying ? (
                    <button
                        className="pb-btn pb-btn--play"
                        onClick={handlePlay}
                        disabled={!hasEvents}
                        title={!hasEvents ? 'No events recorded' : 'Play'}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                        <span>Play</span>
                    </button>
                ) : (
                    <button className="pb-btn pb-btn--pause" onClick={handlePause}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                        </svg>
                        <span>Pause</span>
                    </button>
                )}

                {/* Reset */}
                <button className="pb-btn pb-btn--ghost" onClick={handleReset} title="Reset to start">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                    </svg>
                    <span className="pb-reset-label">Reset</span>
                </button>

                <div className="pb-divider" />

                {/* Speed pills */}
                <span className="pb-speed-label">Speed</span>
                <div className="pb-speed-pills">
                    {[0.5, 1, 2, 4].map(s => (
                        <button
                            key={s}
                            className={`pb-speed-pill ${speed === s ? 'pb-speed-pill--active' : ''}`}
                            onClick={() => handleSpeed(s)}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                {!hasEvents && (
                    <span className="pb-no-events">No recorded events</span>
                )}
            </div>
        </div>
    );
};

export default PlaybackPage;
