import React from 'react';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { Rocket, Activity, Server, Clock, CheckCircle } from 'lucide-react';
import '../DatasetPage/DatasetsPage.css'; // Shared Liquid Theme

const DeploymentsPage = () => {
    const { activeProject } = useLaunch();
    // Mock deployments for visual completion
    const deployments = [
        { id: 'dep-1', name: 'Price Predictor v2', endpoints: 14502, status: 'Active', latency: '45ms' },
        { id: 'dep-2', name: 'Image Classifier Alpha', endpoints: 320, status: 'Idle', latency: '120ms' },
    ];

    return (
        <div className="section-container">
            <div className="section-header">
                <div className="header-content">
                    <h1>Deployments</h1>
                    <p className="subtitle">Manage API endpoints and monitor inference performance for {activeProject?.title || 'Workspace'}</p>
                </div>
                <button className="create-btn"><Rocket size={16}/> New Deployment</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {deployments.map(d => (
                    <div key={d.id} className="glass-card">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
                            <div style={{fontWeight:'600', fontSize:'1.1rem', color:'var(--text-main)'}}>{d.name}</div>
                            <div className="status-badge" style={{
                                background: d.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                                color: d.status === 'Active' ? '#10b981' : '#94a3b8'
                            }}>
                                <span className="status-dot" style={{background: d.status === 'Active' ? '#10b981' : '#94a3b8'}}></span>
                                {d.status}
                            </div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                            <div>
                                <div style={{fontSize:'0.8rem', color:'var(--text-dim)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px'}}>
                                    <Activity size={14}/> Requests
                                </div>
                                <div style={{fontSize:'1.4rem', fontWeight:'600', color:'var(--text-main)'}}>{d.endpoints.toLocaleString()}</div>
                            </div>
                            <div>
                                <div style={{fontSize:'0.8rem', color:'var(--text-dim)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px'}}>
                                    <Clock size={14}/> Avg Latency
                                </div>
                                <div style={{fontSize:'1.4rem', fontWeight:'600', color:'var(--text-main)'}}>{d.latency}</div>
                            </div>
                        </div>

                        <div style={{marginTop:'24px', paddingTop:'20px', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'0.8rem', color:'var(--text-dim)', fontFamily:'Fira Code, monospace'}}>ID: {d.id}</div>
                            <button className="icon-btn" style={{color:'#3b82f6', paddingLeft:0}}>Manage</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeploymentsPage;
