import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './ProjectsPage.css'; // Shared styles

const CreateWorkspaceModal = ({ onClose, onCreate, initialData = null }) => {
    const [formData, setFormData] = useState({ 
        name: initialData ? initialData.title : '', 
        domain: initialData ? initialData.domain : 'Tabular', 
        desc: initialData ? initialData.description : '',

    });

    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            setError('Project name is required');
            return;
        }
        setError('');
        onCreate(formData);
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{initialData ? 'Edit Workspace' : 'Create New Workspace'}</h2>
                <p>{initialData ? 'Update project details.' : 'Initialize a new machine learning environment.'}</p>
                
                <div className="modal-form">
                    <div className="form-group">
                        <label>Project Name <span style={{color: '#ff4757'}}>*</span></label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Sales Forecast 2026" 
                            value={formData.name}
                            onChange={e => {
                                setFormData({...formData, name: e.target.value});
                                if (error) setError('');
                            }}
                            autoFocus
                            style={{ borderColor: error ? '#ff4757' : '' }}
                        />
                        {error && <span style={{color: '#ff4757', fontSize: '0.8rem', marginTop: '4px'}}>{error}</span>}
                    </div>
                    <div className="form-group">
                        <label>Domain</label>
                        <select 
                            className="form-input"
                            value={formData.domain}
                            onChange={e => setFormData({...formData, domain: e.target.value})}
                        >
                            <option value="Tabular">Tabular Classification/Regression</option>
                            <option value="CV">Computer Vision (Images)</option>
                            <option value="NLP">Natural Language Processing</option>
                        </select>
                    </div>





                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Brief description of the goal..." 
                            value={formData.desc}
                            onChange={e => setFormData({...formData, desc: e.target.value})}
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit}>
                        {initialData ? 'Save Changes' : 'Create Workspace'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateWorkspaceModal;
