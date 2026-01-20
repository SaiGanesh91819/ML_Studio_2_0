import React, { useState } from 'react';
import { X, Folder, Upload, Type, AlertCircle } from 'lucide-react';

const EditWorkspaceModal = ({ onClose, onUpdate, project }) => {
    const [formData, setFormData] = useState({ 
        name: project ? project.title : '', 
        domain: project ? project.type : 'Tabular', 
        desc: project ? project.desc : ''
        // No dataset_file or target_col as we don't edit them here
    });

    const DOMAINS = ['Tabular', 'NLP', 'CV'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Workspace</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Workspace Name</label>
                        <div className="input-wrapper">
                            <Folder size={18} className="input-icon" />
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="e.g. Sales Forecast Q4" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Problem Domain</label>
                        <div className="domain-grid">
                            {DOMAINS.map(d => (
                                <div 
                                    key={d} 
                                    className={`domain-card ${formData.domain === d ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, domain: d})}
                                >
                                    <span>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            className="form-input textarea" 
                            placeholder="Brief description of the project..."
                            value={formData.desc}
                            onChange={e => setFormData({...formData, desc: e.target.value})}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-create" onClick={() => onUpdate(project.id, formData)}>Update Workspace</button>
                </div>
            </div>
        </div>
    );
};

export default EditWorkspaceModal;
