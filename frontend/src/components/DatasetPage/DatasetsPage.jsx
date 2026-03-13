/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { datasetService, projectService } from '../../services/api';
import { 
    FileSpreadsheet, 
    Trash2, 
    Eye, 
    Download, 
    Search, 
    Filter, 
    Folder, 
    PlayCircle, 
    Box, 
    Plus 
} from 'lucide-react';
import { toast } from 'sonner';
import Dialog from '../shared/Modal/Dialog';
import './DatasetsPage.css';

const DatasetsPage = () => {
    const navigate = useNavigate();
    const { activeProject, enterArenaWithProject } = useLaunch();
    const [datasets, setDatasets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState('All Projects');
    const [sortBy, setSortBy] = useState('newest');
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [datasetsRes, projectsRes] = await Promise.all([
                    datasetService.list(), // Fetch all user datasets
                    projectService.getProjects()
                ]);
                setDatasets(datasetsRes.data);
                setProjects(projectsRes.data);
            } catch (err) {
                console.error("Failed to load datasets:", err);
                toast.error("Failed to load datasets");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = (id) => {
        setDialogConfig({
            isOpen: true,
            isConfirm: true,
            title: 'Delete Dataset',
            message: 'Are you sure you want to delete this dataset? This action cannot be undone and will affect any experiments using it.',
            type: 'danger',
            confirmText: 'Delete Forever',
            onConfirm: async () => {
                try {
                    await datasetService.delete(id);
                    setDatasets(datasets.filter(d => d.id !== id));
                    toast.success("Dataset deleted successfully");
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to delete dataset");
                }
            }
        });
    };

    const handleOpenInArena = (dataset) => {
        const project = projects.find(p => p.id === dataset.project);
        if (project) {
            enterArenaWithProject({
                id: project.id,
                title: project.name,
                type: project.domain
            });
            navigate(`/projects/${project.id}/train`);
        }
    };

    const filteredDatasets = datasets
        .filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
            const project = projects.find(p => p.id === d.project);
            const matchesProject = projectFilter === 'All Projects' || (project && project.name === projectFilter);
            return matchesSearch && matchesProject;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.uploaded_at) - new Date(a.uploaded_at);
            if (sortBy === 'oldest') return new Date(a.uploaded_at) - new Date(b.uploaded_at);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'size') return b.row_count - a.row_count;
            return 0;
        });

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Unknown Project';
    };

    const totalSize = (datasets.reduce((acc, d) => acc + (d.row_count * 0.1), 0) / 1024).toFixed(2); // Simulated size

    return (
        <div className="section-container full-page-table">
            <div className="section-header">
                <div>
                    <h1>Dataset Explorer</h1>
                    <p className="subtitle">Manage and explore all your scientific data across workspaces</p>
                </div>
                <div className="header-stats" style={{display:'flex', gap:30, marginLeft:'auto', marginRight:40}}>
                    <div className="stat-mini">
                        <label style={{fontSize:'0.7rem', textTransform:'uppercase', opacity:0.5, letterSpacing:1}}>Total Records</label>
                        <div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--accent)'}}>{datasets.reduce((sum, d) => sum + (d.row_count || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="stat-mini">
                        <label style={{fontSize:'0.7rem', textTransform:'uppercase', opacity:0.5, letterSpacing:1}}>Est. Storage</label>
                        <div style={{fontSize:'1.2rem', fontWeight:700, color:'var(--secondary)'}}>{totalSize} MB</div>
                    </div>
                </div>
                <button className="primary-btn" onClick={() => navigate('/projects')}>
                    <Plus size={16}/> New Dataset
                </button>
            </div>

            <div className="data-toolbar" style={{display:'flex', gap:15, marginBottom:25, alignItems:'center', background:'rgba(255,255,255,0.02)', padding:15, borderRadius:12, border:'1px solid rgba(255,255,255,0.05)'}}>
                <div className="search-bar" style={{flex:1, position:'relative'}}>
                    <Search size={18} style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', opacity:0.4}}/>
                    <input 
                        placeholder="Search by name or metadata..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{width:'100%', padding:'10px 15px 10px 40px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white'}}
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
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{padding:'10px 15px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'white', outline:'none'}}
                    >
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                        <option value="name">Sort: A-Z</option>
                        <option value="size">Sort: Size (Rows)</option>
                    </select>
                </div>
            </div>

            <div className="data-table-wrapper" style={{background:'rgba(10,10,15,0.4)', borderRadius:16, border:'1px solid rgba(255,255,255,0.05)', overflowX:'auto'}}>
                {loading ? (
                    <div className="loading-state" style={{padding:'100px', textAlign:'center', color:'var(--text-dim)', display:'flex', flexDirection:'column', alignItems:'center', gap:15}}>
                        <div className="spin"><Box size={32}/></div>
                        Fetching your datasets...
                    </div>
                ) : filteredDatasets.length === 0 ? (
                    <div className="empty-state" style={{padding:'80px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:20}}>
                        <div style={{width:80, height:80, borderRadius:20, background:'rgba(139, 92, 246, 0.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)'}}>
                            <FileSpreadsheet size={40} />
                        </div>
                        <div>
                            <h3 style={{fontSize:'1.3rem', margin:'0 0 8px 0'}}>No Datasets Found</h3>
                            <p style={{color:'var(--text-dim)', margin:0}}>Try adjusting your filters or upload new data in ML Arena.</p>
                        </div>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Dataset Name</th>
                                <th>Project</th>
                                <th>Rows</th>
                                <th>Columns</th>
                                <th>Uploaded</th>
                                <th style={{textAlign:'right'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDatasets.map(d => (
                                <tr key={d.id} className="dataset-row">
                                    <td>
                                        <div className="table-item-name" style={{display:'flex', alignItems:'center', gap:12}}>
                                            <div className="icon-box-violet">
                                                <FileSpreadsheet size={16}/>
                                            </div>
                                            <div style={{display:'flex', flexDirection:'column'}}>
                                                <span style={{fontWeight:500}}>{d.name}</span>
                                                <span style={{fontSize:'0.7rem', opacity:0.5}}>UUID: {d.id.toString().slice(0,8)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-badge" title={getProjectName(d.project)}>
                                            <Folder size={12} style={{opacity:0.6}}/>
                                            <span className="project-name-cell">{getProjectName(d.project)}</span>
                                        </div>
                                    </td>
                                    <td>{d.row_count.toLocaleString()}</td>
                                    <td>{(d.columns || []).length}</td>
                                    <td>
                                        <div style={{display:'flex', flexDirection:'column'}}>
                                            <span>{new Date(d.uploaded_at).toLocaleDateString()}</span>
                                            <span style={{fontSize:'0.7rem', opacity:0.4}}>{new Date(d.uploaded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons" style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
                                            <button 
                                                className="action-pill primary" 
                                                onClick={() => handleOpenInArena(d)}
                                                title="Open in Arena"
                                            >
                                                <PlayCircle size={14}/> Arena
                                            </button>
                                            <button className="icon-btn-circle" title="Download"><Download size={16}/></button>
                                            <button className="icon-btn-circle danger" title="Delete" onClick={() => handleDelete(d.id)}><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div style={{marginTop:20, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 10px'}}>
                <div style={{fontSize:'0.85rem', color:'var(--text-dim)'}}>
                    Showing <b>{filteredDatasets.length}</b> of <b>{datasets.length}</b> datasets
                </div>
                <div style={{display:'flex', gap:5}}>
                     <button className="pagination-btn" disabled>Prev</button>
                     <button className="pagination-btn active">1</button>
                     <button className="pagination-btn" disabled>Next</button>
                </div>
            </div>
            <Dialog 
                {...dialogConfig}
                onClose={() => setDialogConfig({ isOpen: false })}
            />
        </div>
    );
};

export default DatasetsPage;
