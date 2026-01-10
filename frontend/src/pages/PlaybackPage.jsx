import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import CodeEditor from '../components/CodeEditor';

const PlaybackPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [code, setCode] = useState('');

    const editorRef = useRef(null);
    const timeoutsRef = useRef([]);
    const startTimeRef = useRef(null);

    // Fetch session and events
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch session
                const sessionRes = await fetch(`http://localhost:5000/api/sessions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const sessionData = await sessionRes.json();

                if (!sessionData.success) {
                    setError(sessionData.message);
                    setLoading(false);
                    return;
                }

                setSession(sessionData.session);
                setCode(sessionData.code || '');

                // Fetch events
                const eventsRes = await fetch(`http://localhost:5000/api/sessions/${id}/events`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const eventsData = await eventsRes.json();

                if (eventsData.success) {
                    setEvents(eventsData.events);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching playback data:', err);
                setError('Failed to load playback data');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Clear all timeouts
    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
    };

    // Apply event to editor
    const applyEvent = (event) => {
        if (event.type === 'CODE_CHANGE') {
            setCode(event.payload.code);
        }
        // Add more event types as needed (comments, etc.)
    };

    // Play events
    const playEvents = () => {
        if (events.length === 0) return;

        clearAllTimeouts();
        setIsPlaying(true);
        startTimeRef.current = Date.now();

        events.forEach(event => {
            const timeout = setTimeout(() => {
                applyEvent(event);
                setCurrentTime(event.relativeTime);
            }, event.relativeTime / speed);

            timeoutsRef.current.push(timeout);
        });

        // Stop playing when done
        const lastEvent = events[events.length - 1];
        const finalTimeout = setTimeout(() => {
            setIsPlaying(false);
        }, lastEvent.relativeTime / speed);
        timeoutsRef.current.push(finalTimeout);
    };

    // Pause playback
    const pausePlayback = () => {
        clearAllTimeouts();
        setIsPlaying(false);
    };

    // Reset playback
    const resetPlayback = () => {
        clearAllTimeouts();
        setIsPlaying(false);
        setCurrentTime(0);
        setCode(session?.code || '');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => clearAllTimeouts();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading playback...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">
                    Go Back
                </button>
            </div>
        );
    }

    if (!session) return null;

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const totalDuration = events.length > 0 ? events[events.length - 1].relativeTime : 0;

    return (
        <div className="playback-page">
            <div className="playback-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
                    ← Back
                </button>
                <h1>{session.title} - Playback</h1>
                <span className="language-badge" style={{ backgroundColor: '#6b7280' }}>
                    {session.language}
                </span>
            </div>

            <div className="playback-editor">
                <CodeEditor
                    language={session.language.toLowerCase()}
                    code={code}
                    readOnly={true}
                    onEditorMount={(editor) => { editorRef.current = editor; }}
                />
            </div>

            <div className="playback-controls">
                <div className="control-buttons">
                    {!isPlaying ? (
                        <button onClick={playEvents} className="btn btn-primary" disabled={events.length === 0}>
                            ▶ Play
                        </button>
                    ) : (
                        <button onClick={pausePlayback} className="btn btn-warning">
                            ⏸ Pause
                        </button>
                    )}
                    <button onClick={resetPlayback} className="btn btn-secondary">
                        ⏮ Reset
                    </button>
                </div>

                <div className="speed-control">
                    <label>Speed:</label>
                    <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                    </select>
                </div>

                <div className="timeline">
                    <span className="time-display">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                    <div className="timeline-bar">
                        <div
                            className="timeline-progress"
                            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>

                <div className="event-count">
                    {events.length} events recorded
                </div>
            </div>
        </div>
    );
};

export default PlaybackPage;
