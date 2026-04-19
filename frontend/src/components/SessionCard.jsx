import { useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';

const LANG_COLORS = {
    javascript: '#f59e0b', typescript: '#3b82f6', python:  '#10b981',
    java:       '#f97316', cpp:        '#8b5cf6', go:      '#06b6d4',
    rust:       '#ef4444', default:    '#6b7280',
};

const getLangColor = (lang = '') =>
    LANG_COLORS[(lang || '').toLowerCase()] || LANG_COLORS.default;

const fmtDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        + ' · '
        + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const SessionCard = ({ session, onDelete }) => {
    const navigate = useNavigate();
    const user = authAPI.getCurrentUser();
    const isOwner = user && session.creator_id === user.id;
    const isActive = session.status === 'ACTIVE';

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${session.title}"?\n\nThis cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/sessions/${session.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                if (onDelete) onDelete(session.id);
            } else {
                alert(data.message || 'Failed to delete session');
            }
        } catch {
            alert('Failed to delete session');
        }
    };

    return (
        <article className="wp-session-card">
            {/* Card Top */}
            <div className="wp-sc-top">
                <div className="wp-sc-lang-dot" style={{ background: getLangColor(session.language) }} />
                <h3 className="wp-sc-title">{session.title}</h3>
                <span className={`wp-sc-status ${isActive ? 'wp-sc-status--active' : 'wp-sc-status--ended'}`}>
                    {isActive ? '● Live' : 'Ended'}
                </span>
            </div>

            {/* Card Meta */}
            <div className="wp-sc-meta">
                <span className="wp-sc-lang-badge" style={{ background: `${getLangColor(session.language)}18`, color: getLangColor(session.language), borderColor: `${getLangColor(session.language)}44` }}>
                    {session.language}
                </span>
                <span className="wp-sc-creator">by {session.creator_name}</span>
                <span className="wp-sc-date">{fmtDate(session.created_at)}</span>
            </div>

            {/* Card Actions */}
            <div className="wp-sc-actions">
                {isActive ? (
                    <button className="wp-sc-btn wp-sc-btn--join" onClick={() => navigate(`/session/${session.id}`)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="5 12 12 5 19 12"/><path d="M12 5v14"/>
                        </svg>
                        Join Session
                    </button>
                ) : (
                    <>
                        <button className="wp-sc-btn wp-sc-btn--playback" onClick={() => navigate(`/session/${session.id}/playback`)}>
                            ▶ Playback
                        </button>
                        <button className="wp-sc-btn wp-sc-btn--analytics" onClick={() => navigate(`/session/${session.id}/analytics`)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            Analytics
                        </button>
                    </>
                )}

                {isOwner && (
                    <button className="wp-sc-btn wp-sc-btn--delete" onClick={handleDelete} title="Delete session">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                )}
            </div>
        </article>
    );
};

export default SessionCard;
