/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import { authService } from '../../services/api';
import './ProfileHeader.css';

const ProfileHeader = ({ onLogout }) => {
    const [user, setUser] = useState({ username: 'User' });
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        
        // Load theme
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = () => {
        authService.logout();
        onLogout(); 
    };

    return (
        <div className="profile-header-container">
            <div className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            
            <div className="user-profile-pill">
                <div className="avatar-circle">
                    <User size={16} />
                </div>
                <span className="username-text">{user.username}</span>
                
                <div className="logout-btn-mini" onClick={handleLogout} title="Logout">
                    <LogOut size={14} />
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
