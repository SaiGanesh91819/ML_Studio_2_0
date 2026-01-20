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
                // Fetch runs across all experiments in the project
                const expRes = await experimentService.list(activeProject.id);
                let allRuns = [];
                for (const exp of expRes.data) {
                    const runRes = await trainingService.listRuns(exp.id);
                    // Attach experiment name to run
                    const runsWithMeta = runRes.data.map(r => ({ ...r, experimentName: exp.name }));
                    allRuns = [...allRuns, ...runsWithMeta];
                }
                // Sort by Date Desc
                allRuns.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                setRuns(allRuns);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (activeProject) {
            fetchRuns();
        } else {
            setLoading(false);
        }
    }, [activeProject]);

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
            <div className="section-header">
                <div>
                    <h1>Model Registry</h1>
                    <p className="subtitle">Track trained models, checkpoints, and performance metrics.</p>
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
                                <th>Status</th>
                                <th>Accuracy</th>
                                <th>Loss</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map(r => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="table-item-name">
                                            <Box size={16} className="icon-blue" />
                                            <div>
                                                <div>{r.experimentName}</div>
                                                <div style={{fontSize:'0.75rem', color:'var(--text-dim)'}}>Run ID: {r.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="status-badge">
                                            {getStatusIcon(r.status)} {r.status}
                                        </div>
                                    </td>
                                    <td style={{color: '#10b981', fontWeight: 600}}>
                                        {r.metrics?.accuracy ? (r.metrics.accuracy * 100).toFixed(2) + '%' : '-'}
                                    </td>
                                    <td>
                                        {r.metrics?.loss?.toFixed(4) || '-'}
                                    </td>
                                    <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString()}</td>
                                    <td>
                                        <div className="action-buttons" style={{display:'flex', gap:'8px'}}>
                                            <button className="icon-btn" title="View Metrics"><BarChart2 size={16}/></button>
                                            {r.model_file && (
                                                <button className="icon-btn" title="Download Artifact"><Download size={16}/></button>
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
