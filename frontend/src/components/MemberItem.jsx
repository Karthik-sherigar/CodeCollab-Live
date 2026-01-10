import { authAPI } from '../services/api';

const MemberItem = ({ member, currentUserId }) => {
    const isCurrentUser = member.id === currentUserId;
    const isOwner = member.role === 'OWNER';

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
        <div className={`member-item ${isCurrentUser ? 'member-current' : ''} ${isOwner ? 'member-owner' : ''}`}>
            <div className="member-info">
                <div className="member-name">
                    {member.name}
                    {isCurrentUser && <span className="member-you-badge">You</span>}
                </div>
                <div className="member-email">{member.email}</div>
            </div>
            <span className={getRoleBadgeClass(member.role)}>{member.role}</span>
        </div>
    );
};

export default MemberItem;
