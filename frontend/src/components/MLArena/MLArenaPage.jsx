/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { useLaunch } from '../../context/LaunchContext.jsx';
import { datasetService, trainingService, projectService, experimentService } from '../../services/api'; 
// import PreprocessingModal from './PreprocessingModal'; 
import PreprocessingCanvasWrapper from './Preprocessing/PreprocessingCanvas';
import CorrelationHeatmap from './CorrelationHeatmap';
import { toast } from 'sonner';
import { 
    Upload, Play, Square, Save, Layers, Database, 
    Settings, ChevronRight, X, Terminal, Maximize2, 
    Minimize2, Activity, PlayCircle, AlertCircle,
    FileText, Trash2, Eraser, Wand2, Check, ArrowRight,
    Edit3, PlusCircle, Download
} from 'lucide-react';
import './MLArenaPage.css';


const MLArenaPage = () => {
    const { activeProject, resetLaunch } = useLaunch();
    
    // --- Layout States (Moved to top level) ---
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [propWidth, setPropWidth] = useState(400);
    const [consoleHeight, setConsoleHeight] = useState(200);

    // --- Data States ---
    const [datasets, setDatasets] = useState([]);
    const [activeDataset, setActiveDataset] = useState(null);
    const [stats, setStats] = useState(null); 
    const [previewData, setPreviewData] = useState([]); 

    // --- Model Selection State ---
    const [selectedTask, setSelectedTask] = useState(null); 
    const [selectedProblem, setSelectedProblem] = useState(null); 
    const [selectedAlgo, setSelectedAlgo] = useState(null); 
    const [trainSplit, setTrainSplit] = useState(0.8);
    const [modelConfig, setModelConfig] = useState({});
    const [targetCol, setTargetCol] = useState('');
    const [featureCols, setFeatureCols] = useState([]);
    const [isConfigured, setIsConfigured] = useState(false); // New state for workflow

    // Reset config when algo changes
    useEffect(() => {
        if (selectedAlgo) {
            setIsConfigured(false);
            // Default configs
            if (activeDataset && activeDataset.columns && activeDataset.columns.length > 0) {
                 const cols = activeDataset.columns.map(c => c.name);
                 setTargetCol(cols[cols.length - 1]); // Default last col as target
                 setFeatureCols(cols.slice(0, cols.length - 1)); // Rest as features
            }
            if (selectedAlgo.id.includes('forest')) setModelConfig({ n_estimators: 100, max_depth: 10 });
            else if (selectedAlgo.id.includes('regression')) setModelConfig({ learning_rate: 0.01, epochs: 100 });
            else if (selectedAlgo.id.includes('svc')) setModelConfig({ C: 1.0, kernel: 'rbf' });
            else setModelConfig({}); 
        }
    }, [selectedAlgo]);
    
    // --- UI State ---
    const [isTraining, setIsTraining] = useState(false);
    const [logs, setLogs] = useState([]);
    const [selectedColumnForStats, setSelectedColumnForStats] = useState('');
    const [activeRun, setActiveRun] = useState(null);
    const [showDataSheet, setShowDataSheet] = useState(false);
    const [showPreprocessing, setShowPreprocessing] = useState(false);
    const [showCorrelation, setShowCorrelation] = useState(false);
    const [correlationData, setCorrelationData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState([]); // Full data for editing
    const pageSize = 50;

    // --- Refs ---
    const workspaceRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Loading Data ---
    const addLog = (message) => setLogs(prev => [...prev, message]);

    const loadDatasets = async () => {
        try {
            const res = await datasetService.list(activeProject.id);
            setDatasets(res.data);
        } catch (err) {
            console.error("Failed to load datasets", err);
        }
    };

    useEffect(() => {
        if (activeProject) {
            loadDatasets();
        }
    }, [activeProject]);

    // Auto-select first dataset if available and none selected
    useEffect(() => {
        if (datasets.length > 0 && !activeDataset) {
            handleDatasetSelect(datasets[0], false);
        }
    }, [datasets, activeDataset]);

    // --- Resizing Logic (State-based) ---
    const startResize = (e, panel) => {
        e.preventDefault();
        
        // Add a class to body to prevent text selection during drag
        document.body.classList.add('resizing');

        const onMouseMove = (moveEvent) => {
            if (panel === 'sidebar') {
                const newWidth = Math.max(180, Math.min(500, moveEvent.clientX));
                setSidebarWidth(newWidth);
            }
            if (panel === 'props') {
                const newWidth = Math.max(200, Math.min(600, window.innerWidth - moveEvent.clientX));
                setPropWidth(newWidth);
            }
            if (panel === 'console') {
                const newHeight = Math.max(36, Math.min(600, window.innerHeight - moveEvent.clientY));
                setConsoleHeight(newHeight);
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.classList.remove('resizing');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // --- Handlers ---
    
    const saveProject = async () => {
        alert("Project saved successfully!");
    };

    const handleDatasetSelect = async (dataset, showSheet = true) => {
        setActiveDataset(dataset);
        setSelectedTask(null);
        setSelectedProblem(null);
        setSelectedAlgo(null);
        
        if(dataset.statistics && Object.keys(dataset.statistics).length > 0) {
             setStats(dataset.statistics);
        } else {
             setStats(null);
        }
        setLastSaved(dataset.updated_at || null);

        try {
            setCurrentPage(1); // Reset to page 1
            const res = await datasetService.preview(dataset.id, 1, pageSize); 
            // Backend returns { data: [...], total: ... }
            const rows = res.data.data || res.data.results || res.data; 
            const total = res.data.total || 0;
            
            if (Array.isArray(rows)) {
                setPreviewData(rows); 
                setTotalRows(total);
            } else {
                setPreviewData([]);
                setTotalRows(0);
            }
            if (showSheet) setShowDataSheet(true);
        } catch (err) {
            console.error("Failed to load preview", err);
            addLog(`[ERROR] Failed to load preview: ${err.message}`);
        }
    };
    
    const handlePageChange = async (newPage) => {
        if (!activeDataset) return;
        try {
            const res = await datasetService.preview(activeDataset.id, newPage, pageSize);
            const rows = res.data.data || [];
            setPreviewData(rows);
            setCurrentPage(newPage);
        } catch (err) {
            console.error("Pagination failed", err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await datasetService.upload(activeProject.id, file);
            await loadDatasets(); // Refresh list
            toast.success(`Dataset "${file.name}" uploaded successfully!`);
        } catch (err) {
            console.error("Upload failed", err);
            toast.error(`Failed to upload dataset: ${err.message}`);
        }
    };

    const handleDeleteDataset = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this dataset?")) {
            try {
                await datasetService.delete(id);
                await loadDatasets();
                if (activeDataset?.id === id) {
                    setActiveDataset(null);
                    setStats(null);
                    setPreviewData([]);
                }
                toast.success("Dataset deleted successfully!");
            } catch (err) {
                console.error("Delete failed", err);
                toast.error(`Failed to delete dataset: ${err.message}`);
            }
        }
    };

    const handlePreprocessSave = async (steps) => {
        try {
            setIsProcessing(true);
            addLog(`[INFO] Starting preprocessing...`);
            const res = await datasetService.preprocess(activeDataset.id, steps);
            addLog(`[SUCCESS] Pre-processing complete. Created new dataset version.`);
            toast.success("Dataset pre-processing complete");
            // Reload datasets to show new one
            setShowPreprocessing(false);
            await loadDatasets(); // Refresh list to show new dataset
            // If the response contains the new dataset, set it active? 
            // Usually we just refresh the list.
        } catch (err) {
            console.error(err);
            addLog(`[ERROR] Preprocessing failed: ${err.message}`);
            toast.error(`Preprocessing failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const clearLogs = () => setLogs([]);

    const handleCorrelation = async () => {
        if (!activeDataset) return;
        try {
            addLog(`[INFO] Fetching correlation matrix...`);
            const res = await datasetService.getCorrelation(activeDataset.id);
            if (res.data) {
                setCorrelationData(res.data);
                setShowCorrelation(true);
                addLog(`[SUCCESS] Correlation matrix loaded.`);
                toast.success("Correlation matrix generated successfully");
            } else {
                toast.error("No correlation data returned");
            }
        } catch (err) {
            console.error(err);
            addLog(`[ERROR] Stats/Correlation failed: ${err.message}`);
            toast.error("Failed to generate correlation matrix");
        }
    };

    const handleRunTraining = async () => {
        if (!activeDataset || !selectedAlgo) return;
        setIsTraining(true);
        setLogs(prev => [...prev, `[INFO] Initializing ${selectedAlgo.name} on ${activeDataset.name}...`]);

        try {
            const expRes = await experimentService.create({
                project: activeProject.id,
                name: `${selectedAlgo.name} Exp - ${new Date().toLocaleTimeString()}`,
                status: 'Running',
                model_type: selectedAlgo.id 
            });
            const runRes = await trainingService.startRun(expRes.data.id, {
                dataset_id: activeDataset.id,
                parameters: { 
                    ...modelConfig, 
                    train_split: trainSplit, 
                    epochs: modelConfig.epochs || 10,
                    target_column: targetCol,
                    feature_columns: featureCols
                }
            });
            setActiveRun(runRes.data);
            startPolling(runRes.data.id);
        } catch (err) {
            setLogs(prev => [...prev, `[ERROR] Training failed: ${err.message}`]);
            setIsTraining(false);
        }
    };

    const startPolling = (runId) => {
        const interval = setInterval(async () => {
            try {
                const res = await trainingService.getRunStatus(runId);
                if (res.data.logs) setLogs(res.data.logs);
                if (res.data.status === 'Completed' || res.data.status === 'Failed') {
                    setIsTraining(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 1500);
    };

    // --- Edit Mode Handlers ---
    const handleToggleEdit = async () => {
        if (isEditing) {
            // Cancel edit
            setIsEditing(false);
            setEditData([]);
            loadDatasets(); // Refresh preview
        } else {
            // Start edit - Fetch ALL data
            try {
                addLog("[INFO] Loading full dataset for editing...");
                toast.info("Loading full dataset for editing...");
                const res = await datasetService.preview(activeDataset.id, 1, 10000); // Limit 10k for safety
                if(res.data) {
                    const rows = res.data.data || res.data.results || res.data; 
                    setEditData(rows);
                    setIsEditing(true);
                }
            } catch(err) {
                console.error(err);
                toast.error("Failed to load data for editing");
            }
        }
    };

    const handleCellChange = (rowIndex, col, val) => {
        const newData = [...editData];
        newData[rowIndex] = { ...newData[rowIndex], [col]: val };
        setEditData(newData);
    };

    const handleDeleteRow = (rowIndex) => {
        const newData = [...editData];
        newData.splice(rowIndex, 1);
        setEditData(newData);
    };

    const handleDeleteColumn = (colName) => {
        if (!window.confirm(`Delete column "${colName}"?`)) return;
        const newData = editData.map(row => {
            const newRow = { ...row };
            delete newRow[colName];
            return newRow;
        });
        setEditData(newData);
    };

    const handleSaveChanges = async () => {
        try {
            addLog("[INFO] Saving changes...");
            await datasetService.updateContent(activeDataset.id, editData);
            toast.success("Changes saved successfully!");
            setIsEditing(false);
            // Refresh
            const res = await datasetService.getStats(activeDataset.id);
            setStats(res.data);
            handleDatasetSelect(activeDataset); // Reload preview
        } catch(err) {
            console.error(err);
            toast.error("Failed to save changes: " + err.message);
        }
    };

    // --- Render Helpers ---

    const renderDataSheet = () => {
        if (!activeDataset) return null;
        
        const dataToShow = isEditing ? editData : previewData;
        const headers = dataToShow.length > 0 ? Object.keys(dataToShow[0]) : [];

        return (
            <div className="data-sheet-view">
                 <div className="sheet-header">
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <h3>{activeDataset.name} <span style={{opacity:0.5, fontSize:'0.8em'}}>{isEditing ? '(Editing Mode)' : `Preview (${totalRows} rows)`}</span></h3>
                        {/* Edit Mode Disabled Temporarily 
                        {!isEditing && (
                             <button className="secondary-btn small" onClick={handleToggleEdit} title="Edit Dataset">
                                <Edit3 size={14} style={{marginRight:4}}/> Edit
                            </button>
                        )}
                        */}
                        {isEditing && (
                            <>
                                <button className="primary-btn small" onClick={handleSaveChanges} style={{background:'var(--accent)', color:'#000'}}>
                                    <Save size={14} style={{marginRight:4}}/> Save Changes
                                </button>
                                <button className="secondary-btn small" onClick={handleToggleEdit}>
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                    <button className="icon-btn" onClick={() => setShowDataSheet(false)}><X size={18}/></button>
                 </div>
                 <div className="sheet-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                {isEditing && <th style={{width: 40}}>#</th>}
                                {headers.map(h => (
                                    <th key={h}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                            {h}
                                            {isEditing && (
                                                <button onClick={() => handleDeleteColumn(h)} style={{background:'none', border:'none', color:'#ff6b6b', cursor:'pointer', padding:0}}>
                                                    <X size={12}/>
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dataToShow.map((row, i) => (
                                <tr key={i}>
                                    {isEditing && (
                                        <td>
                                            <button onClick={() => handleDeleteRow(i)} style={{background:'none', border:'none', color:'#444', cursor:'pointer'}} title="Delete Row">
                                                <Trash2 size={14} className="danger-hover-icon"/>
                                            </button>
                                        </td>
                                    )}
                                    {headers.map(h => (
                                        <td key={h}>
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={row[h]} 
                                                    onChange={(e) => handleCellChange(i, h, e.target.value)}
                                                    style={{background:'transparent', border:'none', color:'inherit', width:'100%', outline:'none', borderBottom:'1px solid rgba(255,255,255,0.1)'}}
                                                />
                                            ) : row[h]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 {!isEditing && (
                     <div className="sheet-footer" style={{padding:'10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', borderTop:'1px solid #333'}}>
                        <button 
                            className="secondary-btn small" 
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {Math.ceil(totalRows / pageSize) || 1}</span>
                        <button 
                            className="secondary-btn small" 
                            disabled={currentPage * pageSize >= totalRows}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                        </button>
                     </div>
                 )}
            </div>
        );
    };

    const renderModelSelector = () => {
        if (!selectedTask) {
             return (
                 <div className="selection-stage">
                     <h2>Select Task Type</h2>
                     <div className="cards-grid">
                         <div className="select-card" onClick={() => setSelectedTask('supervised')}>
                             <Activity size={32} color="#8b5cf6" />
                             <h3>Supervised</h3>
                             <p>Labeled data (Regression, Classification)</p>
                         </div>
                         <div className="select-card" onClick={() => setSelectedTask('unsupervised')}>
                             <Layers size={32} color="#06b6d4" />
                             <h3>Unsupervised</h3>
                             <p>Unlabeled data (Clustering, Dim. Reduction)</p>
                         </div>
                     </div>
                 </div>
             )
        }
        if (!selectedProblem) {
            return (
                <div className="selection-stage">
                    <button className="back-link" onClick={() => setSelectedTask(null)}>← Back</button>
                    <h2>Select Problem Type</h2>
                    <div className="cards-grid">
                        {selectedTask === 'supervised' ? (
                            <>
                                <div className="select-card" onClick={() => setSelectedProblem('regression')}>
                                    <Activity size={32} color="#10b981" />
                                    <h3>Regression</h3>
                                    <p>Predict continuous values</p>
                                </div>
                                <div className="select-card" onClick={() => setSelectedProblem('classification')}>
                                    <Layers size={32} color="#f59e0b" />
                                    <h3>Classification</h3>
                                    <p>Predict categories</p>
                                </div>
                            </>
                        ) : (
                            <div className="select-card" onClick={() => setSelectedProblem('clustering')}>
                                <Layers size={32} color="#ec4899" />
                                <h3>Clustering</h3>
                                <p>Group data points</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        if (!selectedAlgo) {
             const algos = selectedProblem === 'regression' ? [
                 { id: 'linear_regression', name: 'Linear Regression' },
                 { id: 'random_forest', name: 'Random Forest' }
             ] : [
                 { id: 'logistic_regression', name: 'Logistic Regression' },
                 { id: 'svc', name: 'SVM' }
             ];

             return (
                <div className="selection-stage">
                     <button className="back-link" onClick={() => setSelectedProblem(null)}>← Back</button>
                    <h2>Select Algorithm</h2>
                    <div className="cards-grid">
                        {algos.map(a => (
                            <div key={a.id} className="select-card" onClick={() => setSelectedAlgo(a)}>
                                <Box3DIcon /> 
                                <h3>{a.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
             );
        }




        // Summary / Ready to Train / In-Progress Screen
        // Show this if we have finished config, OR if we are currently training/have a run
        if (isConfigured || isTraining || activeRun) {
             return (
                <div className="selection-stage ready">
                    <div className="ready-state">
                        <CheckCircleIcon size={64} />
                        <h2>Ready to Train</h2>
                        <div className="summary-pill">
                            <span>{selectedTask}</span> <ArrowRight size={14}/> 
                            <span>{selectedProblem}</span> <ArrowRight size={14}/> 
                            <span>{selectedAlgo.name}</span>
                        </div>
                        
                        <div className="summary-details" style={{margin:'20px 0', textAlign:'left', background:'rgba(255,255,255,0.05)', padding:15, borderRadius:8}}>
                            <p><strong>Split:</strong> {Math.round(trainSplit*100)}% Train / {Math.round((1-trainSplit)*100)}% Test</p>
                            <p><strong>Config:</strong></p>
                            <ul style={{paddingLeft:20, margin:0}}>
                                {Object.entries(modelConfig).map(([k,v]) => (
                                    <li key={k}>{k}: {v}</li>
                                ))}
                            </ul>
                            <p style={{marginTop:10}}><strong>Target:</strong> {targetCol}</p>
                            <p><strong>Features ({featureCols.length}):</strong> {featureCols.join(', ')}</p>
                        </div>

                        <button className="primary-btn huge" onClick={handleRunTraining} disabled={isTraining}>
                            <Play size={24} fill="currentColor" /> {isTraining ? 'Training...' : 'Start Training'}
                        </button>
                        <button className="text-btn" onClick={() => setIsConfigured(false)}>Back to Configuration</button>
                    </div>
                </div>
            );
        }

        // Show Config UI if not running and we have selected an algo
        if (!isTraining && !activeRun && !isConfigured) {
             return (
                <div className="selection-stage">
                    <button className="back-link" onClick={() => setSelectedAlgo(null)}>← Back</button>
                    <h2>Configure Training</h2>
                    
                    <div className="config-panel" style={{maxWidth: 500, margin: '0 auto', textAlign:'left'}}>
                        <div className="config-group">
                            <label>Train/Test Split ({Math.round(trainSplit*100)}% Train)</label>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="0.9" 
                                step="0.05" 
                                value={trainSplit} 
                                onChange={(e) => setTrainSplit(parseFloat(e.target.value))}
                                style={{width: '100%'}}
                            />
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8em', opacity:0.7}}>
                                <span>50%</span>
                                <span>90%</span>
                            </div>
                        </div>

                        <div className="config-divider" style={{margin:'20px 0', borderBottom:'1px solid rgba(255,255,255,0.1)'}}></div>

                        <h3>Column Selection</h3>
                         <div className="config-group">
                            <label>Target Column (Output)</label>
                            <select 
                                value={targetCol} 
                                onChange={(e) => setTargetCol(e.target.value)}
                                style={{width:'100%', padding:8, background:'rgba(255,255,255,0.1)', color:'white', border:'1px solid #444', borderRadius:4}}
                            >
                                {activeDataset.columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="config-group" style={{marginTop:15}}>
                            <label>Feature Columns (Input)</label>
                            <div style={{maxHeight:150, overflowY:'auto', border:'1px solid #444', padding:5, borderRadius:4}}>
                                {activeDataset.columns.map(c => (
                                    <div key={c.name} style={{display:'flex', gap:8, padding:4}}>
                                        <input 
                                            type="checkbox" 
                                            checked={featureCols.includes(c.name)}
                                            onChange={(e) => {
                                                if (e.target.checked) setFeatureCols([...featureCols, c.name]);
                                                else setFeatureCols(featureCols.filter(f => f !== c.name));
                                            }}
                                            disabled={c.name === targetCol}
                                        />
                                        <span style={{opacity: c.name === targetCol ? 0.5 : 1}}>{c.name} {c.name === targetCol ? '(Target)' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div className="config-divider" style={{margin:'20px 0', borderBottom:'1px solid rgba(255,255,255,0.1)'}}></div>

                        <h3>Hyperparameters</h3>
                        <div className="params-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                            {Object.entries(modelConfig).map(([key, val]) => (
                                <div key={key} className="input-group">
                                    <label style={{textTransform:'capitalize'}}>{key.replace('_', ' ')}</label>
                                    <input 
                                        type={typeof val === 'number' ? 'number' : 'text'}
                                        value={val}
                                        onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                                        style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{marginTop: 30, textAlign:'center'}}>
                            <button className="primary-btn huge" onClick={() => setIsConfigured(true)}>
                                Continue <ArrowRight size={20} style={{marginLeft:8}}/>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

    };

    const Box3DIcon = () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    )

    const CheckCircleIcon = ({size}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    )

    const handleRefreshStats = async () => {
        if (!activeDataset) return;
        try {
            console.log("Requesting stats refresh...");
            const res = await datasetService.refreshStats(activeDataset.id);
            console.log("Stats refresh response:", res);
             
            if (res.data) {
                // Logs removed
                if (!stats) setStats(res.data);
                
                // If we have stats but no selected column, select first
                setStats(res.data);
                addLog(`Stats refreshed for ${activeDataset.name}`);
            }
        } catch (err) {
            console.error(err);
            addLog(`[ERROR] Failed to refresh stats: ${err.message}`);
        }
    };

    if (!activeProject) {
        return (
             <div className="arena-container" style={{justifyContent:'center', alignItems:'center'}}>
                <div className="canvas-placeholder">
                    <h2>No Active Project</h2>
                    <button className="primary-btn" onClick={resetLaunch}>Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="arena-container">
            <header className="arena-menu-bar">
                <div className="left">
                    <span className="menu-item" style={{color:'var(--accent)', fontWeight:'bold'}}>{activeProject.title}</span>
                </div>
                <div className="arena-controls" style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
                    <div style={{display:'flex', gap:10}}>
                         <button className="control-btn" onClick={() => {
                             // Reset selection
                             setSelectedTask(null); 
                             setSelectedProblem(null); 
                             setSelectedAlgo(null);
                             // Hide Data Sheet
                             setShowDataSheet(false);
                         }} disabled={isTraining} title="Start New Experiment">
                            <Play size={16} /> <span style={{marginLeft:6}}>Train Model</span>
                        </button>
                         <button className="control-btn" onClick={() => setShowPreprocessing(true)} disabled={!activeDataset || isTraining}>
                            <Wand2 size={16} /> <span style={{marginLeft:6}}>Pre-process</span>
                        </button>
                        <button className="control-btn" onClick={handleCorrelation} disabled={!activeDataset || isTraining}>
                            <Activity size={16} /> <span style={{marginLeft:6}}>Correlation</span>
                        </button>
                    </div>
                    
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                         <div style={{fontSize:'0.8rem', color:'var(--text-dim)', marginRight:10, display:'flex', alignItems:'center'}}>
                            {lastSaved ? `Last saved: ${new Date(lastSaved).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : <span style={{opacity:0.5}}>Not saved</span>}
                        </div>
                        <button className="control-btn" onClick={saveProject} title="Save Project"><Save size={16}/></button>
                        <button className="control-btn" title="Settings"><Settings size={18} /></button>
                        <div style={{width: 1, height: 24, background: '#333', margin: '0 8px'}}></div>
                        <button className="control-btn" onClick={resetLaunch} title="Close Project" style={{borderColor:'#ef4444', color:'#ef4444'}}>
                            <X size={16} /> <span style={{marginLeft:6}}>Close Project</span>
                        </button>
                    </div>
                </div>
            </header>

            <div 
                className="arena-workspace" 
                ref={workspaceRef}
                style={{
                    gridTemplateColumns: `${sidebarWidth}px 1fr ${propWidth}px`,
                    gridTemplateRows: `1fr ${consoleHeight}px`
                }}
            >
                {/* 1. Sidebar */}
                <div className="ide-panel area-sidebar" style={{position:'relative'}}>
                    <div className="panel-header">
                        <h3><Database size={14} style={{marginRight:6, display:'inline'}}/> Datasets</h3>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{display:'none'}} 
                            onChange={handleFileUpload} 
                            accept=".csv,.json"
                        />
                        <button 
                            className="icon-btn" 
                            onClick={() => fileInputRef.current.click()} 
                            style={{background: 'var(--accent)', color: '#000', padding: '4px 8px', borderRadius: 4, height: 24, display:'flex', alignItems:'center', gap:4}}
                            title="Upload Dataset"
                        >
                            <Upload size={12}/> <span style={{fontSize:'0.7rem', fontWeight:'bold'}}>Upload</span>
                        </button>
                    </div>
                    <div className="panel-content">
                        {datasets.length === 0 ? <div className="empty-state">No datasets loaded</div> : (
                            <ul className="file-list" style={{listStyle: 'none', padding: 0, margin: 0}}>
                                {datasets.map(d => (
                                    <li 
                                        key={d.id} 
                                        className={activeDataset?.id === d.id ? 'active' : ''} 
                                        onClick={() => handleDatasetSelect(d)}
                                        style={{
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: activeDataset?.id === d.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{display:'flex', alignItems:'center', overflow:'hidden', flex: 1, minWidth: 0, gap: 8}}>
                                            <Database size={14} style={{flexShrink:0, color: 'var(--accent)'}}/>
                                            <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontSize:'0.9rem'}}>{d.name}</span>
                                        </div>
                                        <button 
                                            className="icon-btn" 
                                            onClick={(e) => handleDeleteDataset(e, d.id)}
                                            style={{
                                                background: 'transparent', 
                                                color: '#666', 
                                                padding: 4, 
                                                transition: 'color 0.2s', 
                                                border:'none', 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                                            title="Delete Dataset"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="resizer-v" onMouseDown={(e) => startResize(e, 'sidebar')} style={{right:-3, cursor: 'col-resize'}}></div>
                </div>

                {/* 2. Main Canvas */}
                <div className="area-canvas" style={{background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)'}}>
                    {showDataSheet ? renderDataSheet() : activeDataset ? renderModelSelector() : (
                        <div className="canvas-placeholder">
                            <div className="pulse-ring"></div>
                            <h3>Select a Dataset</h3>
                            <p>Choose a dataset from the sidebar to begin.</p>
                        </div>
                    )}
                </div>

                {/* 3. Right Panel */}
                <div className="ide-panel area-properties" style={{position:'relative', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                    <div className="resizer-v" onMouseDown={(e) => startResize(e, 'props')} style={{left:-3, cursor: 'col-resize'}}></div>
                    <div className="panel-header" style={{flexShrink:0}}><h3>Properties</h3></div>
                    <div className="panel-content" style={{padding: '16px', flex:1, overflowY:'auto'}}>
                        {activeDataset ? (
                            <div className="props-group">
                                <h4 style={{color:'var(--accent)'}}>Dataset Info</h4>
                                <div className="prop-row"><span>Name:</span> <span>{activeDataset.name}</span></div>
                                <div className="prop-row"><span>Rows:</span> <span>{activeDataset.row_count}</span></div>
                                <div className="prop-row"><span>Size:</span> <span>{activeDataset.file_size || 'Unknown'}</span></div>
                                <div style={{display:'flex', gap:8, marginTop:12}}>
                                    <button className="secondary-btn" onClick={() => setShowDataSheet(true)} style={{flex:1}}>View Data Sheet</button>
                                     {activeDataset.download_url && (
                                        <a href={activeDataset.download_url} download className="secondary-btn" style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0 10px'}} title="Download Dataset">
                                            <Download size={14}/>
                                        </a>
                                    )}
                                </div>
                                
                                {stats && (

                                    <div style={{marginTop: 24}}>
                                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:4}}>
                                            <h4 style={{color:'var(--accent)', margin:0}}>Data Statistics</h4>
                                            <button 
                                                onClick={handleRefreshStats}
                                                style={{background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:4}}
                                                title="Refresh Stats & Logs to Console"
                                            >
                                                <Activity size={14} />
                                            </button>
                                        </div>
                                        
                                        {/* 1. Dataset Overview */}
                                        <div style={{marginBottom: 20}}>
                                            <h5 style={{color:'var(--text-main)', marginBottom:8, fontSize:'0.9rem'}}>Dataset Overview</h5>
                                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12}}>
                                                <div style={{background:'rgba(255,255,255,0.05)', padding:8, borderRadius:4}}>
                                                    <div style={{fontSize:'0.7rem', opacity:0.7}}>Total Rows</div>
                                                    <div style={{fontSize:'1.1rem', fontWeight:'bold'}}>{stats.dataset_stats?.total_rows || activeDataset.row_count}</div>
                                                </div>
                                                <div style={{background:'rgba(255,255,255,0.05)', padding:8, borderRadius:4}}>
                                                    <div style={{fontSize:'0.7rem', opacity:0.7}}>Total Columns</div>
                                                    <div style={{fontSize:'1.1rem', fontWeight:'bold'}}>{stats.dataset_stats?.total_columns || Object.keys(stats).length}</div>
                                                </div>
                                            </div>
                                            {/* Column Types List - Compact View */}
                                            <div style={{fontSize:'0.8rem', color:'var(--text-dim)', maxHeight:'100px', overflowY:'auto', background:'rgba(0,0,0,0.2)', padding:8, borderRadius:4}}>
                                                <div style={{marginBottom:4, fontWeight:'bold', opacity:0.9}}>Column Data Types:</div>
                                                {Object.entries(stats).map(([col, data]) => {
                                                    if (col === 'dataset_stats') return null;
                                                    const colType = activeDataset?.columns?.find(c => c.name === col)?.type || 'Unknown';
                                                    return (
                                                        <div key={col} style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
                                                            <span>{col}:</span>
                                                            <span style={{color:'var(--accent)'}}>{colType}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* 2. Column Statistics */}
                                        <div>
                                            <h5 style={{color:'var(--text-main)', marginBottom:8, fontSize:'0.9rem'}}>Column Statistics</h5>
                                            <div style={{marginBottom:12}}>
                                                <label style={{display:'block', fontSize:'0.8rem', marginBottom:4, color:'var(--text-dim)'}}>Select Column for Stats:</label>
                                                <select 
                                                    value={selectedColumnForStats} 
                                                    onChange={(e) => {
                                                        const col = e.target.value;
                                                        setSelectedColumnForStats(col);
                                                        if (col && stats[col]) {
                                                        if (col && stats[col]) {
                                                            // Logs removed
                                                        }
                                                        }
                                                    }}
                                                    style={{
                                                        width:'100%', 
                                                        padding:'8px', 
                                                        background:'rgba(0,0,0,0.3)', 
                                                        border:'1px solid rgba(255,255,255,0.1)', 
                                                        color:'var(--text-main)', 
                                                        borderRadius:4,
                                                        outline:'none'
                                                    }}
                                                >
                                                    <option value="">-- Select a Column --</option>
                                                    {Object.keys(stats).filter(k => k !== 'dataset_stats').map(col => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* 3. Detailed Stats View */}
                                            {selectedColumnForStats && stats[selectedColumnForStats] && (
                                                <div style={{background:'rgba(255,255,255,0.03)', padding:12, borderRadius:6, fontSize:'0.85rem', animation:'fadeIn 0.3s'}}>
                                                    <div style={{borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:8, marginBottom:8}}>
                                                        <h5 style={{fontSize:'1rem', color:'var(--text-main)', margin:0}}>{selectedColumnForStats}</h5>
                                                        <div style={{fontSize:'0.8rem', color:'var(--text-dim)', marginTop:4}}>
                                                            Type: <span style={{color:'var(--accent)'}}>{activeDataset?.columns?.find(c => c.name === selectedColumnForStats)?.type || 'Unknown'}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{display:'grid', gap:6, marginBottom:12}}>
                                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                                            <span style={{opacity:0.7}}>Missing:</span>
                                                            <span>{stats[selectedColumnForStats].missing_count || 0} ({(stats[selectedColumnForStats].missing_percentage || 0).toFixed(2)}%)</span>
                                                        </div>
                                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                                            <span style={{opacity:0.7}}>Unique:</span>
                                                            <span>{stats[selectedColumnForStats].unique_count || 0} ({(stats[selectedColumnForStats].unique_percentage || 0).toFixed(2)}%)</span>
                                                        </div>
                                                    </div>

                                                    {/* Numeric Stats */}
                                                    {stats[selectedColumnForStats].mean !== undefined && (
                                                        <div>
                                                            <h6 style={{color:'var(--text-main)', opacity:0.9, marginBottom:6, fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8}}>Numerical Statistics</h6>
                                                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', rowGap:'4px', fontSize:'0.8rem'}}>
                                                                <div><span style={{opacity:0.6}}>Mean:</span> {stats[selectedColumnForStats].mean?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Median:</span> {stats[selectedColumnForStats].median?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Std Dev:</span> {stats[selectedColumnForStats].std?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Variance:</span> {stats[selectedColumnForStats].variance?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Min:</span> {stats[selectedColumnForStats].min}</div>
                                                                <div><span style={{opacity:0.6}}>Max:</span> {stats[selectedColumnForStats].max}</div>
                                                                <div><span style={{opacity:0.6}}>Range:</span> {stats[selectedColumnForStats].range?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>IQR:</span> {stats[selectedColumnForStats].iqr?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Skewness:</span> {stats[selectedColumnForStats].skewness?.toFixed(2)}</div>
                                                                <div><span style={{opacity:0.6}}>Kurtosis:</span> {stats[selectedColumnForStats].kurtosis?.toFixed(2)}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Categorical Stats */}
                                                    {stats[selectedColumnForStats].top_categories && (
                                                        <div>
                                                            <h6 style={{color:'var(--text-main)', opacity:0.9, marginBottom:6, fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8}}>Top Categories</h6>
                                                            <div style={{display:'flex', flexDirection:'column', gap:4}}>
                                                                {stats[selectedColumnForStats].top_categories.slice(0, 5).map((cat, idx) => (
                                                                    <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', background:'rgba(0,0,0,0.2)', padding:'2px 6px', borderRadius:3}}>
                                                                        <span style={{maxWidth:'70%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{cat.value}</span>
                                                                        <span style={{opacity:0.7}}>{cat.count} ({cat.percentage?.toFixed(1)}%)</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Boolean Stats */}
                                                    {stats[selectedColumnForStats].true_count !== undefined && (
                                                        <div>
                                                            <h6 style={{color:'var(--text-main)', opacity:0.9, marginBottom:6, fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8}}>Boolean Statistics</h6>
                                                            <div style={{display:'flex', flexDirection:'column', gap:4, fontSize:'0.8rem'}}>
                                                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                                                    <span style={{opacity:0.7}}>True:</span>
                                                                    <span>{stats[selectedColumnForStats].true_count} ({stats[selectedColumnForStats].true_percentage?.toFixed(1)}%)</span>
                                                                </div>
                                                                <div style={{display:'flex', justifyContent:'space-between'}}>
                                                                    <span style={{opacity:0.7}}>False:</span>
                                                                    <span>{stats[selectedColumnForStats].false_count} ({stats[selectedColumnForStats].false_percentage?.toFixed(1)}%)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                     {/* Datetime Stats */}
                                                     {stats[selectedColumnForStats].earliest !== undefined && (
                                                        <div>
                                                            <h6 style={{color:'var(--text-main)', opacity:0.9, marginBottom:6, fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8}}>Date/Time Statistics</h6>
                                                            <div style={{display:'flex', flexDirection:'column', gap:4, fontSize:'0.8rem'}}>
                                                                <div><span style={{opacity:0.7}}>Earliest:</span> {stats[selectedColumnForStats].earliest}</div>
                                                                <div><span style={{opacity:0.7}}>Latest:</span> {stats[selectedColumnForStats].latest}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : <div className="empty-props">No selection</div>}
                    </div>
                </div>

                {/* 4. Bottom Console */}
                <div className="ide-panel area-bottom" style={{position:'relative', gridColumn: '1 / span 3'}}>
                    <div className="resizer-h" onMouseDown={(e) => startResize(e, 'console')} style={{top:-3, cursor: 'row-resize'}}></div>
                    <div className="panel-header">
                        <div className="tabs">
                            <div className="tab active"><Activity size={12}/> Training Monitor</div>
                        </div>
                        <div className="actions">
                            <button className="icon-btn-small" onClick={clearLogs}><Eraser size={12}/></button>
                        </div>
                    </div>
                    <div className="console-output">
                        {logs.length === 0 ? <div className="console-placeholder">Ready to train.</div> : (
                            <div className="log-lines">
                                {logs.map((log, i) => <div key={i} className="log-entry">[{new Date().toLocaleTimeString()}] {log}</div>)}
                                {isTraining && <div className="log-entry log-info">Training...</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showPreprocessing && (
                <PreprocessingCanvasWrapper 
                    dataset={activeDataset} 
                    onClose={() => setShowPreprocessing(false)} 
                    onRun={handlePreprocessSave}
                    stats={stats}
                />
            )}
            
            {showCorrelation && (
                <CorrelationHeatmap 
                    data={correlationData} 
                    onClose={() => setShowCorrelation(false)} 
                />
            )}
            {/* Loading Overlay */}
            {isProcessing && (
                <div className="app-loading-overlay">
                    <div className="loading-spinner-large"></div>
                    <h3>Processing Dataset...</h3>
                    <p style={{opacity:0.7, marginTop:8}}>Please wait while we update your data.</p>
                </div>
            )}
        </div>
    );
};

export default MLArenaPage;