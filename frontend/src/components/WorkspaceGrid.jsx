import WorkspaceCard from './WorkspaceCard';

const WorkspaceGrid = ({ workspaces, onCreateWorkspace }) => {
    return (
        <div className="workspace-grid">
            {workspaces.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}

            {/* Create Workspace Card - Hidden on mobile */}
            <div className="workspace-card workspace-card-create mobile-create-btn" onClick={onCreateWorkspace}>
                <div className="create-workspace-content">
                    <div className="create-icon">➕</div>
                    <h3 className="create-text">Create Workspace</h3>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceGrid;
