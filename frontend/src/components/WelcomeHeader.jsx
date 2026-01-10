const WelcomeHeader = ({ userName }) => {
    return (
        <div className="welcome-header">
            <h1 className="welcome-title">Welcome back, {userName}! 👋</h1>
            <p className="welcome-subtitle">Pick a workspace to start collaborating</p>
        </div>
    );
};

export default WelcomeHeader;
