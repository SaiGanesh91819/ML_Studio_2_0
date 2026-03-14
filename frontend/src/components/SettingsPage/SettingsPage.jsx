import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { User, Lock, Bell, Palette, Database, Shield, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import '../DatasetPage/DatasetsPage.css';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('Profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Profile State
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        display_name: '',
        bio: 'AI Researcher & Developer building the future of ML tools.'
    });

    // Appearance State
    const [theme, setTheme] = useState('Dark');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');

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
                        <div style={{display:'flex', gap:'24px', alignItems:'center', marginBottom:'40px', padding:'20px', background:'rgba(255,255,255,0.02)', borderRadius:12}}>
                            <div style={{width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg, #3b82f6, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:'700', color:'white'}}>
                                {profile.username ? profile.username[0].toUpperCase() : 'U'}
                            </div>
                            <div style={{flex:1}}>
                                <h4 style={{margin:0, fontSize:'1.1rem'}}>{profile.display_name}</h4>
                                <p style={{margin:0, fontSize:'0.85rem', color:'var(--text-dim)'}}>@{profile.username}</p>
                            </div>
                            <button className="primary-btn" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'none'}}>Update Avatar</button>
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
                    </div>
                );
            
            case 'Appearance':
                return (
                    <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem'}}>Visual Preferences</h3>
                        <div style={{marginBottom:32}}>
                            <label style={{display:'block', marginBottom:15, color:'var(--text-dim)', fontSize:'0.9rem'}}>Interface Theme</label>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:15}}>
                                {['Light', 'Dark', 'System'].map(t => (
                                    <div 
                                        key={t} 
                                        onClick={() => {
                                            setTheme(t);
                                            document.documentElement.setAttribute('data-theme', t.toLowerCase());
                                            localStorage.setItem('theme_mode', t.toLowerCase());
                                            toast.success(`Theme switched to ${t}`);
                                        }}
                                        style={{
                                            padding:20, borderRadius:12, border:`1px solid ${theme === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                                            background: theme === t ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                                            textAlign:'center', cursor:'pointer', transition:'all 0.2s',
                                            color: theme === t ? 'white' : 'rgba(255,255,255,0.5)'
                                        }}
                                    >
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{marginBottom:32}}>
                            <label style={{display:'block', marginBottom:15, color:'var(--text-dim)', fontSize:'0.9rem'}}>Primary Accent Color</label>
                            <div style={{display:'flex', gap:20}}>
                                {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'].map(c => (
                                    <div 
                                        key={c} 
                                        onClick={() => { 
                                            setPrimaryColor(c); 
                                            document.documentElement.style.setProperty('--primary', c);
                                            localStorage.setItem('primary_color', c);
                                            toast.success(`Primary color changed!`); 
                                        }}
                                        style={{width:40, height:40, borderRadius:10, background:c, cursor:'pointer', border:primaryColor === c ? '3px solid white' : 'none', transform: primaryColor === c ? 'scale(1.1)' : 'scale(1)', transition:'all 0.2s', boxShadow: primaryColor === c ? `0 0 15px ${c}` : 'none'}} 
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24}}>
                            <button className="primary-btn" onClick={() => toast.success("Theme preferences saved")}>Save Appearance</button>
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
                            onClick={() => setActiveTab(item.id)}
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
