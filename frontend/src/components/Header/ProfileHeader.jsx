import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { authService } from '../../services/api';
import './ProfileHeader.css';

const ProfileHeader = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const userObj = storedUser ? JSON.parse(storedUser) : { username: 'User' };
        return {
            ...userObj,
            avatar: localStorage.getItem('user_avatar') || ''
        };
    });

    useEffect(() => {
        const handleIdentityChange = () => {
            const storedUser = localStorage.getItem('user');
            const userObj = storedUser ? JSON.parse(storedUser) : { username: 'User' };
            setUser({
                ...userObj,
                avatar: localStorage.getItem('user_avatar') || ''
            });
        };

        window.addEventListener('storage', handleIdentityChange);
        // Custom event for same-tab updates
        window.addEventListener('avatarUpdate', handleIdentityChange);
        
        return () => {
            window.removeEventListener('storage', handleIdentityChange);
            window.removeEventListener('avatarUpdate', handleIdentityChange);
        };
    }, []);

    const avatars = [
        { id: 'robot', url: '/avatars/robot.png' },
        { id: 'cat', url: '/avatars/cat.png' },
        { id: 'scientist', url: '/avatars/scientist.png' },
        { id: 'alien', url: '/avatars/alien.png' },
        { id: 'dog', url: '/avatars/dog.png' },
        { id: 'monkey', url: '/avatars/monkey.png' },
        { id: 'coffee_dev', url: '/avatars/coffee_dev.png' },
        { id: 'drone', url: '/avatars/drone.png' },
        { id: 'hamster', url: '/avatars/hamster.png' },
        { id: 'glitch_bot', url: '/avatars/glitch_bot.png' },
        { id: 'wizard', url: '/avatars/wizard.png' },
        { id: 'penguin', url: '/avatars/penguin.png' }
    ];

    const handleLogout = () => {
        authService.logout();
        onLogout(); 
    };

    return (
        <div className="profile-header-container">
            <div className="user-profile-pill" style={{ padding: '4px 8px 4px 4px', gap: '12px' }}>
                <div className="avatar-circle" onClick={() => navigate(`/u/${user.username}`)} style={{
                    cursor:'pointer',
                    overflow: 'hidden',
                    width: '32px',
                    height: '32px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundImage: user.avatar ? `url(${avatars.find(a => a.id === user.avatar)?.url || ''})` : 'none',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                }}>
                    {!user.avatar && <User size={16} />}
                </div>
                <span className="username-text" onClick={() => navigate(`/u/${user.username}`)} style={{cursor:'pointer', marginRight: '8px'}}>
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
