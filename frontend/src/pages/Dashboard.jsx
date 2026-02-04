import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, workspaceAPI, BASE_URL } from '../services/api';
import WelcomeHeader from '../components/WelcomeHeader';
import WorkspaceGrid from '../components/WorkspaceGrid';
import EmptyState from '../components/EmptyState';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

const Dashboard = ({ showCreateModal, setShowCreateModal }) => {
    const navigate = useNavigate();
    const user = authAPI.getCurrentUser();

    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await workspaceAPI.getAll();
            if (response.success) {
                setWorkspaces(response.workspaces);
            }
        } catch (err) {
            console.error('Failed to fetch workspaces:', err);
            setError('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchWorkspaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Sync external showCreateModal with internal isModalOpen
    useEffect(() => {
        if (showCreateModal) {
            setIsModalOpen(true);
            setShowCreateModal(false); // Reset the prop
        }
    }, [showCreateModal, setShowCreateModal]);

    const handleCreateWorkspace = async (name) => {
        const response = await workspaceAPI.create(name);
        if (response.success) {
            await fetchWorkspaces(); // Refresh list
        }
    };

    if (!user) return null;

    const [githubStatus, setGithubStatus] = useState({ connected: false });
    const [checkingGithub, setCheckingGithub] = useState(true);

    const fetchGithubStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/github/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setGithubStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch github status:', err);
        } finally {
            setCheckingGithub(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchWorkspaces();
        fetchGithubStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const handleConnectGitHub = () => {
        const token = localStorage.getItem('token');
        // We pass the JWT token in the URL for the callback to identify the user
        // A better way would be a short-lived state/nonce, but this is simpler for now
        window.location.href = `${BASE_URL}/api/github/auth?token=${token}`;
    };



    return (
        <div className="dashboard">
            <WelcomeHeader userName={user.name} />

            <div className="dashboard-layout">
                <div className="dashboard-main">
                    <div className="section-header">
                        <h2 className="section-title">Your Workspaces</h2>
                        {/* Mobile-only create button */}
                        <button
                            className="mobile-create-workspace-btn"
                            onClick={() => setIsModalOpen(true)}
                            title="Create Workspace"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner-large"></div>
                            <p>Loading workspaces...</p>
                        </div>
                    ) : error ? (
                        <div className="error-container">
                            <div className="message message-error">{error}</div>
                            <button onClick={fetchWorkspaces} className="btn btn-secondary">
                                Try Again
                            </button>
                        </div>
                    ) : workspaces.length === 0 ? (
                        <EmptyState onCreateWorkspace={() => setIsModalOpen(true)} />
                    ) : (
                        <WorkspaceGrid
                            workspaces={workspaces}
                            onCreateWorkspace={() => setIsModalOpen(true)}
                        />
                    )}
                </div>

                <div className="dashboard-sidebar">
                    <div className="sidebar-card github-card">
                        <div className="card-header">
                            <h3 className="card-title">GitHub Integration</h3>
                            <div className={`status-indicator ${githubStatus.connected ? 'status-online' : 'status-offline'}`}></div>
                        </div>

                        {checkingGithub ? (
                            <div className="spinner-small"></div>
                        ) : githubStatus.connected ? (
                            <div className="github-info">
                                <p className="github-username">Connected as <strong>{githubStatus.username}</strong></p>
                                <p className="github-meta">Linked on {new Date(githubStatus.connectedAt).toLocaleDateString()}</p>
                                <button className="btn btn-secondary btn-sm btn-full" disabled>
                                    GitHub Connected
                                </button>
                            </div>
                        ) : (
                            <div className="github-cta">
                                <p>Connect your GitHub account to import and export code directly.</p>
                                <button onClick={handleConnectGitHub} className="btn btn-primary btn-sm btn-full github-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    Connect GitHub
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateWorkspaceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateWorkspace}
            />
        </div>
    );
};

export default Dashboard;
