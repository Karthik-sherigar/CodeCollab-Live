import { useNavigate } from 'react-router-dom';

const WorkspaceCard = ({ workspace }) => {
    const navigate = useNavigate();

    const handleOpen = () => {
        navigate(`/workspace/${workspace.id}`);
    };

    const getRoleBadgeClass = (role) => {
        const baseClass = 'role-badge';
        switch (role) {
            case 'OWNER':
                return `${baseClass} role-owner`;
            case 'COLLABORATOR':
                return `${baseClass} role-collaborator`;
            case 'REVIEWER':
                return `${baseClass} role-reviewer`;
            default:
                return baseClass;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="workspace-card">
            <div className="workspace-card-header">
                <h3 className="workspace-name">{workspace.name}</h3>
                <span className={getRoleBadgeClass(workspace.role)}>
                    {workspace.role}
                </span>
            </div>

            <div className="workspace-stats">
                <div className="stat-item">
                    <span className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8M12 17v4" />
                        </svg>
                    </span>
                    <span className="stat-value">{workspace.sessionCount || 0}</span>
                    <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                    <span className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </span>
                    <span className="stat-value">{workspace.member_count || 1}</span>
                    <span className="stat-label">Members</span>
                </div>
            </div>

            <div className="workspace-footer">
                <span className="last-active">
                    {formatDate(workspace.updated_at || workspace.created_at)}
                </span>
                <button onClick={handleOpen} className="btn btn-primary btn-sm">
                    Open
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default WorkspaceCard;
