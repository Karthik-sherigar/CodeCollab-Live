import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const SessionCard = ({ session, onDelete }) => {
    const navigate = useNavigate();
    const currentUser = authAPI.getCurrentUser();

    const getStatusBadgeClass = (status) => {
        return status === 'ACTIVE' ? 'status-badge status-active' : 'status-badge status-ended';
    };

    const getLanguageBadge = (language) => {
        const colors = {
            javascript: '#f7a01eff',
            python: '#3776ab',
            java: '#007396',
            cpp: '#00599c',
            go: '#00add8',
            rust: '#000000',
            typescript: '#3178c6'
        };

        return colors[language.toLowerCase()] || '#6b7280';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleJoin = () => {
        navigate(`/session/${session.id}`);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${session.title}"?\n\nThis will permanently delete:\n- Session data\n- All comments and replies\n- All recorded events\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/sessions/${session.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                alert('Session deleted successfully');
                if (onDelete) onDelete(session.id);
            } else {
                alert(data.message || 'Failed to delete session');
            }
        } catch (err) {
            console.error('Error deleting session:', err);
            alert('Failed to delete session');
        }
    };

    const isOwner = currentUser && session.creator_id === currentUser.id;

    return (
        <div className="session-card ">
            <div className="session-card-header">
                <h3 className="session-title">{session.title}</h3>
                <span className={getStatusBadgeClass(session.status)}>{session.status}</span>
            </div>

            <div className="session-meta">
                <span
                    className="language-badge"
                    style={{ backgroundColor: getLanguageBadge(session.language) }}
                >
                    {session.language}
                </span>
                <span className="session-creator " style={{ color: 'gray' }}> by {session.creator_name}</span>
            </div>

            <div className="session-footer ">
                <span className="session-date" style={{ color: 'gray', display: "block", marginBottom: "10px", marginTop: "0" }}>{formatDate(session.created_at)}</span>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {session.status === 'ACTIVE' ? (
                        <button onClick={handleJoin} className="btn btn-sm " style={{ backgroundColor: 'gray' }}>
                            Join Session
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate(`/session/${session.id}/playback`)}
                                className="btn btn-sm"
                                style={{ backgroundColor: '#a855f7' }}
                            >
                                ▶ Playback
                            </button>
                            <button
                                onClick={() => navigate(`/session/${session.id}/analytics`)}
                                className="btn btn-sm"
                                style={{ backgroundColor: '#10b981' }}
                            >
                                📊 Analytics
                            </button>
                        </>
                    )}

                    {isOwner && (
                        <button
                            onClick={handleDelete}
                            className="btn btn-sm"
                            style={{ backgroundColor: '#ef4444', marginLeft: 'auto' }}
                            title="Delete session"
                        >
                            🗑️ Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionCard;
