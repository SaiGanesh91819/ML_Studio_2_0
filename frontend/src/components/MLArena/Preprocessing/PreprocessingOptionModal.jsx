import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const PreprocessingOptionModal = ({ type, config, onClose, onSave, stats }) => {
    // Initial state from props, no useEffect syncing needed if key is used
    const [localConfig, setLocalConfig] = useState(config || {});
    
    const handleChange = (key, value) => {
        // Backend expectations normalization:
        // Imputation/Encoding expects 'columns' (array), but UI simulates single column.
        // We will adapt the save/change logic here or in onSave.
        // Actually simplest is to adapt here.
        
        setLocalConfig(prev => {
            const newConfig = { ...prev, [key]: value };
            
            // Auto-format for backend compatibility
            if (['imputation', 'encoding'].includes(type) && key === 'column') {
                newConfig.columns = [value]; // Backend expects list
            }
            
            return newConfig;
        });
    };

    // Helper to get columns
    const columns = stats ? Object.keys(stats).filter(k => k !== 'dataset_stats') : [];

    const renderOptions = () => {
        switch (type) {
            case 'normalization':
                return (
                    <div>
                        <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Method</label>
                            <select 
                                value={localConfig.method || 'minmax'} 
                                onChange={(e) => handleChange('method', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="minmax">Min-Max Scaling</option>
                                <option value="standard">Standard Scaling (Z-Score)</option>
                                <option value="robust">Robust Scaling</option>
                            </select>
                        </div>
                        <div>
                             <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Target Columns (Optional)</label>
                             <div style={{fontSize:'0.8rem', color:'#666', marginBottom:4}}>If empty, applies to all numeric columns.</div>
                             {/* Multi-select or simple text for now */}
                             <select 
                                onChange={(e) => {
                                    const current = localConfig.columns || [];
                                    if (!current.includes(e.target.value)) {
                                        handleChange('columns', [...current, e.target.value]);
                                    }
                                }}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                             >
                                <option value="">Select column to add...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                             <div style={{display:'flex', flexWrap:'wrap', gap:4, marginTop:8}}>
                                 {(localConfig.columns || []).map(c => (
                                     <span key={c} style={{background:'#8b5cf6', color:'#fff', padding:'2px 6px', borderRadius:4, fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4}}>
                                         {c} <X size={12} style={{cursor:'pointer'}} onClick={() => handleChange('columns', localConfig.columns.filter(x => x !== c))}/>
                                     </span>
                                 ))}
                             </div>
                        </div>
                    </div>
                );
            case 'imputation':
                return (
                    <div>
                         <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Target Column</label>
                             <select 
                                value={localConfig.column || ''} 
                                onChange={(e) => handleChange('column', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="">Select column...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                        <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Strategy</label>
                            <select 
                                value={localConfig.strategy || 'mean'} 
                                onChange={(e) => handleChange('strategy', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="mean">Mean</option>
                                <option value="median">Median</option>
                                <option value="mode">Most Frequent</option>
                                <option value="constant">Constant Value</option>
                                <option value="drop">Drop Rows</option>
                            </select>
                        </div>
                         {localConfig.strategy === 'constant' && (
                             <div>
                                <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Fill Value</label>
                                <input 
                                    type="text" 
                                    value={localConfig.fill_value || ''}
                                    onChange={(e) => handleChange('fill_value', e.target.value)}
                                    style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                                />
                             </div>
                         )}
                    </div>
                );
            case 'encoding':
                return (
                    <div>
                        <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Target Column</label>
                             <select 
                                value={localConfig.column || ''} 
                                onChange={(e) => handleChange('column', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="">Select column...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                         <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Method</label>
                            <select 
                                value={localConfig.method || 'label'} 
                                onChange={(e) => handleChange('method', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="label">Label Encoding</option>
                                <option value="onehot">One-Hot Encoding</option>
                            </select>
                        </div>
                    </div>
                );
            case 'cleaning':
                return (
                    <div>
                         <div style={{marginBottom:12}}>
                            <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Action</label>
                            <select 
                                value={localConfig.action || 'drop_duplicates'} 
                                onChange={(e) => handleChange('action', e.target.value)}
                                style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                            >
                                <option value="drop_duplicates">Remove Duplicates</option>
                                <option value="rename">Rename Column</option>
                                <option value="cast">Convert Type</option>
                            </select>
                        </div>
                        {localConfig.action === 'rename' && (
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                                <div>
                                    <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>Column</label>
                                    <select 
                                        value={localConfig.column || ''} 
                                        onChange={(e) => handleChange('column', e.target.value)}
                                        style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                                    >
                                        <option value="">Select...</option>
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{display:'block', marginBottom:4, color:'#aaa', fontSize:'0.9rem'}}>New Name</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.new_name || ''}
                                        onChange={(e) => handleChange('new_name', e.target.value)}
                                        style={{width:'100%', padding:8, background:'#333', border:'1px solid #444', color:'#fff', borderRadius:4}}
                                    />
                                </div>
                             </div>
                        )}
                    </div>
                );
            default:
                return <div>No configuration needed.</div>;
        }
    };

    return (
        <div className="preprocessing-modal-overlay" style={{
            position: 'absolute', inset: 0, zIndex: 1000, 
            display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)'
        }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <div className="preprocessing-option-modal" style={{
                background: '#1a1a1a', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '20px', 
                width: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                color: '#fff'
            }} onClick={e => e.stopPropagation()}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                    <h3 style={{margin:0}}>Configure {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer'}}><X size={18}/></button>
                </div>
                
                <div className="config-form">
                    {renderOptions()}
                </div>

                <div style={{marginTop:20, display:'flex', justifyContent:'flex-end', gap:10}}>
                    <button className="secondary-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-btn" onClick={() => onSave(localConfig)} style={{background:'var(--accent)', color:'#000'}}>
                        <Save size={14} style={{marginRight:6}}/> Save Config
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreprocessingOptionModal;
