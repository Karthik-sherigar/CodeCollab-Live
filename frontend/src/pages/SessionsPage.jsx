import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';
import SessionCard from '../components/SessionCard';

const SessionsPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/sessions/user/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (filter === 'active') return session.status === 'ACTIVE';
        if (filter === 'ended') return session.status === 'ENDED';
        return true;
    });

    const getLanguageColor = (lang) => {
        const colors = {
            javascript: '#f7a01eff',
            python: '#3776ab',
            java: '#007396',
            cpp: '#00599c',
            go: '#00add8',
            rust: '#000000',
            typescript: '#3178c6'
        };
        return colors[lang?.toLowerCase()] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading sessions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="welcome-header">
                <h1 className="welcome-title">All Sessions</h1>
                <p className="welcome-subtitle">View all your collaboration sessions across workspaces</p>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    All ({sessions.length})
                </button>
                <button
                    className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({sessions.filter(s => s.status === 'ACTIVE').length})
                </button>
                <button
                    className={`btn ${filter === 'ended' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('ended')}
                >
                    Ended ({sessions.filter(s => s.status === 'ENDED').length})
                </button>
            </div>

            {filteredSessions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 className="empty-title">No sessions found</h2>
                    <p className="empty-text">
                        {filter === 'all' ? 'Join a workspace to start collaborating' : `No ${filter} sessions`}
                    </p>
                </div>
            ) : (
                <div className="workspace-grid">
                    {filteredSessions.map(session => (
                        <div
                            key={session.id}
                            className="workspace-card"
                            onClick={() => navigate(`/session/${session.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="workspace-card-header">
                                <h3 className="workspace-card-title">{session.title}</h3>
                                <span
                                    className="language-badge"
                                    style={{ backgroundColor: getLanguageColor(session.language) }}
                                >
                                    {session.language}
                                </span>
                            </div>
                            <div className="workspace-card-meta">
                                <span className={session.status === 'ACTIVE' ? 'status-badge status-active' : 'status-badge status-ended'}>
                                    {session.status}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {new Date(session.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {session.workspace_name && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    Workspace: {session.workspace_name}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionsPage;
