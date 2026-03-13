import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Folder } from 'lucide-react';

const EditWorkspaceModal = ({ onClose, onUpdate, project }) => {
    const [formData, setFormData] = useState({ 
        name: project ? project.title : '', 
        domain: project ? project.type : 'Tabular', 
        desc: project ? project.desc : ''
    });

    const DOMAINS = [
        { id: 'Tabular', label: 'Tabular', info: 'Table Data' },
        { id: 'NLP', label: 'NLP', info: 'Language' },
        { id: 'CV', label: 'CV', info: 'Vision' }
    ];

    const handleSubmit = () => {
        onUpdate(project.id, formData);
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ margin: 0 }}>Edit Workspace</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '24px' }}>Configure your machine learning environment details.</p>
                
                <div className="modal-form">
                    <div className="form-group">
                        <label>Workspace Name</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Problem Domain</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
                            {DOMAINS.map(d => (
                                <div 
                                    key={d.id} 
                                    onClick={() => setFormData({...formData, domain: d.id})}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid',
                                        borderColor: formData.domain === d.id ? 'var(--primary)' : 'var(--border-color)',
                                        background: formData.domain === d.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--input-bg)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: formData.domain === d.id ? 'var(--text-main)' : 'var(--text-dim)', fontSize: '0.9rem' }}>{d.label}</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{d.info}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea 
                            className="form-input" 
                            rows="3"
                            style={{ resize: 'none', height: 'auto' }}
                            value={formData.desc}
                            onChange={e => setFormData({...formData, desc: e.target.value})}
                        />
                    </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '32px' }}>
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit}>Save Changes</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditWorkspaceModal;
