import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { User, Lock, Bell, Palette, Database, Shield, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import '../DatasetPage/DatasetsPage.css';

const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        display_name: '',
        bio: 'AI Researcher & Developer building the future of ML tools.'
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

    const handleSave = async () => {
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

    if (loading) {
        return (
            <div className="section-container" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh'}}>
                <div className="loading-state">Loading account preferences...</div>
            </div>
        );
    }

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
                    <div className="settings-item active" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px', fontWeight:'500' }}>
                        <User size={18} /> Public Profile
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'default', display:'flex', alignItems:'center', gap:'12px' }}>
                        <Palette size={18} /> Appearance
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'default', display:'flex', alignItems:'center', gap:'12px' }}>
                        <Bell size={18} /> Notifications
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'default', display:'flex', alignItems:'center', gap:'12px' }}>
                        <Shield size={18} /> Security
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="glass-card" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:32}}>
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:10 }}>
                        Profile Information
                    </h3>
                    
                    <div style={{display:'flex', gap:'24px', alignItems:'center', marginBottom:'40px', padding:'20px', background:'rgba(255,255,255,0.02)', borderRadius:12}}>
                        <div style={{
                            width:'64px', height:'64px', borderRadius:'50%', 
                            background:'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                            display:'flex', alignItems:'center', justifyContent:'center', 
                            fontSize:'1.5rem', fontWeight:'700', color:'white'
                        }}>
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
                            <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem', fontWeight:500}}>Username</label>
                            <input 
                                type="text" 
                                value={profile.username}
                                onChange={(e) => setProfile({...profile, username: e.target.value})}
                                style={{
                                    width:'100%', padding:'12px', background:'rgba(0,0,0,0.2)', 
                                    border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', 
                                    color:'white', outline:'none'
                                }} 
                            />
                        </div>
                        <div className="form-group">
                            <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem', fontWeight:500}}>Email Address</label>
                            <input 
                                type="email" 
                                value={profile.email}
                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                style={{
                                    width:'100%', padding:'12px', background:'rgba(0,0,0,0.2)', 
                                    border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', 
                                    color:'white', outline:'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{marginBottom:'24px'}}>
                        <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem', fontWeight:500}}>Full Name / Display Name</label>
                        <input 
                            type="text" 
                            value={profile.display_name}
                            onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                            style={{
                                width:'100%', padding:'12px', background:'rgba(0,0,0,0.2)', 
                                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', 
                                color:'white', outline:'none'
                            }} 
                        />
                    </div>

                    <div className="form-group" style={{marginBottom:'32px'}}>
                        <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.85rem', fontWeight:500}}>Professional Bio</label>
                        <textarea 
                            rows={3} 
                            value={profile.bio}
                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                            style={{
                                width:'100%', padding:'12px', background:'rgba(0,0,0,0.2)', 
                                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', 
                                color:'white', outline:'none', fontFamily:'inherit', resize:'none'
                            }}
                        />
                    </div>

                    <div style={{display:'flex', justifyContent:'flex-end', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24}}>
                        <button 
                            className="primary-btn" 
                            onClick={handleSave} 
                            disabled={saving}
                            style={{minWidth:140}}
                        >
                            {saving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
