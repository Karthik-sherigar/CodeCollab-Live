const EmptyState = ({ onCreateWorkspace }) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8L3 18C3 19.1046 3.89543 20 5 20L19 20C20.1046 20 21 19.1046 21 18L21 8M3 8L3 6C3 4.89543 3.89543 4 5 4L9.58579 4C9.851 4 10.1054 4.10536 10.2929 4.29289L12.7071 6.70711C12.8946 6.89464 13.149 7 13.4142 7L19 7C20.1046 7 21 7.89543 21 8M3 8L21 8" stroke="url(#gradient1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                        <linearGradient id="gradient1" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stopColor="hsl(250, 84%, 64%)" />
                            <stop offset="1" stopColor="hsl(280, 70%, 60%)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <h2 className="empty-state-title">No workspaces yet</h2>
            <p className="empty-state-text">
                Create your first workspace to start collaborating with your team
            </p>
            <button onClick={onCreateWorkspace} className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Create Workspace
            </button>
        </div>
    );
};

export default EmptyState;
