import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { authService } from '../../services/api';
import './ProfileHeader.css';

const ProfileHeader = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : { username: 'User' };
    });

    const handleLogout = () => {
        authService.logout();
        onLogout(); 
    };

    return (
        <div className="profile-header-container">
            <div className="user-profile-pill">
                <div className="avatar-circle" onClick={() => navigate(`/u/${user.username}`)} style={{cursor:'pointer'}}>
                    <User size={16} />
                </div>
                <span className="username-text" onClick={() => navigate(`/u/${user.username}`)} style={{cursor:'pointer'}}>
                    {user.username}
                </span>
                
                <div className="logout-btn-mini" onClick={handleLogout} title="Logout">
                    <LogOut size={14} />
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
