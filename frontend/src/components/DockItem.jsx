import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const DockItem = ({ icon, label, onClick, isActive }) => {
    return (
        <button
            className={`dock-item ${isActive ? 'dock-item-active' : ''}`}
            onClick={onClick}
            title={label}
        >
            <span className="dock-icon">{icon}</span>
            <span className="dock-tooltip">{label}</span>
        </button>
    );
};

export default DockItem;
