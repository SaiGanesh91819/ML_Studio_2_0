import React, { useState } from 'react';
import { X, Check, AlertCircle, ArrowRight, Wand2, Database, Trash2 } from 'lucide-react';

const PreprocessingModal = ({ isOpen, onClose, dataset, onSave, stats }) => {
    const [step, setStep] = useState(1);
    const [ops, setOps] = useState({
        missing: [], // { type: 'impute', strategy: 'mean', columns: [] }
        duplicates: false,
        encoding: [], // { type: 'encode', method: 'label', columns: [] }
        scaling: [],   // { type: 'scale', method: 'standard', columns: [] }
        normalization: [] // { type: 'normalize', method: 'l2', columns: [] }
    });

    if (!isOpen || !dataset) return null;

    const columns = dataset.columns || [];
    const colNames = columns.map(c => c.name);

    // Helper to get columns with missing values
    const missingCols = Object.keys(stats || {}).filter(col => {
        if (col === 'dataset_stats') return false;
        return stats[col]?.missing_count > 0;
    });

    const handleMissingChange = (col, strategy) => {
        setOps(prev => {
            const current = [...prev.missing];
            // Remove existing op for this col
            const filtered = current.map(op => ({
                ...op,
                columns: op.columns.filter(c => c !== col)
            })).filter(op => op.columns.length > 0);

            if (strategy) {
                // Find existing op with same strategy or create new
                const existingOpIdx = filtered.findIndex(op => op.strategy === strategy);
                if (existingOpIdx >= 0) {
                    filtered[existingOpIdx].columns.push(col);
                } else {
                    filtered.push({ type: 'impute', strategy, columns: [col] });
                }
            }
            return { ...prev, missing: filtered };
        });
    };

    const handleEncodingChange = (col, method) => {
        setOps(prev => {
            const current = [...prev.encoding];
            const filtered = current.map(op => ({
                ...op,
                columns: op.columns.filter(c => c !== col)
            })).filter(op => op.columns.length > 0);

            if (method) {
                const existingOpIdx = filtered.findIndex(op => op.method === method);
                if (existingOpIdx >= 0) {
                    filtered[existingOpIdx].columns.push(col);
                } else {
                    filtered.push({ type: 'encode', method, columns: [col] });
                }
            }
            return { ...prev, encoding: filtered };
        });
    };

    const handleScalingChange = (col, method) => {
        setOps(prev => {
            const current = [...prev.scaling];
            const filtered = current.map(op => ({
                ...op,
                columns: op.columns.filter(c => c !== col)
            })).filter(op => op.columns.length > 0);

            if (method) {
                 const existingOpIdx = filtered.findIndex(op => op.method === method);
                if (existingOpIdx >= 0) {
                    filtered[existingOpIdx].columns.push(col);
                } else {
                    filtered.push({ type: 'scale', method, columns: [col] });
                }
            }
            return { ...prev, scaling: filtered };
        });
    };

    const handleNormalizationChange = (col, method) => {
        setOps(prev => {
            const current = [...prev.normalization];
            const filtered = current.map(op => ({
                ...op,
                columns: op.columns.filter(c => c !== col)
            })).filter(op => op.columns.length > 0);

            if (method) {
                 const existingOpIdx = filtered.findIndex(op => op.method === method);
                if (existingOpIdx >= 0) {
                    filtered[existingOpIdx].columns.push(col);
                } else {
                    filtered.push({ type: 'normalize', method, columns: [col] });
                }
            }
            return { ...prev, normalization: filtered };
        });
    };

    const handleApply = () => {
        // Flatten ops into linear steps
        const steps = [];
        // 1. Missing
        ops.missing.forEach(op => steps.push(op));
        // 2. Duplicates
        if (ops.duplicates) {
            steps.push({ type: 'drop_duplicates' });
        }
        // 3. Encoding
        ops.encoding.forEach(op => steps.push(op));
        // 4. Scaling
        ops.scaling.forEach(op => steps.push(op));
        // 5. Normalization
        ops.normalization.forEach(op => steps.push(op));

        onSave(steps);
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="details-modal-overlay">
            <div className="details-modal" style={{width: 800, maxHeight:'85vh', display:'flex', flexDirection:'column'}}>
                <div className="modal-header">
                    <h2 style={{display:'flex', alignItems:'center', gap:8}}><Wand2 className="text-accent" size={20}/> Pre-process Dataset</h2>
                    <button className="icon-btn" onClick={onClose}><X size={18}/></button>
                </div>
                
                <div className="modal-content" style={{flex:1, overflowY:'auto', padding:24}}>
                    
                    {/* Progress Steps */}
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:24, padding:'0 12px'}}>
                        {['Missing Values', 'Cleaning', 'Encoding', 'Scaling', 'Normalization', 'Summary'].map((label, idx) => (
                            <div key={idx} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity: step === idx + 1 ? 1 : 0.4}}>
                                <div style={{
                                    width: 24, height: 24, borderRadius:'50%', 
                                    background: step > idx + 1 ? 'var(--accent)' : (step === idx + 1 ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                                    color: step >= idx + 1 ? '#000' : '#fff',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'0.8rem'
                                }}>
                                    {step > idx + 1 ? <Check size={14}/> : idx + 1}
                                </div>
                                <span style={{fontSize:'0.8rem'}}>{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Missing Values */}
                    {step === 1 && (
                        <div>
                            <h3 style={{marginBottom:16}}>Handle Missing Values</h3>
                            {missingCols.length === 0 ? (
                                <div className="info-box">
                                    <Check className="text-success" size={16}/> No missing values detected in this dataset.
                                </div>
                            ) : (
                                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                                    <thead>
                                        <tr style={{textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                            <th style={{padding:8}}>Column</th>
                                            <th style={{padding:8}}>Type</th>
                                            <th style={{padding:8}}>Missing Count</th>
                                            <th style={{padding:8}}>Strategy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {missingCols.map(col => (
                                            <tr key={col} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                                <td style={{padding:8}}>{col}</td>
                                                <td style={{padding:8, opacity:0.7}}>{stats[col].data_type}</td>
                                                <td style={{padding:8, color:'#ef4444'}}>{stats[col].missing_count}</td>
                                                <td style={{padding:8}}>
                                                    <select 
                                                        style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 8px', borderRadius:4, color:'white'}}
                                                        onChange={(e) => handleMissingChange(col, e.target.value)}
                                                    >
                                                        <option value="">Do Nothing</option>
                                                        <option value="drop_rows">Drop Rows</option>
                                                        {['int64', 'float64'].includes(stats[col].data_type) && (
                                                            <>
                                                                <option value="mean">Mean</option>
                                                                <option value="median">Median</option>
                                                                <option value="constant">Constant (0)</option>
                                                            </>
                                                        )}
                                                        <option value="mode">Mode (Most Frequent)</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Step 2: Cleaning */}
                    {step === 2 && (
                        <div style={{display:'flex', flexDirection:'column', gap:16}}>
                            <h3>Data Cleaning</h3>
                            <div className="card" style={{padding:16, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.03)'}}>
                                <div>
                                    <h4 style={{margin:0, marginBottom:4}}>Remove Duplicates</h4>
                                    <p style={{margin:0, fontSize:'0.85rem', opacity:0.7}}>Identify and remove identical rows from the dataset.</p>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:8}}>
                                    <input 
                                        type="checkbox" 
                                        width={20}
                                        checked={ops.duplicates}
                                        onChange={(e) => setOps(p => ({...p, duplicates: e.target.checked}))}
                                        style={{transform:'scale(1.5)'}}
                                    />
                                    <label>Enable</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Encoding */}
                    {step === 3 && (
                        <div>
                            <h3 style={{marginBottom:16}}>Categorical Encoding</h3>
                            <p style={{fontSize:'0.9rem', opacity:0.7, marginBottom:16}}>Convert text/categorical columns into numbers for machine learning models.</p>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                                <thead>
                                    <tr style={{textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                        <th style={{padding:8}}>Column</th>
                                        <th style={{padding:8}}>Unique Values</th>
                                        <th style={{padding:8}}>Encoding Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {colNames.filter(c => stats[c] && ['object', 'category', 'bool'].some(t =>  String(stats[c].data_type).includes(t))).map(col => (
                                        <tr key={col} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                            <td style={{padding:8}}>{col}</td>
                                            <td style={{padding:8}}>{stats[col].unique_count}</td>
                                            <td style={{padding:8}}>
                                                <select 
                                                    style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 8px', borderRadius:4, color:'white'}}
                                                    onChange={(e) => handleEncodingChange(col, e.target.value)}
                                                >
                                                    <option value="">None</option>
                                                    <option value="label">Label Encoding (0, 1, 2...)</option>
                                                    <option value="onehot">One-Hot Encoding (Cols 0/1)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Step 4: Scaling */}
                    {step === 4 && (
                        <div>
                            <h3 style={{marginBottom:16}}>Feature Scaling</h3>
                            <p style={{fontSize:'0.9rem', opacity:0.7, marginBottom:16}}>Normalize numerical features to the same scale.</p>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                                <thead>
                                    <tr style={{textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                        <th style={{padding:8}}>Column</th>
                                        <th style={{padding:8}}>Range (Min - Max)</th>
                                        <th style={{padding:8}}>Scaling Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {colNames.filter(c => stats[c] && ['int', 'float'].some(t => String(stats[c].data_type).includes(t)) && !['target', 'label'].includes(c.toLowerCase())).map(col => (
                                        <tr key={col} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                            <td style={{padding:8}}>{col}</td>
                                            <td style={{padding:8}}>{stats[col].min?.toFixed(2)} - {stats[col].max?.toFixed(2)}</td>
                                            <td style={{padding:8}}>
                                                <select 
                                                    style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 8px', borderRadius:4, color:'white'}}
                                                    onChange={(e) => handleScalingChange(col, e.target.value)}
                                                >
                                                    <option value="">None</option>
                                                    <option value="standard">Standard Scaler (Z-Score)</option>
                                                    <option value="minmax">MinMax Scaler (0-1)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Step 5: Normalization */}
                    {step === 5 && (
                        <div>
                            <h3 style={{marginBottom:16}}>Normalization (L2/L1)</h3>
                            <p style={{fontSize:'0.9rem', opacity:0.7, marginBottom:16}}>Scale individual samples to have unit norm.</p>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9rem'}}>
                                <thead>
                                    <tr style={{textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                        <th style={{padding:8}}>Column</th>
                                        <th style={{padding:8}}>Range</th>
                                        <th style={{padding:8}}>Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {colNames.filter(c => stats[c] && ['int', 'float'].some(t => String(stats[c].data_type).includes(t)) && !['target', 'label'].includes(c.toLowerCase())).map(col => (
                                        <tr key={col} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                            <td style={{padding:8}}>{col}</td>
                                            <td style={{padding:8}}>{stats[col].min?.toFixed(2)} - {stats[col].max?.toFixed(2)}</td>
                                            <td style={{padding:8}}>
                                                <select 
                                                    style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 8px', borderRadius:4, color:'white'}}
                                                    onChange={(e) => handleNormalizationChange(col, e.target.value)}
                                                >
                                                    <option value="">None</option>
                                                    <option value="l2">L2 Norm (Euclidean)</option>
                                                    <option value="l1">L1 Norm (Manhattan)</option>
                                                    <option value="max">Max Norm</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Step 6: Summary */}
                    {step === 6 && (
                        <div>
                            <h3 style={{marginBottom:16}}>Pre-processing Summary</h3>
                            <div className="card" style={{padding:16, background:'rgba(255,255,255,0.03)'}}>
                                <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8}}>
                                    <li style={{display:'flex', gap:8}}><div style={{minWidth:120, opacity:0.7}}>Missing Values:</div> <div>{ops.missing.reduce((acc, op) => acc + op.columns.length, 0)} columns</div></li>
                                    <li style={{display:'flex', gap:8}}><div style={{minWidth:120, opacity:0.7}}>Duplicates:</div> <div>{ops.duplicates ? 'Remove' : 'Keep'}</div></li>
                                    <li style={{display:'flex', gap:8}}><div style={{minWidth:120, opacity:0.7}}>Encoding:</div> <div>{ops.encoding.reduce((acc, op) => acc + op.columns.length, 0)} columns</div></li>
                                    <li style={{display:'flex', gap:8}}><div style={{minWidth:120, opacity:0.7}}>Scaling:</div> <div>{ops.scaling.reduce((acc, op) => acc + op.columns.length, 0)} columns</div></li>
                                    <li style={{display:'flex', gap:8}}><div style={{minWidth:120, opacity:0.7}}>Normalization:</div> <div>{ops.normalization.reduce((acc, op) => acc + op.columns.length, 0)} columns</div></li>
                                </ul>
                            </div>
                            <div className="info-box" style={{marginTop:20}}>
                                <Database size={16} className="text-secondary"/> A new dataset version will be created: <span style={{fontWeight:'bold'}}>{dataset.name} (Processed)</span>
                            </div>
                        </div>
                    )}

                </div>

                <div className="modal-footer" style={{display:'flex', justifyContent:'space-between'}}>
                    <button className="secondary-btn" onClick={step === 1 ? onClose : prevStep}>
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button className="primary-btn" onClick={step === 6 ? handleApply : nextStep}>
                        {step === 6 ? 'Apply & Create Dataset' : 'Next'} <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreprocessingModal;
