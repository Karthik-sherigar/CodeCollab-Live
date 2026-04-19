import { authAPI } from '../services/api';

const ROLE_META = {
    OWNER:        { label: 'Owner',        color: '#a78bfa' },
    COLLABORATOR: { label: 'Collaborator', color: '#60a5fa' },
    REVIEWER:     { label: 'Reviewer',     color: '#34d399' },
};

const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const MemberItem = ({ member, currentUserId }) => {
    const isYou  = member.id === currentUserId;
    const meta   = ROLE_META[member.role] || { label: member.role, color: '#9ca3af' };

    return (
        <div className={`wp-member-item ${isYou ? 'wp-member-item--you' : ''}`}>
            <div className="wp-member-avatar" style={{ background: `${meta.color}22`, color: meta.color }}>
                {getInitials(member.name)}
            </div>
            <div className="wp-member-info">
                <div className="wp-member-name">
                    {member.name}
                    {isYou && <span className="wp-you-chip">You</span>}
                </div>
                <div className="wp-member-email">{member.email}</div>
            </div>
            <span className="wp-member-role" style={{ color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}11` }}>
                {meta.label}
            </span>
        </div>
    );
};

export default MemberItem;
