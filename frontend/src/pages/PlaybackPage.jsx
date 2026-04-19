import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';
import CodeEditor from '../components/CodeEditor';

const LANG_COLORS = {
    javascript: '#f59e0b', typescript: '#3b82f6', python: '#10b981',
    java: '#f97316', cpp: '#8b5cf6', go: '#06b6d4', rust: '#ef4444',
};
const getLangColor = (l = '') => LANG_COLORS[l.toLowerCase()] || '#6b7280';

const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const PlaybackPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);   // which event index we're at
    const [code, setCode] = useState('');
    const [speed, setSpeed] = useState(2);              // default 2x

    // Compressed events: each event gets a "playTime" in ms for fast playback
    const [compressed, setCompressed] = useState([]);   // { playTime, code }

    const timeoutsRef = useRef([]);
    const editorRef = useRef(null);

    // ── Fetch ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fetch_ = async () => {
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
                if (!sesData.success) { setError(sesData.message); setLoading(false); return; }

                setSession(sesData.session);
                const initialCode = sesData.session?.code || '';
                setCode(initialCode);

                const evtData = await evtRes.json();
                if (evtData.success && evtData.events?.length > 0) {
                    const raw = evtData.events.filter(e => e.type === 'CODE_CHANGE');
                    setEvents(raw);

                    // ── Compress timeline ──────────────────────────────────
                    // Map original timestamps → short playback durations.
                    // Strategy: keep inter-event gaps but cap each gap at 2 s,
                    // so a session that took 10 min plays in ~30-60 s at 1x.
                    const MAX_GAP_MS = 2000; // cap any pause at 2 s
                    let playTime = 0;
                    const comp = [];
                    for (let i = 0; i < raw.length; i++) {
                        if (i === 0) {
                            playTime = 0;
                        } else {
                            const gap = raw[i].relativeTime - raw[i - 1].relativeTime;
                            playTime += Math.min(gap, MAX_GAP_MS);
                        }
                        comp.push({ playTime, code: raw[i].payload?.code ?? '' });
                    }
                    setCompressed(comp);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load playback data');
                setLoading(false);
            }
        };
        fetch_();
    }, [id]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const clearTimeouts = () => {
        timeoutsRef.current.forEach(t => clearTimeout(t));
        timeoutsRef.current = [];
    };

    // ── Play ───────────────────────────────────────────────────────────────
    const play = useCallback(() => {
        if (!compressed.length) return;
        clearTimeouts();
        setIsPlaying(true);

        const startFrom = currentIdx;

        compressed.slice(startFrom).forEach((evt, i) => {
            const delay = (evt.playTime - compressed[startFrom]?.playTime || 0) / speed;
            const t = setTimeout(() => {
                setCode(evt.code);
                setCurrentIdx(startFrom + i);
            }, delay);
            timeoutsRef.current.push(t);
        });

        // Mark done
        const last = compressed[compressed.length - 1];
        const doneDelay = (last.playTime - (compressed[startFrom]?.playTime || 0)) / speed + 100;
        const doneT = setTimeout(() => {
            setIsPlaying(false);
            setCurrentIdx(compressed.length - 1);
        }, doneDelay);
        timeoutsRef.current.push(doneT);
    }, [compressed, currentIdx, speed]);

    const pause = useCallback(() => {
        clearTimeouts();
        setIsPlaying(false);
    }, []);

    const reset = useCallback(() => {
        clearTimeouts();
        setIsPlaying(false);
        setCurrentIdx(0);
        setCode(compressed[0]?.code || session?.code || '');
    }, [compressed, session]);

    useEffect(() => () => clearTimeouts(), []);

    // ── Derived ────────────────────────────────────────────────────────────
    const totalDuration = compressed.length > 0 ? compressed[compressed.length - 1].playTime : 0;
    const currentPlayTime = compressed[currentIdx]?.playTime ?? 0;
    const progress = totalDuration > 0 ? (currentPlayTime / totalDuration) * 100 : 0;
    const hasEvents = compressed.length > 0;

    // ── Loading / Error ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="pb-screen">
                <div className="pb-spinner" />
                <p className="pb-loading-text">Loading playback…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-screen">
                <div className="pb-error-box">
                    <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                    <p>{error}</p>
                    <button className="pb-btn pb-btn--sec" onClick={() => navigate(-1)}>← Go Back</button>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const langColor = getLangColor(session.language);

    return (
        <div className="pb-root">

            {/* ── Header ── */}
            <header className="pb-header">
                <div className="pb-header-left">
                    <button className="pb-btn pb-btn--ghost pb-btn--back" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        <span className="pb-back-label">Back</span>
                    </button>
                    <div className="pb-header-identity">
                        <h1 className="pb-title">{session.title}</h1>
                        <div className="pb-chips">
                            <span className="pb-lang-chip" style={{ background: `${langColor}18`, color: langColor, borderColor: `${langColor}44` }}>
                                <span className="pb-lang-dot" style={{ background: langColor }}/>
                                {session.language?.toUpperCase()}
                            </span>
                            <span className="pb-events-chip">
                                {events.length} events
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pb-header-right">
                    <span className="pb-mode-badge">▶ Playback Mode</span>
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

            {/* ── Controls Bar ── */}
            <div className="pb-controls">
                {/* Left: play/pause/reset + speed */}
                <div className="pb-controls-left">
                    {!isPlaying ? (
                        <button
                            className="pb-btn pb-btn--play"
                            onClick={play}
                            disabled={!hasEvents}
                            title={!hasEvents ? 'No events recorded' : 'Play'}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                            Play
                        </button>
                    ) : (
                        <button className="pb-btn pb-btn--pause" onClick={pause}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                            </svg>
                            Pause
                        </button>
                    )}

                    <button className="pb-btn pb-btn--ghost" onClick={reset} title="Reset to start">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                        </svg>
                        <span className="pb-reset-label">Reset</span>
                    </button>

                    <div className="pb-speed-wrap">
                        <span className="pb-speed-label">Speed</span>
                        <div className="pb-speed-pills">
                            {[0.5, 1, 2, 4].map(s => (
                                <button
                                    key={s}
                                    className={`pb-speed-pill ${speed === s ? 'pb-speed-pill--active' : ''}`}
                                    onClick={() => setSpeed(s)}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: timeline */}
                <div className="pb-controls-right">
                    <span className="pb-time">
                        {fmt(currentPlayTime / speed)} / {fmt(totalDuration / speed)}
                    </span>
                    <div className="pb-timeline-track">
                        <div
                            className="pb-timeline-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {!hasEvents && (
                        <span className="pb-no-events">No events recorded for this session</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaybackPage;
