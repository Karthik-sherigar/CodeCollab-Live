import { useNavigate } from 'react-router-dom';

const WorkspaceCard = ({ workspace }) => {
    const navigate = useNavigate();

    const handleOpen = () => {
        console.log('Opening workspace:', workspace.id);
        navigate(`/workspace/${workspace.id}`);
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'OWNER':
                return 'role-badge role-owner';
            case 'COLLABORATOR':
                return 'role-badge role-collaborator';
            case 'REVIEWER':
                return 'role-badge role-reviewer';
            default:
                return 'role-badge';
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
                    <span className="stat-icon">💻</span>
                    <span className="stat-value">{workspace.sessionCount || 0}</span>
                    <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{workspace.member_count || 1}</span>
                    <span className="stat-label">Members</span>
                </div>
            </div>

            <div className="workspace-footer">
                <span className="last-active">
                    Last active: {formatDate(workspace.updated_at || workspace.created_at)}
                </span>
                <button onClick={handleOpen} className="btn btn-primary btn-sm">
                    Open
                </button>
            </div>
        </div>
    );
};

export default WorkspaceCard;
