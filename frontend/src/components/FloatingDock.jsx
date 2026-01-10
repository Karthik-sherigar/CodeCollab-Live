import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import DockItem from './DockItem';

const FloatingDock = ({ onCreateWorkspace }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="floating-dock">
            <DockItem
                icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                label="Dashboard"
                onClick={() => navigate('/dashboard')}
                isActive={isActive('/dashboard')}
            />
            <DockItem
                icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                label="Create Workspace"
                onClick={onCreateWorkspace}
                isActive={false}
            />
            <DockItem
                icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 7L7 13M12 7V13M17 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                }
                label="Sessions"
                onClick={() => navigate('/sessions')}
                isActive={isActive('/sessions')}
            />
            <DockItem
                icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                }
                label="Profile"
                onClick={() => navigate('/profile')}
                isActive={isActive('/profile')}
            />
            <DockItem
                icon={
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                label="Logout"
                onClick={handleLogout}
                isActive={false}
            />
        </div>
    );
};

export default FloatingDock;
