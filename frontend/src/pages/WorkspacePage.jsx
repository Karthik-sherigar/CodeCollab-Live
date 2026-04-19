import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, workspaceAPI } from '../services/api';
import MembersPanel from '../components/MembersPanel';
import SessionsPanel from '../components/SessionsPanel';
import InviteMemberModal from '../components/InviteMemberModal';
import CreateSessionModal from '../components/CreateSessionModal';

const WorkspacePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authAPI.getCurrentUser();

    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const fetchWorkspace = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await workspaceAPI.getById(id);
            if (response.success) {
                setWorkspace(response.workspace);
            }
        } catch (err) {
            console.error('Failed to fetch workspace:', err);
            if (err.response?.status === 403) {
                setError('Access denied. You are not a member of this workspace.');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError('Failed to load workspace');
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchWorkspace();
    }, []); // eslint-disable-line

    const handleInviteMember = async (email, role) => {
        const response = await workspaceAPI.inviteMember(id, email, role);
        if (response.success) {
            setWorkspace(prev => ({ ...prev, members: response.members }));
        }
    };

    const handleCreateSession = async (title, language) => {
        const response = await workspaceAPI.createSession(id, title, language);
        if (response.success) {
            navigate(`/session/${response.sessionId}`);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="wp-loading-screen">
                <div className="wp-spinner"></div>
                <p className="wp-loading-text">Loading workspace…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wp-loading-screen">
                <div className="wp-error-box">
                    <span className="wp-error-icon">⚠️</span>
                    <p>{error}</p>
                    <button className="wp-back-btn" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!workspace) return null;

    return (
        <div className="wp-root">

            {/* ── Top Navigation Bar ── */}
            <header className="wp-topbar">
                <div className="wp-topbar-left">
                    <button
                        className="wp-nav-btn"
                        onClick={() => navigate('/dashboard')}
                        aria-label="Back to dashboard"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span className="wp-nav-label">Dashboard</span>
                    </button>

                    <div className="wp-breadcrumb-divider" aria-hidden="true">/</div>

                    <div className="wp-workspace-identity">
                        <div className="wp-workspace-avatar">
                            {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="wp-workspace-name">{workspace.name}</h1>
                            <p className="wp-workspace-meta">
                                <span className={`wp-role-chip wp-role-${workspace.userRole?.toLowerCase()}`}>
                                    {workspace.userRole}
                                </span>
                                <span className="wp-meta-sep">·</span>
                                {workspace.members?.length} member{workspace.members?.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="wp-topbar-right">
                    {/* Mobile: toggle sidebar */}
                    <button
                        className="wp-mobile-sidebar-toggle"
                        onClick={() => setIsMobileSidebarOpen(v => !v)}
                        aria-label="Toggle members"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </button>

                    {(workspace.userRole === 'OWNER' || workspace.userRole === 'COLLABORATOR') && (
                        <button
                            className="wp-create-session-btn"
                            onClick={() => setIsCreateSessionModalOpen(true)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            <span>New Session</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main Layout ── */}
            <div className="wp-layout">

                {/* ── Mobile Backdrop (OUTSIDE sidebar so it covers full page) ── */}
                {isMobileSidebarOpen && (
                    <div
                        className="wp-sidebar-backdrop"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar: Members ── */}
                <aside className={`wp-sidebar ${isMobileSidebarOpen ? 'wp-sidebar--open' : ''}`}>
                    <div className="wp-sidebar-inner">
                        <MembersPanel
                            workspace={workspace}
                            members={workspace.members}
                            userRole={workspace.userRole}
                            onInvite={() => { setIsInviteModalOpen(true); setIsMobileSidebarOpen(false); }}
                            onClose={() => setIsMobileSidebarOpen(false)}
                        />
                    </div>
                </aside>

                {/* ── Main: Sessions ── */}
                <main className="wp-main">
                    <SessionsPanel
                        sessions={workspace.sessions}
                        userRole={workspace.userRole}
                        onCreateSession={() => setIsCreateSessionModalOpen(true)}
                        onSessionDeleted={() => window.location.reload()}
                    />
                </main>
            </div>

            {/* ── Modals ── */}
            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInviteMember}
            />
            <CreateSessionModal
                isOpen={isCreateSessionModalOpen}
                onClose={() => setIsCreateSessionModalOpen(false)}
                onCreateSession={handleCreateSession}
            />
        </div>
    );
};

export default WorkspacePage;
