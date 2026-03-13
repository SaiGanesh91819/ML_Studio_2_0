import React from 'react';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { User, Lock, Bell, Palette, Database, Shield, Save } from 'lucide-react';
import '../DatasetPage/DatasetsPage.css';

const SettingsPage = () => {
    const { activeProject } = useLaunch();
    return (
        <div className="section-container">
            <div className="section-header">
                <div className="header-content">
                    <h1>Settings</h1>
                    <p className="subtitle">Manage account preferences for {activeProject?.title || 'Workspace'}</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* Configuration Sidebar */}
                <div className="settings-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="settings-item active" style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px', fontWeight:'500' }}>
                        <User size={18} /> Profile
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'var(--text-dim)', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.2s' }}>
                        <Palette size={18} /> Appearance
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'var(--text-dim)', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.2s' }}>
                        <Bell size={18} /> Notifications
                    </div>
                    <div className="settings-item" style={{ padding: '12px 16px', color: 'var(--text-dim)', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.2s' }}>
                        <Shield size={18} /> Security
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="glass-card">
                    <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', color:'var(--text-main)' }}>Public Profile</h3>
                    
                    <div style={{display:'flex', gap:'24px', alignItems:'flex-start', marginBottom:'32px'}}>
                        <div style={{
                            width:'80px', height:'80px', borderRadius:'50%', 
                            background:'linear-gradient(135deg, #3b82f6, #60a5fa)', 
                            boxShadow:'0 4px 20px rgba(59, 130, 246, 0.4)',
                            display:'flex', alignItems:'center', justifyContent:'center', 
                            fontSize:'2rem', fontWeight:'600'
                        }}>
                            SG
                        </div>
                        <div>
                            <button className="primary-btn" style={{background:'#334155', marginRight:'12px', boxShadow:'none'}}>Change Avatar</button>
                            <button className="icon-btn" style={{color:'#ef4444'}}>Remove</button>
                        </div>
                    </div>

                    <div className="form-group" style={{marginBottom:'24px'}}>
                        <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.9rem'}}>Display Name</label>
                        <input type="text" defaultValue="Sai Ganesh" className="liquid-input" 
                            style={{
                                width:'100%', padding:'12px', background:'var(--input-bg)', 
                                border:'1px solid var(--border-color)', borderRadius:'8px', 
                                color:'var(--text-main)', outline:'none', fontSize:'0.95rem'
                            }} 
                        />
                    </div>

                    <div className="form-group" style={{marginBottom:'24px'}}>
                        <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.9rem'}}>Email Address</label>
                        <input type="email" defaultValue="sai@example.com" className="liquid-input" 
                             style={{
                                width:'100%', padding:'12px', background:'var(--input-bg)', 
                                border:'1px solid var(--border-color)', borderRadius:'8px', 
                                color:'var(--text-main)', outline:'none', fontSize:'0.95rem'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{marginBottom:'24px'}}>
                        <label style={{display:'block', marginBottom:'8px', color:'var(--text-dim)', fontSize:'0.9rem'}}>Bio</label>
                        <textarea rows={4} defaultValue="AI Researcher & Developer building the future of ML tools." 
                             style={{
                                width:'100%', padding:'12px', background:'var(--input-bg)', 
                                border:'1px solid var(--border-color)', borderRadius:'8px', 
                                color:'var(--text-main)', outline:'none', fontSize:'0.95rem', fontFamily:'inherit'
                            }}
                        />
                    </div>

                    <div style={{display:'flex', justifyContent:'flex-end'}}>
                        <button className="primary-btn"><Save size={16}/> Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
