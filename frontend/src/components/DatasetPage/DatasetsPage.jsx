/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { datasetService } from '../../services/api';
import { FileSpreadsheet, Trash2, Eye, Download, Search, Filter } from 'lucide-react';
import Dialog from '../shared/Modal/Dialog';
import './DatasetsPage.css';

const DatasetsPage = () => {
    const { activeProject } = useLaunch();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                setLoading(true);
                const res = await datasetService.list(activeProject.id);
                setDatasets(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (activeProject) {
            fetchDatasets();
        } else {
            setLoading(false);
        }
    }, [activeProject]);

    const handleDelete = (id) => {
        setDialogConfig({
            isOpen: true,
            isConfirm: true,
            title: 'Delete Dataset',
            message: 'Are you sure you want to delete this dataset? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Forever',
            onConfirm: async () => {
                try {
                    await datasetService.delete(id);
                    setDatasets(datasets.filter(d => d.id !== id));
                } catch (err) {
                    console.error(err);
                }
            }
        });
    };

    const filteredDatasets = datasets.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!activeProject) {
        return (
            <div className="section-container">
                <div className="empty-state">
                    <h2>No Active Project</h2>
                    <p>Select a project to view datasets.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="section-container full-page-table">
            <div className="section-header">
                <div>
                    <h1>Datasets</h1>
                    <p className="subtitle">Manage raw data and feature stores for {activeProject.title}</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar">
                        <Search size={16} />
                        <input 
                            placeholder="Search datasets..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="primary-btn"><Filter size={16}/> Filter</button>
                </div>
            </div>

            <div className="data-table-wrapper">
                {loading ? (
                    <div className="loading-state" style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Loading datasets...</div>
                ) : filteredDatasets.length === 0 ? (
                    <div className="empty-state">
                        <FileSpreadsheet size={48} />
                        <h3>No Datasets Found</h3>
                        <p>Upload data in the ML Arena to see it here.</p>
                    </div>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Rows</th>
                                <th>Size</th>
                                <th>Uploaded At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDatasets.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <div className="table-item-name">
                                            <FileSpreadsheet size={16} className="icon-blue" />
                                            {d.name}
                                        </div>
                                    </td>
                                    <td>{d.row_count}</td>
                                    <td>{(Math.random() * 10 + 1).toFixed(1)} MB</td> {/* Mock size */}
                                    <td>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons" style={{display:'flex', gap:'8px'}}>
                                            <button className="icon-btn" title="Preview"><Eye size={16}/></button>
                                            <button className="icon-btn" title="Download"><Download size={16}/></button>
                                            <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(d.id)}><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <Dialog 
                {...dialogConfig}
                onClose={() => setDialogConfig({ isOpen: false })}
            />
        </div>
    );
};

export default DatasetsPage;
