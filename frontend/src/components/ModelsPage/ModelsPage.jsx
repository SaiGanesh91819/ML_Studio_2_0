/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { trainingService, experimentService, projectService } from '../../services/api';
import { Box, Download, PlayCircle, BarChart2, CheckCircle2, XCircle, Search, Folder } from 'lucide-react';
import '../DatasetPage/DatasetsPage.css'; // Shared Liquid Theme

const ModelsPage = () => {
    const { runId } = useParams();
    const navigate = useNavigate();
    const [runs, setRuns] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState('All Projects');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await projectService.getProjects();
                setProjects(res.data);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            }
        };
        fetchMetadata();
    }, []);

    const fetchRuns = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: searchQuery
            };
            if (projectFilter !== 'All Projects') {
                const proj = projects.find(p => p.name === projectFilter);
                if (proj) params.project_id = proj.id;
            }
            if (statusFilter !== 'All Statuses') {
                params.status = statusFilter;
            }

            const res = await trainingService.listRuns(params);
            setRuns(res.data);
        } catch (err) {
            console.error("Failed to fetch models:", err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, projectFilter, statusFilter, projects]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRuns();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchRuns, runId]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setProjectFilter('All Projects');
        setStatusFilter('All Statuses');
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed': return <CheckCircle2 size={16} color="#10b981" />;
            case 'Failed': return <XCircle size={16} color="#ef4444" />;
            case 'Running': return <div className="spin"><PlayCircle size={16} color="#3b82f6" /></div>;
            default: return <Box size={16} color="#94a3b8" />;
        }
    };

    const completedCount = runs.filter(r => r.status === 'Completed').length;

    return (
        <div className="section-container full-page-table">
            <div className="section-header" style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:40}}>
                <div style={{textAlign:'left'}}>
                    <h1 style={{ textAlign: 'left', marginLeft: 0 }}>Model Registry</h1>
                    <p className="subtitle" style={{ textAlign: 'left' }}>Track trained models, checkpoints, and performance metrics across all workspaces</p>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:30}}>
                    <div className="header-stats" style={{display:'flex', gap:30}}>
                        <div className="stat-mini" style={{ textAlign: 'left' }}>
                            <label style={{fontSize:'0.7rem', textTransform:'uppercase', opacity:0.5, letterSpacing:1}}>Total Runs</label>
                            <div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--primary)'}}>{runs.length}</div>
                        </div>
                        <div className="stat-mini" style={{ textAlign: 'left' }}>
                            <label style={{fontSize:'0.7rem', textTransform:'uppercase', opacity:0.5, letterSpacing:1}}>Completed</label>
                            <div style={{fontSize:'1.2rem', fontWeight:700, color:'#10b981'}}>{completedCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="data-toolbar" style={{display:'flex', gap:15, marginBottom:25, alignItems:'center', background:'rgba(255,255,255,0.02)', padding:15, borderRadius:12, border:'1px solid rgba(255,255,255,0.05)'}}>
                <div className="search-bar" style={{flex:1, position:'relative'}}>
                    <Search size={18} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', opacity:0.4}}/>
                    <input 
                        placeholder="Search by experiment name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{width:'100%', padding:'10px 15px 10px 40px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white', outline:'none'}}
                    />
                </div>
                
                <div style={{display:'flex', gap:10}}>
                    <select 
                        className="filter-select"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        style={{padding:'10px 15px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white', outline:'none'}}
                    >
                        <option>All Projects</option>
                        {projects.map(p => <option key={p.id}>{p.name}</option>)}
                    </select>

                    <select 
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{padding:'10px 15px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white', outline:'none'}}
                    >
                        <option>All Statuses</option>
                        <option>Completed</option>
                        <option>Running</option>
                        <option>Failed</option>
                        <option>Pending</option>
                    </select>

                    <button 
                        className="clear-btn"
                        onClick={handleClearFilters}
                        style={{display:'flex', alignItems:'center', gap:8, padding:'0 20px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'var(--text-dim)', cursor:'pointer', transition:'all 0.2s'}}
                    >
                        <XCircle size={16}/> Clear
                    </button>
                </div>
            </div>

            <div className="data-table-wrapper" style={{background:'rgba(10,10,15,0.4)', borderRadius:16, border:'1px solid rgba(255,255,255,0.05)', overflowX:'auto'}}>
                {loading ? (
                    <div className="loading-state" style={{padding: '80px', textAlign: 'center', color: 'var(--text-dim)', display:'flex', flexDirection:'column', alignItems:'center', gap:15}}>
                         <div className="spin"><Box size={32}/></div>
                        Fetching model registry...
                    </div>
                ) : runs.length === 0 ? (
                    <div className="empty-state" style={{padding:'80px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:20}}>
                        <div style={{width:80, height:80, borderRadius:20, background:'rgba(59, 130, 246, 0.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--primary)'}}>
                            <Box size={40} />
                        </div>
                        <div>
                            <h3 style={{fontSize:'1.3rem', margin:'0 0 8px 0'}}>No Models Found</h3>
                            <p style={{color:'var(--text-dim)', margin:0}}>Run training experiments in the ML Arena or adjust your filters.</p>
                        </div>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Experiment Run</th>
                                <th>Project</th>
                                <th>Status</th>
                                <th style={{textAlign:'center'}}>Performance</th>
                                <th>Created At</th>
                                <th style={{textAlign:'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map(r => (
                                <tr key={r.id} className="dataset-row">
                                    <td>
                                        <div className="table-item-name" style={{display:'flex', alignItems:'center', gap:12}}>
                                            <div className="icon-box-violet">
                                                <Box size={16} />
                                            </div>
                                            <div style={{display:'flex', flexDirection:'column', gap:2}}>
                                                <span style={{fontWeight:600, color:'white'}}>{r.experiment_name}</span>
                                                <span style={{fontSize:'0.7rem', opacity:0.4}}>Run ID: #{r.id.toString().padStart(4, '0')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-badge" title={r.project_name}>
                                            <Folder size={12} style={{opacity:0.8}}/>
                                            <span className="project-name-cell">{r.project_name}</span>
                                        </div>
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
                                            <span style={{fontSize:'0.6rem', opacity:0.5, textTransform:'uppercase'}}>
                                                {r.metrics?.accuracy ? 'Accuracy' : r.metrics?.r2 ? 'R² Score' : 'No Metrics'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display:'flex', flexDirection:'column'}}>
                                            <span style={{fontSize:'0.9rem'}}>{new Date(r.created_at).toLocaleDateString()}</span>
                                            <span style={{fontSize:'0.7rem', opacity:0.4}}>{new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                            <button className="action-pill primary" title="View Metrics">
                                                <BarChart2 size={14}/> Analytics
                                            </button>
                                            {r.model_file && (
                                                <button className="icon-btn-circle" title="Download Artifact">
                                                    <Download size={16}/>
                                                </button>
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
