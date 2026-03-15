import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { User, Lock, Bell, Palette, Database, Shield, Save, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import '../DatasetPage/DatasetsPage.css';
import './SettingsPage.css';

const SettingsPage = () => {
    const { tab, username } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : (username ? 'Profile' : 'Profile'));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        display_name: '',
        bio: 'AI Researcher & Developer building the future of ML tools.',
        avatar: localStorage.getItem('user_avatar') || ''
    });

    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);

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

    // Appearance State
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primary_color') || '#8B00FF');

    // Notifications State
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        pushNotifications: false,
        modelReady: true,
        projectUpdates: true
    });

    // Security State
    const [passwordData, setPasswordData] = useState({
        old: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        if (tab) {
            setActiveTab(tab.charAt(0).toUpperCase() + tab.slice(1));
        } else if (username) {
            setActiveTab('Profile');
        }
    }, [tab, username]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authService.getProfile();
                const data = res.data;
                setProfile(prev => ({
                    ...prev,
                    username: data.username || '',
                    email: data.email || '',
                    display_name: data.display_name || `${data.username || ''}`,
                }));
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            await authService.updateProfile({
                username: profile.username,
                email: profile.email,
                display_name: profile.display_name
            });
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error("Failed to update profile");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.new !== passwordData.confirm) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            setSaving(true);
            await authService.changePassword({
                old_password: passwordData.old,
                new_password: passwordData.new
            });
            toast.success("Password updated successfully!");
            setPasswordData({ old: '', new: '', confirm: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update password");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="section-container" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh'}}>
                <div className="loading-state">Loading account preferences...</div>
            </div>
        );
    }

    const navItems = [
        { id: 'Profile', icon: User, label: 'Public Profile' },
        { id: 'Appearance', icon: Palette, label: 'Appearance' },
        { id: 'Notifications', icon: Bell, label: 'Notifications' },
        { id: 'Security', icon: Shield, label: 'Security' }
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'Profile':
                return (
                    <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem'}}>Profile Information</h3>
                        
                        <div style={{
                            display:'flex', 
                            gap:'32px', 
                            alignItems:'center', 
                            marginBottom:'40px', 
                            padding:'24px', 
                            background:'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                            borderRadius:20,
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div className="profile-avatar-wrapper">
                                <div className="profile-avatar-glow" style={{ background: 'var(--primary)' }}></div>
                                {profile.avatar ? (
                                    <div 
                                        className="profile-avatar-img"
                                        style={{ 
                                            backgroundImage: `url(${avatars.find(a => a.id === profile.avatar)?.url || ''})`,
                                            backgroundPosition: 'center',
                                            backgroundSize: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div className="profile-avatar-img" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', fontWeight:'700', color:'white' }}>
                                        {profile.username ? profile.username[0].toUpperCase() : 'U'}
                                    </div>
                                )}
                            </div>

                            <div style={{flex:1}}>
                                <h4 style={{margin:'0 0 4px 0', fontSize:'1.25rem', color: 'white'}}>{profile.display_name}</h4>
                                <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-dim)', letterSpacing: '0.5px'}}>@{profile.username}</p>
                            </div>

                            <button 
                                className="primary-btn" 
                                onClick={() => setShowAvatarModal(true)}
                                style={{
                                    background:'rgba(255,255,255,0.05)', 
                                    border:'1px solid rgba(255,255,255,0.1)', 
                                    boxShadow:'none',
                                    padding: '12px 24px',
                                    borderRadius: '12px'
                                }}
                            >
                                Update Avatar
                            </button>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24}}>
                            <div className="form-group">
                                <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem'}}>Username</label>
                                <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="liquid-input-minimal" />
                            </div>
                            <div className="form-group">
                                <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem'}}>Email Address</label>
                                <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="liquid-input-minimal" />
                            </div>
                        </div>

                        <div className="form-group" style={{marginBottom:24}}>
                            <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem'}}>Display Name</label>
                            <input type="text" value={profile.display_name} onChange={(e) => setProfile({...profile, display_name: e.target.value})} className="liquid-input-minimal" />
                        </div>

                        <div className="form-group" style={{marginBottom:32}}>
                            <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem'}}>Bio</label>
                            <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="liquid-input-minimal" style={{resize:'none'}} />
                        </div>

                        <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24}}>
                            <button className="primary-btn" onClick={handleSaveProfile} disabled={saving} style={{minWidth:140}}>
                                {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                            </button>
                        </div>

                        {/* Avatar Picker Modal */}
                        {showAvatarModal && (
                            <div className="avatar-selection-modal-overlay">
                                <div className="avatar-selection-modal">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                                        <h2 style={{margin:0, fontSize:'1.5rem'}}>Select Visual Identity</h2>
                                        <button onClick={() => setShowAvatarModal(false)} style={{background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer'}}><X size={24}/></button>
                                    </div>
                                    <p style={{color:'var(--text-dim)', fontSize:'0.9rem'}}>Choose an avatar that reflects your persona in the ML Arena.</p>
                                    
                                    <div className="avatar-carousel-container">
                                        <button className="carousel-nav-btn prev" onClick={() => {
                                            document.querySelector('.avatar-carousel').scrollBy({ left: -280, behavior: 'smooth' });
                                        }}><ChevronLeft size={24}/></button>
                                        
                                        <div className="avatar-carousel">
                                            {avatars.map((av) => (
                                                <div 
                                                    key={av.id}
                                                    className={`avatar-option ${selectedAvatar === av.id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedAvatar(av.id)}
                                                    style={{
                                                        backgroundImage: `url(${av.url})`,
                                                        backgroundPosition: 'center',
                                                        backgroundSize: 'cover'
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <button className="carousel-nav-btn next" onClick={() => {
                                            document.querySelector('.avatar-carousel').scrollBy({ left: 280, behavior: 'smooth' });
                                        }}><ChevronRight size={24}/></button>
                                    </div>

                                    <div style={{display:'flex', justifyContent:'flex-end', gap:15, marginTop:30}}>
                                        <button className="secondary-btn" onClick={() => setShowAvatarModal(false)} style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'10px 20px', borderRadius:10, color:'white', cursor:'pointer'}}>Cancel</button>
                                        <button className="primary-btn" onClick={() => {
                                            setProfile({...profile, avatar: selectedAvatar});
                                            localStorage.setItem('user_avatar', selectedAvatar);
                                            window.dispatchEvent(new Event('avatarUpdate'));
                                            setShowAvatarModal(false);
                                            toast.success("Identity updated successfully!");
                                        }} style={{padding:'10px 30px', borderRadius:10}}>Set Identity</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            
            case 'Appearance':
                return (
                    <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem'}}>Visual Preferences</h3>
                        

                        <div style={{marginBottom:32}}>
                            <label style={{display:'block', marginBottom:15, color:'var(--text-dim)', fontSize:'0.9rem'}}>Primary Accent Color</label>
                            <div style={{display:'flex', gap:20}}>
                                {['#8B00FF', '#10b981', '#ef4444', '#f59e0b', '#3b82f6'].map(c => (
                                    <div 
                                        key={c} 
                                        onClick={() => { 
                                            setPrimaryColor(c); 
                                            document.documentElement.style.setProperty('--primary', c);
                                        }}
                                        style={{width:40, height:40, borderRadius:10, background:c, cursor:'pointer', border:primaryColor === c ? '3px solid white' : 'none', transform: primaryColor === c ? 'scale(1.1)' : 'scale(1)', transition:'all 0.2s', boxShadow: primaryColor === c ? `0 0 15px ${c}` : 'none'}} 
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24}}>
                            <button className="primary-btn" onClick={() => {
                                localStorage.setItem('primary_color', primaryColor);
                                toast.success("Theme preferences saved");
                            }}>Save Appearance</button>
                        </div>
                    </div>
                );

            case 'Notifications':
                return (
                    <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem'}}>Notification Settings</h3>
                        <div style={{display:'flex', flexDirection:'column', gap:20}}>
                            {Object.entries(notifications).map(([key, val]) => (
                                <div key={key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 20px', background:'rgba(255,255,255,0.02)', borderRadius:12}}>
                                    <div>
                                        <div style={{textTransform:'capitalize', fontWeight:500}}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                        <div style={{fontSize:'0.8rem', color:'var(--text-dim)'}}>Receive alerts for this channel</div>
                                    </div>
                                    <div 
                                        onClick={() => setNotifications({...notifications, [key]: !val})}
                                        style={{
                                            width:44, height:24, borderRadius:12, padding:2, cursor:'pointer',
                                            background: val ? '#10b981' : 'rgba(255,255,255,0.1)',
                                            transition:'all 0.3s', display:'flex', justifyContent: val ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{width:20, height:20, borderRadius:'50%', background:'white', boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24, marginTop:24}}>
                            <button className="primary-btn" onClick={() => toast.success("Notification preferences saved")}>Update Settings</button>
                        </div>
                    </div>
                );

            case 'Security':
                return (
                    <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem'}}>Security & Integrity</h3>
                        <div style={{marginBottom:32}}>
                            <label style={{display:'block', marginBottom:15, color:'var(--text-dim)', fontSize:'0.9rem'}}>Update Password</label>
                            <div style={{display:'flex', flexDirection:'column', gap:15}}>
                                <input 
                                    type="password" 
                                    placeholder="Current Password" 
                                    className="liquid-input-minimal" 
                                    value={passwordData.old}
                                    onChange={(e) => setPasswordData({...passwordData, old: e.target.value})}
                                />
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    className="liquid-input-minimal" 
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                />
                                <input 
                                    type="password" 
                                    placeholder="Confirm New Password" 
                                    className="liquid-input-minimal" 
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                />
                            </div>
                        </div>

                        <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24}}>
                            <button className="primary-btn" onClick={handlePasswordChange} disabled={saving} style={{background:'#ef4444'}}>
                                {saving ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="section-container">
            <div className="section-header" style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:40}}>
                <div style={{textAlign:'left'}}>
                    <h1>Account Settings</h1>
                    <p className="subtitle">Manage your personal preferences and workspace configuration</p>
                </div>
            </div>

            <div className="settings-grid" style={{display:'grid', gridTemplateColumns:'250px 1fr', gap:'30px'}}>
                {/* Configuration Sidebar */}
                <div className="settings-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => navigate(`/settings/${item.id.toLowerCase()}`)}
                            className={`settings-item ${activeTab === item.id ? 'active' : ''}`} 
                            style={{ 
                                padding: '12px 16px', 
                                background: activeTab === item.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                                color: activeTab === item.id ? '#3b82f6' : 'rgba(255,255,255,0.4)', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                display:'flex', 
                                alignItems:'center', 
                                gap:'12px', 
                                fontWeight:'500',
                                transition: 'all 0.2s'
                            }}
                        >
                            <item.icon size={18} /> {item.label}
                        </div>
                    ))}
                </div>

                {/* Configuration Panel */}
                <div className="settings-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
