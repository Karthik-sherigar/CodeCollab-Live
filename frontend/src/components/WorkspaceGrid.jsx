import WorkspaceCard from './WorkspaceCard';

const WorkspaceGrid = ({ workspaces, onCreateWorkspace }) => {
    return (
        <div className="workspace-grid">
            {workspaces.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}

            {/* Create Workspace Card - Visible on tablet+ */}
            <div className="workspace-card workspace-card-create" onClick={onCreateWorkspace}>
                <div className="create-workspace-content">
                    <div className="create-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 className="create-text">Create Workspace</h3>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceGrid;
