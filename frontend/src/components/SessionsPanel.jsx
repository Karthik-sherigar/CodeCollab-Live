import SessionCard from './SessionCard';

const SessionsPanel = ({ sessions, userRole, onCreateSession, onSessionDeleted }) => {
    const canCreate = userRole === 'OWNER' || userRole === 'COLLABORATOR';

    return (
        <div className="wp-sessions-panel">
            {/* Panel Header */}
            <div className="wp-sessions-header">
                <div className="wp-sessions-title-group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                    </svg>
                    <h2 className="wp-sessions-title">Coding Sessions</h2>
                    <span className="wp-count-badge">{sessions.length}</span>
                </div>

                {canCreate && (
                    <button className="wp-create-session-btn-inline" onClick={onCreateSession}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Create Session
                    </button>
                )}
            </div>

            {/* Content */}
            {sessions.length === 0 ? (
                <div className="wp-sessions-empty">
                    <div className="wp-empty-icon">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="url(#eg)" strokeWidth="1.5"/>
                            <path d="M8 21h8M12 17v4" stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7 7v6M12 7v6M17 7v6" stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round"/>
                            <defs>
                                <linearGradient id="eg" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#a78bfa"/>
                                    <stop offset="1" stopColor="#c084fc"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h3 className="wp-empty-title">No coding sessions yet</h3>
                    <p className="wp-empty-subtitle">
                        {canCreate
                            ? 'Create your first session and start coding together.'
                            : 'No active sessions in this workspace.'}
                    </p>
                    {canCreate && (
                        <button className="wp-empty-cta" onClick={onCreateSession}>
                            + Create First Session
                        </button>
                    )}
                </div>
            ) : (
                <div className="wp-sessions-list">
                    {sessions.map(session => (
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
