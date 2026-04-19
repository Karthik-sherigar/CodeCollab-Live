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
    const [githubStatus, setGithubStatus] = useState({ connected: false });
    const [checkingGithub, setCheckingGithub] = useState(true);

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
    }, []);

    // Sync external showCreateModal with internal isModalOpen
    useEffect(() => {
        if (showCreateModal) {
            setIsModalOpen(true);
            setShowCreateModal(false);
        }
    }, [showCreateModal, setShowCreateModal]);

    const handleCreateWorkspace = async (name) => {
        const response = await workspaceAPI.create(name);
        if (response.success) {
            await fetchWorkspaces();
        }
    };

    const handleConnectGitHub = () => {
        const token = localStorage.getItem('token');
        window.location.href = `${BASE_URL}/api/github/auth?token=${token}`;
    };

    if (!user) return null;

    return (
        <div className="dashboard">
            <WelcomeHeader userName={user.name} />

            <div className="dashboard-content">
                {/* Main Content Area */}
                <main className="dashboard-main">
                    <div className="dashboard-section-header">
                        <h2 className="dashboard-section-title">Your Workspaces</h2>
                        <button
                            className="btn btn-icon mobile-create-btn"
                            onClick={() => setIsModalOpen(true)}
                            aria-label="Create workspace"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-large"></div>
                            <p>Loading workspaces...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
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
                </main>

                {/* Sidebar - Desktop */}
                <aside className="dashboard-sidebar">
                    <div className="sidebar-card github-card">
                        <div className="sidebar-card-header">
                            <h3 className="sidebar-card-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                                GitHub Integration
                            </h3>
                            <span className={`status-dot ${githubStatus.connected ? 'status-connected' : 'status-disconnected'}`} />
                        </div>

                        {checkingGithub ? (
                            <div className="sidebar-loading">
                                <div className="spinner-small"></div>
                            </div>
                        ) : githubStatus.connected ? (
                            <div className="github-connected-content">
                                <p className="github-status-text">
                                    Connected as <strong>{githubStatus.username}</strong>
                                </p>
                                <p className="github-meta-text">
                                    Linked on {new Date(githubStatus.connectedAt).toLocaleDateString()}
                                </p>
                                <button className="btn btn-secondary btn-full" disabled>
                                    Connected
                                </button>
                            </div>
                        ) : (
                            <div className="github-disconnected-content">
                                <p className="github-description">
                                    Connect your GitHub account to import and export code directly.
                                </p>
                                <button onClick={handleConnectGitHub} className="btn btn-primary btn-full github-connect-btn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    Connect GitHub
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
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
