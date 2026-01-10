import SessionCard from './SessionCard';

const SessionsPanel = ({ sessions, userRole, onCreateSession, onSessionDeleted }) => {
    const canCreateSession = userRole === 'OWNER' || userRole === 'COLLABORATOR';

    return (
        <div className="sessions-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    Coding Sessions
                    <span className="session-count">{sessions.length}</span>
                </h2>
                {canCreateSession && (
                    <button onClick={onCreateSession} className="btn btn-primary btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 5V19M5 12H19"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Create Session
                    </button>
                )}
            </div>

            {sessions.length === 0 ? (
                <div className="sessions-empty">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <rect
                                x="2"
                                y="3"
                                width="20"
                                height="14"
                                rx="2"
                                stroke="url(#gradient2)"
                                strokeWidth="1.5"
                            />
                            <path d="M8 21H16" stroke="url(#gradient2)" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M12 17V21" stroke="url(#gradient2)" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M7 7L7 13M12 7V13M17 7V13" stroke="url(#gradient2)" strokeWidth="1.5" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="gradient2" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="hsl(250, 84%, 64%)" />
                                    <stop offset="1" stopColor="hsl(280, 70%, 60%)" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h3 className="empty-title">No coding sessions yet</h3>
                    <p className="empty-text">
                        {canCreateSession
                            ? 'Create your first session to start coding together'
                            : 'No active sessions in this workspace'}
                    </p>
                </div>
            ) : (
                <div className="sessions-list">
                    {sessions.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            onDelete={onSessionDeleted}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionsPanel;
