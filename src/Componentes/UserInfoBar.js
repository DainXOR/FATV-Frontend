import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NotificationCenter from './NotificationCenter';
import '../Estilos/UserInfoBar.css';

const UserInfoBar = ({ name, role }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="user-info-bar">
            <div className="user-text">
                <div className="user-name">{name}</div>
                <div className="user-role">{role}</div>
            </div>
            <button type="button" onClick={handleLogout} style={{ marginRight: 12 }}>
                Cerrar sesión
            </button>
            <img
                src="https://www.w3schools.com/howto/img_avatar.png"
                alt="Avatar"
                className="user-avatar"
            />
            <NotificationCenter />
        </div>
    );
};

export default UserInfoBar;
