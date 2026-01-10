const WorkspaceHeader = ({ workspace, userRole }) => {
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

    return (
        <div className="workspace-header">
            <div className="workspace-header-content">
                <h1 className="workspace-title">{workspace.name}</h1>
                <span className={getRoleBadgeClass(userRole)}>{userRole}</span>
            </div>
            <p className="workspace-id">Workspace ID: {workspace.id}</p>
        </div>
    );
};

export default WorkspaceHeader;
