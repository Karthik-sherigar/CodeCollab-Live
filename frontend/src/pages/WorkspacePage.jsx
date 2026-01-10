import { useState, useEffect, useCallback } from 'react';
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
        if (!user) {
            navigate('/login');
            return;
        }
        fetchWorkspace();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleInviteMember = async (email, role) => {
        const response = await workspaceAPI.inviteMember(id, email, role);
        if (response.success) {
            // Update members list
            setWorkspace(prev => ({
                ...prev,
                members: response.members
            }));
        }
    };

    const handleCreateSession = async (title, language) => {
        const response = await workspaceAPI.createSession(id, title, language);
        if (response.success) {
            // Navigate to the new session
            navigate(`/session/${response.sessionId}`);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="workspace-page">
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="workspace-page">
                <div className="error-container">
                    <div className="message message-error">{error}</div>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!workspace) return null;

    return (
        <div className="workspace-page">
            <div className="workspace-content">
                <MembersPanel
                    workspace={workspace}
                    members={workspace.members}
                    userRole={workspace.userRole}
                    onInvite={() => setIsInviteModalOpen(true)}
                />

                <SessionsPanel
                    sessions={workspace.sessions}
                    userRole={workspace.userRole}
                    onCreateSession={() => setIsCreateSessionModalOpen(true)}
                    onSessionDeleted={() => {
                        // Refresh workspace data after session deletion
                        window.location.reload();
                    }}
                />
            </div>

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
