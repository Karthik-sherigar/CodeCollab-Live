import MemberItem from './MemberItem';
import { authAPI } from '../services/api';

const MembersPanel = ({ members, userRole, onInvite, workspace, onClose }) => {
    const currentUser = authAPI.getCurrentUser();
    const canInvite = userRole === 'OWNER';

    return (
        <div className="wp-members-panel">
            {/* Panel Header */}
            <div className="wp-members-header">
                <div className="wp-members-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="wp-members-title">Members</span>
                    <span className="wp-count-badge">{members.length}</span>
                </div>

                {canInvite && (
                    <button className="wp-invite-btn" onClick={onInvite} title="Invite member">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Invite
                    </button>
                )}
            </div>

            {/* Members List */}
            <div className="wp-members-list">
                {members.map((member) => (
                    <MemberItem
                        key={member.id}
                        member={member}
                        currentUserId={currentUser?.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default MembersPanel;
