/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { trainingService, experimentService } from '../../services/api';
import { Box, Download, PlayCircle, BarChart2, CheckCircle2, XCircle } from 'lucide-react';
import '../DatasetPage/DatasetsPage.css'; // Shared Liquid Theme

const ModelsPage = () => {
    const { activeProject } = useLaunch();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRuns = async () => {
            try {
                setLoading(true);
                // Fetch all runs for the user across all projects
                const res = await trainingService.listRuns();
                setRuns(res.data);
            } catch (err) {
                console.error("Failed to fetch models:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRuns();
    }, []);

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed': return <CheckCircle2 size={16} color="#10b981" />;
            case 'Failed': return <XCircle size={16} color="#ef4444" />;
            case 'Running': return <div className="spin"><PlayCircle size={16} color="#3b82f6" /></div>;
            default: return <Box size={16} color="#94a3b8" />;
        }
    };

    return (
        <div className="section-container full-page-table">
            <div className="section-header" style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:40}}>
                <div style={{textAlign:'left'}}>
                    <h1>Model Registry</h1>
                    <p className="subtitle">Track trained models, checkpoints, and performance metrics across all workspaces</p>
                </div>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="loading-state" style={{padding: '40px', textAlign: 'center', color: 'var(--text-dim)'}}>Loading models...</div>
                ) : runs.length === 0 ? (
                    <div className="empty-state">
                        <Box size={48} />
                        <h3>No Models Found</h3>
                        <p>Run training experiments in the ML Arena to generate models.</p>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Experiment Run</th>
                                <th>Project</th>
                                <th>Status</th>
                                <th style={{textAlign:'center'}}>Metric Value</th>
                                <th>Created At</th>
                                <th style={{textAlign:'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="table-item-name">
                                            <Box size={16} className="icon-blue" />
                                            <div>
                                                <div style={{fontWeight:600}}>{r.experiment_name}</div>
                                                <div style={{fontSize:'0.75rem', color:'var(--text-dim)'}}>Run: {r.id.toString().padStart(4, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{color:'var(--text-dim)', fontSize:'0.9rem'}}>{r.project_name}</div>
                                    </td>
                                    <td>
                                        <div className="status-badge" style={{background:'rgba(255,255,255,0.03)', padding:'4px 12px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:8, fontSize:'0.85rem'}}>
                                            {getStatusIcon(r.status)} {r.status}
                                        </div>
                                    </td>
                                    <td style={{textAlign:'center'}}>
                                        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                                            <span style={{color: '#10b981', fontWeight: 700, fontSize:'1.1rem'}}>
                                                {r.metrics?.accuracy ? (r.metrics.accuracy * 100).toFixed(1) + '%' : 
                                                 r.metrics?.r2 ? r.metrics.r2.toFixed(3) : '-'}
                                            </span>
                                            <span style={{fontSize:'0.65rem', opacity:0.5, textTransform:'uppercase'}}>
                                                {r.metrics?.accuracy ? 'Accuracy' : r.metrics?.r2 ? 'R² Score' : 'No Metrics'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{fontSize:'0.85rem', color:'var(--text-dim)'}}>
                                        <div>{new Date(r.created_at).toLocaleDateString()}</div>
                                        <div style={{opacity:0.5}}>{new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                            <button className="icon-btn" title="View Metrics" style={{background:'rgba(255,255,255,0.05)', borderRadius:8}}><BarChart2 size={16}/></button>
                                            {r.model_file && (
                                                <button className="icon-btn" title="Download Artifact" style={{background:'rgba(255,255,255,0.05)', borderRadius:8}}><Download size={16}/></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ModelsPage;
