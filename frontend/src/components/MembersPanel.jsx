import MemberItem from './MemberItem';
import { authAPI } from '../services/api';

const MembersPanel = ({ members, userRole, onInvite, workspace, className = '', onClose }) => {
    const currentUser = authAPI.getCurrentUser();
    const canInvite = userRole === 'OWNER';

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
        <div className={`members-panel ${className}`} onClick={(e) => {
            // Close panel if clicking on backdrop (the panel itself, not its children)
            if (e.target.classList.contains('members-panel') && onClose) {
                onClose();
            }
        }}>
            <div className="members-panel-content">
                {/* Mobile close button */}
                {onClose && (
                    <button
                        className="mobile-close-btn"
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '24px',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        ×
                    </button>
                )}

                <div className="workspace-info-header" >
                    <div className="workspace-info-title" style={{ width: '100%' }}>
                        <h2 className="workspace-name-sidebar" style={{ marginBottom: '10px', fontSize: '50px', color: '#A55BE5' }}>{workspace.name}</h2>
                        {/* <span className={getRoleBadgeClass(userRole)}>{userRole}</span> */}
                    </div>
                    {/* <p className="workspace-id-sidebar">Workspace ID: {workspace.id}</p> */}
                </div>

                <div className="panel-header">
                    <h2 className="panel-title">
                        Members
                        <span className="member-count">{members.length}</span>
                    </h2>
                    {canInvite && (
                        <button onClick={onInvite} className="btn btn-primary btn-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Invite
                        </button>
                    )}
                </div>

                <div className="members-list">
                    {members.map((member) => (
                        <MemberItem
                            key={member.id}
                            member={member}
                            currentUserId={currentUser?.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MembersPanel;
