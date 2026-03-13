/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useLaunch } from '../../context/LaunchContext.jsx';
import Dialog from '../shared/Modal/Dialog';
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
    PieChart, Info, Search, Box, BrainCircuit, Folder,
    Download, MoreVertical, Edit3, PlusCircle, ExternalLink
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ProjectSettingsModal from './Settings/ProjectSettingsModal';
import './MLArenaPage.css';


const MLArenaPage = () => {
    const { isArenaVisible, activeProject, setActiveProject, enterArenaWithProject, resetLaunch } = useLaunch();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Manually parse projectId from URL since this is rendered globally
    const urlMatch = location.pathname.match(/\/projects\/(\d+)/);
    const urlProjectId = urlMatch ? urlMatch[1] : null;
    
    // --- Layout States (Moved to top level) ---
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [propWidth, setPropWidth] = useState(400);
    const [consoleHeight, setConsoleHeight] = useState(200);

    // --- Data States ---
    const [datasets, setDatasets] = useState([]);
    const [experiments, setExperiments] = useState([]);
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
            // Honor Manual Override setting
            if (activeProject?.settings?.manual_override) {
                setModelConfig({}); // Start empty
                return;
            }

            if (selectedAlgo.id === 'linear_regression') {
                setModelConfig({ fit_intercept: true, copy_X: true, random_state: 42 });
            } else if (selectedAlgo.id === 'logistic_regression') {
                setModelConfig({ C: 1.0, solver: 'lbfgs', penalty: 'l2', max_iter: 1000, class_weight: null, random_state: 42 });
            } else if (selectedAlgo.id === 'random_forest') {
                setModelConfig({ n_estimators: 100, max_depth: 10, criterion: 'gini', min_samples_split: 2, max_features: 'sqrt', random_state: 42 });
            } else if (selectedAlgo.id === 'svc' || selectedAlgo.id === 'svc_classifier') {
                setModelConfig({ C: 1.0, kernel: 'rbf', gamma: 'scale', degree: 3, class_weight: null, random_state: 42 });
            } else {
                setModelConfig({ random_state: 42 });
            }        }
    }, [selectedAlgo, activeDataset, activeProject?.settings?.manual_override]);
    const [isLoadingBarActive, setIsLoadingBarActive] = useState(false);
    const [isDatasetsOpen, setIsDatasetsOpen] = useState(true);
    const [isModelsOpen, setIsModelsOpen] = useState(true);
    const [modelMenuOpenId, setModelMenuOpenId] = useState(null);
    const [reportModel, setReportModel] = useState(null);

    // Close menu when clicking away
    useEffect(() => {
        const handleClickAway = () => setModelMenuOpenId(null);
        if (modelMenuOpenId) {
            window.addEventListener('click', handleClickAway);
        }
        return () => window.removeEventListener('click', handleClickAway);
    }, [modelMenuOpenId]);
    
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
    const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState([]); // Full data for editing
    const [testModel, setTestModel] = useState(null); // Model currently being tested
    const [testInput, setTestInput] = useState({});
    const [predictionResult, setPredictionResult] = useState(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const pageSize = 50;

    // --- Refs ---
    const workspaceRef = useRef(null);
    const fileInputRef = useRef(null);
    const consoleRef = useRef(null);
    const [sidebarSplit, setSidebarSplit] = useState(50); // percentage for datasets section height

    // --- Loading Data ---
    const addLog = useCallback((message) => setLogs(prev => [...prev, message]), []);

    const handleDatasetSelect = useCallback(async (dataset, showSheet = true) => {
        setActiveDataset(dataset);
        setSelectedTask(null);
        setSelectedProblem(null);
        setSelectedAlgo(null);
        setSelectedColumnForStats('');
        
        if (dataset.statistics && Object.keys(dataset.statistics).length > 0) {
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
    }, [addLog, pageSize]);

    const loadDatasets = useCallback(async () => {
        try {
            const res = await datasetService.list(activeProject?.id);
            setDatasets(res.data);
        } catch (err) {
            console.error("Failed to load datasets", err);
        }
    }, [activeProject?.id]);

    const loadExperiments = useCallback(async () => {
        try {
            const res = await experimentService.list(activeProject?.id);
            setExperiments(res.data);
        } catch (err) {
            console.error("Failed to load experiments", err);
        }
    }, [activeProject?.id]);

    useEffect(() => {
        if (activeProject) {
            setDatasets([]);
            setExperiments([]);
            setActiveDataset(null);
            setStats(null);
            setSelectedTask(null);
            setSelectedProblem(null);
            setSelectedAlgo(null);
            setSelectedColumnForStats('');
            setPreviewData([]);
            setCorrelationData(null);
            setLogs(["[System] Connecting to workspace interface..."]);
            loadDatasets();
            loadExperiments();
        }
    }, [activeProject, loadDatasets, loadExperiments]);

    // URL mapping is now primarily handled in App.jsx for better lifecycle control


    // Available projects for selection
    const [availableProjects, setAvailableProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!activeProject) {
            const fetchProjects = async () => {
                setIsLoadingProjects(true);
                try {
                    const res = await projectService.getProjects();
                    setAvailableProjects(res.data);
                } catch (e) {
                    console.error("Failed to load projects", e);
                } finally {
                    setIsLoadingProjects(false);
                }
            };
            fetchProjects();
        }
    }, [activeProject]);

    const filteredProjects = useMemo(() => {
        return availableProjects.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.domain.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableProjects, searchQuery]);

    const handleProjectClick = (p) => {
        const mapped = { id: p.id, title: p.name, type: p.domain };
        enterArenaWithProject(mapped);
        navigate(`/projects/${p.id}`);
    };

    const handleCloseProject = () => {
        setIsCloseConfirmOpen(true);
    };

    const confirmClose = () => {
        setIsCloseConfirmOpen(false);
        navigate('/projects');
        setTimeout(() => {
            resetLaunch();
            setActiveProject(null);
        }, 100);
    };

    // Auto-select first dataset if available and none selected
    useEffect(() => {
        if (datasets.length > 0 && !activeDataset) {
            handleDatasetSelect(datasets[0], false);
        }
    }, [datasets, activeDataset, handleDatasetSelect]);

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
            if (panel === 'sidebarSplit') {
                const sidebarEl = document.querySelector('.area-sidebar');
                if (sidebarEl) {
                    const rect = sidebarEl.getBoundingClientRect();
                    const relativeY = moveEvent.clientY - rect.top;
                    const newSplit = Math.max(10, Math.min(90, (relativeY / rect.height) * 100));
                    setSidebarSplit(newSplit);
                }
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
        // Implementation for saving project workspace state
        toast.info('Saving project...', { duration: 1000 });
        
        // Simple mock of save success
        toast.success("Workspace state saved!");
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

    const downloadReport = (model) => {
        const reportText = `
ML STUDIO - MODEL PERFORMANCE REPORT
=====================================
Model Name: ${model.name}
Algorithm: ${model.model_type}
Status: ${model.status}
Date: ${new Date().toLocaleString()}

PERFORMANCE METRICS
------------------
Accuracy:  ${(model.metrics?.accuracy || 0).toFixed(4)}
Precision: ${(model.metrics?.precision || 0).toFixed(4)}
Recall:    ${(model.metrics?.recall || 0).toFixed(4)}
F1-Score:  ${(model.metrics?.f1_score || 0).toFixed(4)}

CONFIGURATIONS
-------------
${JSON.stringify(model.config || {}, null, 2)}
        `;
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${model.name}_report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderReportModal = () => {
        if (!reportModel) return null;
        const isClassification = ['logistic_regression', 'random_forest', 'svc'].includes(reportModel.model_type);
        const metrics = reportModel.metrics || {};
        const cm = metrics.confusion_matrix || [[0, 0], [0, 0]];

        return (
            <div className="details-modal-overlay" onClick={() => setReportModel(null)} style={{zIndex: 2000}}>
                <div className="details-modal-content" style={{maxWidth:600, width:'90%'}} onClick={e => e.stopPropagation()}>
                    <div className="details-modal-header">
                        <div style={{display:'flex', alignItems:'center', gap:12}}>
                            <div style={{width:40, height:40, borderRadius:8, background:'rgba(139, 92, 246, 0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)'}}>
                                <FileText size={20}/>
                            </div>
                            <div>
                                <h2 style={{margin:0, fontSize:'1.1rem'}}>{reportModel.name}</h2>
                                <p style={{margin:0, fontSize:'0.8rem', opacity: 0.6}}>{reportModel.model_type} • {reportModel.status}</p>
                            </div>
                        </div>
                        <button className="clean-icon-btn" onClick={() => setReportModel(null)}><X size={20}/></button>
                    </div>
                    <div className="details-modal-body" style={{padding: '24px 32px'}}>
                        {isClassification ? (
                            <div className="report-grid" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:15, marginBottom:30}}>
                                <div className="metric-box status-accent">
                                    <label>Accuracy</label>
                                    <div className="metric-val">{((metrics.accuracy || 0) * 100).toFixed(1)}%</div>
                                </div>
                                <div className="metric-box status-success">
                                    <label>F1 Score</label>
                                    <div className="metric-val">{(metrics.f1_score || 0).toFixed(3)}</div>
                                </div>
                                <div className="metric-box status-info">
                                    <label>Precision</label>
                                    <div className="metric-val">{(metrics.precision || 0).toFixed(3)}</div>
                                </div>
                                <div className="metric-box status-warning">
                                    <label>Recall</label>
                                    <div className="metric-val">{(metrics.recall || 0).toFixed(3)}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="report-grid" style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:15, marginBottom:30}}>
                                <div className="metric-box status-accent">
                                    <label>R² Score</label>
                                    <div className="metric-val">{(metrics.r2 || 0).toFixed(4)}</div>
                                </div>
                                <div className="metric-box status-warning">
                                    <label>MSE (Error)</label>
                                    <div className="metric-val">{(metrics.mse || 0).toFixed(4)}</div>
                                </div>
                            </div>
                        )}

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:25, marginBottom:30}}>
                            <div>
                                {isClassification ? (
                                    <>
                                        <h4 className="report-section-title">Confusion Matrix</h4>
                                        <div className="confusion-matrix-wrapper">
                                            <div className="cm-grid">
                                                <div className="cm-cell header"></div>
                                                <div className="cm-cell header">Pred P</div>
                                                <div className="cm-cell header">Pred N</div>
                                                
                                                <div className="cm-cell header">True P</div>
                                                <div className="cm-cell value tp" title="True Positive">{cm[0][0]}</div>
                                                <div className="cm-cell value fn" title="False Negative">{cm[0][1]}</div>
                                                
                                                <div className="cm-cell header">True N</div>
                                                <div className="cm-cell value fp" title="False Positive">{cm[1][0]}</div>
                                                <div className="cm-cell value tn" title="True Negative">{cm[1][1]}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="report-section-title">Regression Metrics</h4>
                                        <div className="params-list-mini">
                                            <div className="mini-param-row">
                                                <span className="param-k">RMSE</span>
                                                <span className="param-v">{(metrics.rmse || 0).toFixed(4)}</span>
                                            </div>
                                            <div className="mini-param-row">
                                                <span className="param-k">MAE</span>
                                                <span className="param-v">{(metrics.mae || 0).toFixed(4)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div>
                                <h4 className="report-section-title">Model Parameters</h4>
                                <div className="params-list-mini">
                                    {Object.entries(reportModel.config || {}).slice(0, 6).map(([k,v]) => (
                                        <div key={k} className="mini-param-row">
                                            <span className="param-k">{k.replace('_',' ')}</span>
                                            <span className="param-v">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="report-actions">
                            <button className="primary-btn-report" onClick={() => downloadReport(reportModel)}>
                                <Download size={18}/> Export Results (.txt)
                            </button>
                            <button className="secondary-btn-report" onClick={() => setReportModel(null)}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
 
    const renderTestModelModal = () => {
        if (!testModel) return null;
        const features = testModel.config?.feature_columns || [];
        
        return (
            <div className="details-modal-overlay" onClick={() => setTestModel(null)} style={{zIndex: 2000}}>
                <div className="details-modal-content" style={{maxWidth:700, width:'90%'}} onClick={e => e.stopPropagation()}>
                    <div className="details-modal-header">
                        <div style={{display:'flex', alignItems:'center', gap:12}}>
                            <div style={{width:40, height:40, borderRadius:8, background:'rgba(139, 92, 246, 0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)'}}>
                                <PlayCircle size={20}/>
                            </div>
                            <div>
                                <h2 style={{margin:0, fontSize:'1.1rem'}}>Test Model: {testModel.name}</h2>
                                <p style={{margin:0, fontSize:'0.8rem', opacity: 0.6}}>Input manual samples to check results</p>
                            </div>
                        </div>
                        <button className="clean-icon-btn" onClick={() => setTestModel(null)}><X size={20}/></button>
                    </div>
                    <div className="details-modal-body" style={{padding: '24px 32px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30}}>
                            <div>
                                <h4 className="report-section-title" style={{marginBottom:15}}>Input Data</h4>
                                <div style={{maxHeight:350, overflowY:'auto', paddingRight:10}}>
                                    {features.length === 0 ? (
                                        <div style={{color:'var(--text-dim)', textAlign:'center', padding:'40px 0', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:8}}>
                                            <p style={{margin:0}}>No feature columns found for this model.</p>
                                            <p style={{margin:'4px 0 0 0', fontSize:'0.75rem', opacity:0.6}}>This model might have been trained with an older version.</p>
                                        </div>
                                    ) : features.map(feat => (
                                        <div key={feat} className="input-group" style={{marginBottom:12}}>
                                            <label style={{fontSize:'0.8rem', opacity:0.8, display:'block', marginBottom:4}}>{feat}</label>
                                            <input 
                                                type="text"
                                                placeholder={`Enter ${feat}...`}
                                                value={testInput[feat] || ""}
                                                onChange={(e) => setTestInput({...testInput, [feat]: e.target.value})}
                                                style={{width:'100%', padding:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'white'}}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    className="primary-btn huge" 
                                    style={{width:'100%', marginTop:20}} 
                                    onClick={handlePredict}
                                    disabled={isPredicting}
                                >
                                    {isPredicting ? 'Predicting...' : 'Predict Result'}
                                </button>
                            </div>

                            <div style={{background:'rgba(255,255,255,0.02)', borderRadius:12, padding:20, border:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', minHeight:200}}>
                                {!predictionResult ? (
                                    <div style={{opacity:0.4}}>
                                        <Layers size={40} style={{marginBottom:15}}/>
                                        <p>Enter features and click predict to see results</p>
                                    </div>
                                ) : (
                                    <div style={{animation:'fadeIn 0.3s', width:'100%'}}>
                                        <h4 className="report-section-title" style={{marginBottom:24}}>Prediction Result</h4>
                                        <div style={{fontSize:'3rem', fontWeight:800, color:'var(--accent)', textShadow:'0 0 20px rgba(139, 92, 246, 0.4)', marginBottom:10}}>
                                            {typeof predictionResult.prediction === 'number' && predictionResult.prediction % 1 !== 0 
                                                ? predictionResult.prediction.toFixed(4) 
                                                : predictionResult.prediction}
                                        </div>
                                        
                                        {predictionResult.probability && (
                                            <div style={{marginTop:20, textAlign:'left', width:'100%'}}>
                                                <p style={{fontSize:'0.8rem', opacity:0.6, marginBottom:10}}>Probabilities:</p>
                                                {predictionResult.probability.map((p, i) => (
                                                    <div key={i} style={{marginBottom:8}}>
                                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', marginBottom:4}}>
                                                            <span>Class {i}</span>
                                                            <span>{(p * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <div style={{height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden', width:'100%'}}>
                                                            <div style={{height:'100%', width:`${p*100}%`, background:'var(--accent)'}} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleDeleteDataset = (e, id) => {
        e.stopPropagation();
        setDialogConfig({
            isOpen: true,
            isConfirm: true,
            title: 'Delete Dataset',
            message: 'Are you sure you want to delete this dataset? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
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
        });
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
            setLogs(prev => [...prev, `[ERROR] Processing failed: ${err.message}`]);
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
            }, 1000); // Enforce minimum 1 sec loading visibility
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
 
    const handlePredict = async () => {
        if (!testModel || !testModel.latest_run_id) {
            toast.error("No trained run found for this model");
            return;
        }
        
        setIsPredicting(true);
        try {
            // Pre-process input: convert strings to numbers where possible
            const processedInput = {};
            Object.entries(testInput).forEach(([k, v]) => {
                processedInput[k] = isNaN(v) || v === "" ? v : parseFloat(v);
            });
            
            const res = await trainingService.predict(testModel.latest_run_id, processedInput);
            if (res.data) {
                setPredictionResult(res.data);
                toast.success("Prediction complete!");
            }
        } catch (err) {
            console.error("Prediction failed", err);
            toast.error(`Prediction failed: ${err.message}`);
        } finally {
            setIsPredicting(false);
        }
    };

    const handleRunTraining = async () => {
        if (!activeDataset || !selectedAlgo) return;
        setIsTraining(true);
        setLogs(prev => [...prev, `[INFO] Initializing ${selectedAlgo.name} on ${activeDataset.name}...`]);

        try {
            const expRes = await experimentService.create({
                project: activeProject.id,
                name: `${selectedAlgo.name} - ${new Date().toLocaleTimeString()}`,
                status: 'Running',
                model_type: selectedAlgo.id 
            });
            const createRunRes = await trainingService.createRun(expRes.data.id);
            const runRes = await trainingService.startRun(createRunRes.data.id, {
                dataset_id: activeDataset.id,
                parameters: { 
                    ...modelConfig, 
                    train_split: trainSplit, 
                    epochs: modelConfig.epochs || 10,
                    target_column: targetCol,
                    feature_columns: featureCols
                }
            });
            setActiveRun(createRunRes.data);
            startPolling(createRunRes.data.id);
        } catch (err) {
            setLogs(prev => [...prev, `[ERROR] Training failed: ${err.message}`]);
            setIsTraining(false);
        }
    };

    const startPolling = (runId) => {
        const interval = setInterval(async () => {
            try {
                const res = await trainingService.getRunStatus(runId);
                if (res.data.logs) {
                    // Split logs by newline and update
                    const newLogs = res.data.logs.split('\n').filter(l => l.trim());
                    setLogs(newLogs);
                }
                if (res.data.status === 'Completed' || res.data.status === 'Failed') {
                    setIsTraining(false);
                    clearInterval(interval);
                    if (res.data.status === 'Completed') {
                        addLog("[SUCCESS] Training completed successfully.");
                        toast.success("Training completed!");
                        loadExperiments(); // Refresh list to show the new model
                    } else {
                        addLog("[ERROR] Training failed on server.");
                        toast.error("Training failed.");
                    }
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
        setDialogConfig({
            isOpen: true,
            isConfirm: true,
            title: 'Delete Column',
            message: `Are you sure you want to delete column "${colName}"?`,
            type: 'warning',
            confirmText: 'Delete',
            onConfirm: () => {
                const newData = editData.map(row => {
                    const newRow = { ...row };
                    delete newRow[colName];
                    return newRow;
                });
                setEditData(newData);
            }
        });
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
                        
                        <div className="summary-details">
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
                        <button className="text-btn" onClick={() => { setIsConfigured(false); setActiveRun(null); }}>Back to Configuration</button>
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

                        <h3 style={{marginTop:30}}>Hyperparameters</h3>
                        <div className="params-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
                            {Object.entries(modelConfig).map(([key, val]) => {
                                const label = key.replace('_', ' ');
                                
                                // Specialized Inputs for Experts
                                if (key === 'penalty') {
                                    return (
                                        <div key={key} className="input-group">
                                            <label style={{textTransform:'capitalize'}}>{label}</label>
                                            <select 
                                                value={val}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.value})}
                                                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                            >
                                                <option value="l2">L2 (Ridge)</option>
                                                <option value="l1">L1 (Lasso)</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>
                                    );
                                }
                                
                                if (key === 'solver') {
                                    const solvers = selectedAlgo.id === 'logistic_regression' 
                                        ? ['lbfgs', 'liblinear', 'newton-cg', 'newton-cholesky', 'sag', 'saga']
                                        : ['lbfgs', 'liblinear'];
                                    return (
                                        <div key={key} className="input-group">
                                            <label style={{textTransform:'capitalize'}}>{label}</label>
                                            <select 
                                                value={val}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.value})}
                                                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                            >
                                                {solvers.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    );
                                }

                                if (key === 'kernel') {
                                    return (
                                        <div key={key} className="input-group">
                                            <label style={{textTransform:'capitalize'}}>{label}</label>
                                            <select 
                                                value={val}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.value})}
                                                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                            >
                                                <option value="rbf">RBF (Gaussian)</option>
                                                <option value="linear">Linear</option>
                                                <option value="poly">Polynomial</option>
                                                <option value="sigmoid">Sigmoid</option>
                                            </select>
                                        </div>
                                    );
                                }

                                if (key === 'class_weight') {
                                    return (
                                        <div key={key} className="input-group">
                                            <label style={{textTransform:'capitalize'}}>{label}</label>
                                            <select 
                                                value={val === null ? 'none' : 'balanced'}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.value === 'none' ? null : 'balanced'})}
                                                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                            >
                                                <option value="none">None (Equal)</option>
                                                <option value="balanced">Balanced (Inverse Frequency)</option>
                                            </select>
                                        </div>
                                    );
                                }
                                
                                if (key === 'criterion') {
                                    return (
                                        <div key={key} className="input-group">
                                            <label style={{textTransform:'capitalize'}}>{label}</label>
                                            <select 
                                                value={val}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.value})}
                                                style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                            >
                                                <option value="gini">Gini Impurity</option>
                                                <option value="entropy">Information Gain (Entropy)</option>
                                                {selectedAlgo.id === 'random_forest' && <option value="log_loss">Log Loss</option>}
                                            </select>
                                        </div>
                                    );
                                }

                                if (typeof val === 'boolean') {
                                    return (
                                        <div key={key} className="input-group" style={{display:'flex', alignItems:'center', gap:10, paddingTop:24}}>
                                            <input 
                                                type="checkbox"
                                                checked={val}
                                                onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.checked})}
                                                style={{width:18, height:18, accentColor:'var(--accent)'}}
                                            />
                                            <label style={{textTransform:'capitalize', cursor:'pointer'}}>{label}</label>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className="input-group">
                                        <label style={{textTransform:'capitalize'}}>{label}</label>
                                        <input 
                                            type={typeof val === 'number' ? 'number' : 'text'}
                                            value={val}
                                            onChange={(e) => setModelConfig({...modelConfig, [key]: e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})}
                                            style={{width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'4px', color:'#fff'}}
                                        />
                                    </div>
                                );
                            })}
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
        setIsLoadingBarActive(true);
        addLog(`[INFO] Fetching properties and calculating statistics...`);
        try {
            const res = await datasetService.refreshStats(activeDataset.id);
             
            if (res.data) {
                setStats(res.data);
                addLog(`[SUCCESS] Stats generated for ${activeDataset.name}`);
            }
        } catch (err) {
            console.error(err);
            addLog(`[ERROR] Failed to fetch properties: ${err.message}`);
        } finally {
            setTimeout(() => {
                setIsLoadingBarActive(false);
            }, 1000); // Enforce minimum 1 sec loading visibility
        }
    };
    // --- Persistence & URL Sync ---
    useEffect(() => {
        const syncProject = async () => {
            if (urlProjectId && (!activeProject || activeProject.id !== parseInt(urlProjectId))) {
                 try {
                     const res = await projectService.getProject(urlProjectId);
                     if (res.data) {
                         enterArenaWithProject(res.data);
                     }
                 } catch (err) {
                     console.error("Failed to sync project from URL", err);
                 }
            }
        };
        syncProject();
    }, [urlProjectId, activeProject, enterArenaWithProject]);

    useEffect(() => {
        console.log("MLArena Render State:", { 
            hasProject: !!activeProject, 
            projectId: activeProject?.id,
            isArenaVisible
        });
    }, [activeProject, isArenaVisible]);

    // If we have a project URL but haven't loaded the project yet, show nothing
    if (urlProjectId && !activeProject) {
        return <div className="app-loading-overlay"><div className="loading-spinner-large"></div></div>;
    }

    // Guard: Only show if visible or if we are on a project route
    if (!isArenaVisible && !urlProjectId) return null;

    if (!activeProject) {
        return (
             <div className="arena-container arena-selection-view">
                <div className="selection-overlay-bg" />
                <div className="workspace-picker-v2">
                    <div className="picker-container">
                        <div className="picker-header" style={{ textAlign: 'left', padding: '40px' }}>
                            <div className="brand-badge">ML STUDIO</div>
                            <h1 style={{ textAlign: 'left', margin: '12px 0' }}>Select Workspace</h1>
                            <p style={{ margin: 0 }}>Choose a project to begin your machine learning workflow.</p>
                        </div>

                        <div className="picker-search">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by name or domain (CV, NLP...)" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="picker-scroll-area">
                            {isLoadingProjects ? (
                                <div className="picker-loading">
                                    <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
                                    <p>Gathering your workspaces</p>
                                </div>
                            ) : filteredProjects.length === 0 ? (
                                <div className="picker-empty">
                                    <div className="empty-icon"><Box size={40} opacity={0.2} /></div>
                                    <p>No projects found matching "{searchQuery}"</p>
                                    <button className="text-btn" onClick={() => navigate('/projects')}>Create New Project</button>
                                </div>
                            ) : (
                                <div className="picker-grid">
                                    {filteredProjects.map(p => {
                                        const Icon = p.domain === 'CV' ? Box : p.domain === 'NLP' ? BrainCircuit : Folder;
                                        return (
                                            <div key={p.id} className="picker-card" onClick={() => handleProjectClick(p)}>
                                                <div className="card-inner">
                                                    <div className="icon-wrapper">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="card-content">
                                                        <h3>{p.name}</h3>
                                                        <div className="card-meta">
                                                            <span className="domain-tag">{p.domain}</span>
                                                            <span className="dot">•</span>
                                                            <span className="date">ID: {p.id}</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-arrow">
                                                        <ArrowRight size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="picker-footer">
                            <button className="secondary-btn" onClick={resetLaunch}>Cancel and Return</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="arena-container">
            <Dialog 
                isOpen={isCloseConfirmOpen}
                onClose={() => setIsCloseConfirmOpen(false)}
                onConfirm={confirmClose}
                isConfirm={true}
                title="Close Project"
                message="Are you sure you want to close this project? Any unsaved progress will be lost."
                confirmText="Close Workspace"
                type="danger"
            />
            <Dialog 
                {...dialogConfig}
                onClose={() => setDialogConfig({ isOpen: false })}
            />
            <ProjectSettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                project={activeProject}
                onSave={async (newSettings) => {
                    const res = await projectService.updateProject(activeProject.id, { settings: newSettings });
                    setActiveProject(res.data);
                }}
            />


            {(isLoadingBarActive || isTraining || isProcessing) && <div className="top-loading-bar"></div>}
            <header className="arena-menu-bar" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--bg-dark)', height: '48px', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="professional-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        <Folder size={14} />
                        <span>Projects</span>
                        <ChevronRight size={12} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{activeProject.title || activeProject.name}</span>
                    </div>
                </div>

                <div className="arena-nav-tabs" style={{ display: 'flex', gap: '2px', height: '100%', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    {[
                        { id: 'train', label: 'Train Model', icon: Play },
                        { id: 'preprocess', label: 'Pre-process', icon: Wand2 },
                        { id: 'correlation', label: 'Correlation', icon: Activity }
                    ].map(tab => {
                        const isActive = location.pathname.endsWith(tab.id) || (tab.id === 'train' && location.pathname.endsWith(activeProject.id));
                        const Icon = tab.icon;
                        return (
                            <div 
                                key={tab.id}
                                className={`nav-tab-item ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (tab.id === 'preprocess') { setShowPreprocessing(true); setShowCorrelation(false); }
                                    else if (tab.id === 'correlation') handleCorrelation();
                                    else { navigate(`/projects/${activeProject.id}/train`); setShowPreprocessing(false); setShowCorrelation(false); }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 20px',
                                    height: '100%',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'var(--text-main)' : 'var(--text-dim)',
                                    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                                    transition: 'all 0.2s ease',
                                    background: isActive ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                                }}
                            >
                                <Icon size={14} style={{ marginRight: '8px', color: isActive ? 'var(--primary)' : 'inherit' }} />
                                {tab.label}
                            </div>
                        );
                    })}
                </div>

                <div className="arena-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="control-btn-icon" 
                        onClick={() => setIsSettingsOpen(true)}
                        title="Workspace Settings"
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            padding: '6px',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Settings size={16} />
                    </button>
                    <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                    <button 
                        className="control-btn-close" 
                        onClick={handleCloseProject}
                        style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                        }}
                    >
                        <X size={14} /> Close
                    </button>
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
                <div className="ide-panel area-sidebar" style={{position:'relative', overflow:'hidden', display:'flex', flexDirection:'column'}}>
                    <div className="resizer-v" onMouseDown={(e) => startResize(e, 'sidebar')} style={{right:-3, cursor: 'col-resize', height: '100%', position: 'absolute', top: 0, zIndex: 100}}></div>
                    
                    <div className="sidebar-sector" style={{height: `${sidebarSplit}%`, minHeight: 0, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                        <div 
                            className="panel-header section-header-ide" 
                            style={{
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                position: 'sticky', 
                                top: 0, 
                                zIndex: 10, 
                                background: 'rgba(20,20,30,0.95)',
                                borderLeft: '3px solid var(--accent)',
                                padding: '12px'
                            }} 
                            onClick={() => setIsDatasetsOpen(!isDatasetsOpen)}
                        >
                            <ChevronRight size={14} style={{transform: isDatasetsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', marginRight: 8, color: 'var(--accent)'}} />
                            <h3 style={{flex: 1, margin: 0, display: 'flex', alignItems: 'center', fontSize:'0.75rem', letterSpacing:1.5, fontWeight:800}}> DATASETS</h3>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{display:'none'}} 
                                onChange={handleFileUpload} 
                                accept=".csv,.json"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button 
                                className="clean-icon-btn" 
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} 
                                style={{padding: '4px 6px', color: 'var(--accent)'}}
                                title="Upload Dataset"
                            >
                                <PlusCircle size={16}/>
                            </button>
                        </div>
                        {isDatasetsOpen && (
                            <div className="panel-content" style={{flex: 1, overflowY: 'auto', minHeight: 0}}>
                                {datasets.length === 0 ? <div className="empty-state">No datasets yet</div> : (
                                <ul className="file-list">
                                    {datasets.map(ds => (
                                        <li key={ds.id} 
                                            className={`file-item ${activeDataset?.id === ds.id ? 'active' : ''}`}
                                            onClick={() => handleDatasetSelect(ds)}
                                        >
                                            <div className="file-info-col">
                                                <Database size={14} className="file-icon" style={{color: ds.is_processed ? 'var(--accent)' : 'var(--text-dim)'}}/>
                                                <div className="file-meta">
                                                    <span className="file-name">{ds.name}</span>
                                                    {ds.is_processed && <span className="file-tag">Processed</span>}
                                                </div>
                                            </div>
                                            <button className="dataset-delete-btn" onClick={(e) => handleDeleteDataset(e, ds.id)} title="Delete Dataset">
                                                <Trash2 size={14}/>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            </div>
                        )}
                    </div>

                    <div className="resizer-h-sidebar" onMouseDown={(e) => startResize(e, 'sidebarSplit')} style={{height:4, cursor: 'row-resize', background:'rgba(255,255,255,0.05)', transition:'background 0.2s', zIndex: 10}}></div>

                    <div className="sidebar-sector" style={{flex: 1, minHeight: 0, display:'flex', flexDirection:'column', overflow:'hidden'}}>
                        {/* Models Trained Section */}
                        <div 
                            className="panel-header section-header-ide" 
                            style={{
                                borderTop:'1px solid rgba(255,255,255,0.05)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                position: 'sticky', 
                                top: 0, 
                                zIndex: 10, 
                                background: 'rgba(20,20,30,0.95)',
                                borderLeft: '3px solid var(--secondary)',
                                padding: '12px'
                            }} 
                            onClick={() => setIsModelsOpen(!isModelsOpen)}
                        >
                            <ChevronRight size={14} style={{transform: isModelsOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', marginRight: 8, color: 'var(--secondary)'}} />
                            <h3 style={{margin: 0, display: 'flex', alignItems: 'center', fontSize:'0.75rem', letterSpacing:1.5, fontWeight:800}}> MODELS TRAINED</h3>
                        </div>
                        {isModelsOpen && (
                            <div className="panel-content" style={{flex: 1, overflowY: 'auto', minHeight: 0}}>
                            {experiments.length === 0 ? <div className="empty-state">No models trained yet</div> : (
                            <ul className="file-list models-list">
                                {experiments.map(exp => (
                                    <li 
                                        key={exp.id} 
                                        className={`file-item model-item ${modelMenuOpenId === exp.id ? 'menu-active' : ''}`}
                                        onClick={(e) => {
                                            // Close any open menu if clicking the item itself
                                            if (modelMenuOpenId) setModelMenuOpenId(null);
                                        }}
                                    >
                                        <div className="model-row-primary">
                                            <div className="model-info">
                                                <Layers size={14} className="model-icon"/>
                                                <span className="model-name">{exp.name}</span>
                                            </div>
                                            <button 
                                                className="clean-icon-btn menu-trigger" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setModelMenuOpenId(modelMenuOpenId === exp.id ? null : exp.id); 
                                                }}
                                            >
                                                <MoreVertical size={16}/>
                                            </button>
                                        </div>
                                        <div className="model-row-secondary">
                                            <span className="model-type">{exp.model_type || 'Unknown'}</span>
                                            <div className={`status-pill ${(exp.status || 'unknown').toLowerCase()}`}>
                                                {exp.status || 'Unknown'}
                                            </div>
                                        </div>

                                        {modelMenuOpenId === exp.id && (
                                            <div className="model-context-menu" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => { 
                                                    setTestModel(exp); 
                                                    // Initialize testInput with feature names
                                                    const initialInput = {};
                                                    (exp.config?.feature_columns || []).forEach(col => initialInput[col] = "");
                                                    setTestInput(initialInput);
                                                    setPredictionResult(null);
                                                    setModelMenuOpenId(null); 
                                                }}>
                                                    <PlayCircle size={14}/> Test Model
                                                </button>
                                                <button onClick={() => { setReportModel(exp); setModelMenuOpenId(null); }}>
                                                    <Info size={14}/> View Report
                                                </button>
                                                <button onClick={() => { downloadReport(exp); setModelMenuOpenId(null); }}>
                                                    <Download size={14}/> Download
                                                </button>
                                                <div style={{height:1, background:'rgba(255,255,255,0.05)', margin:'4px 0'}}></div>
                                                <button 
                                                    style={{color:'#ef4444'}} 
                                                    onClick={() => {
                                                        setDialogConfig({
                                                            isOpen: true,
                                                            isConfirm: true,
                                                            title: 'Delete Model',
                                                            message: 'Are you sure you want to delete this model experiment?',
                                                            type: 'danger',
                                                            confirmText: 'Delete',
                                                            onConfirm: async () => {
                                                                try {
                                                                    await experimentService.delete(exp.id);
                                                                    setExperiments(prev => prev.filter(e => e.id !== exp.id));
                                                                    toast.success('Model deleted');
                                                                } catch (err) {
                                                                    toast.error('Failed to delete');
                                                                }
                                                            }
                                                        });
                                                        setModelMenuOpenId(null);
                                                    }}
                                                >
                                                    <Trash2 size={14}/> Delete
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

                {/* 2. Main Canvas */}
                <div className="area-canvas" style={{ background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                    


                    <div className="canvas-main-content" style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
                        {showDataSheet ? renderDataSheet() : activeDataset ? renderModelSelector() : (
                            <div className="canvas-placeholder">
                                <div className="pulse-ring"></div>
                                <h3>Select a Dataset</h3>
                                <p>Choose a dataset from the sidebar to begin.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Right Panel */}
                <div className="ide-panel area-properties" style={{position:'relative', display:'flex', flexDirection:'column', overflow:'hidden'}}>
                    <div className="resizer-v" onMouseDown={(e) => startResize(e, 'props')} style={{left:-3, cursor: 'col-resize'}}></div>
                    <div className="panel-header" style={{flexShrink:0}}><h3>Properties</h3></div>
                    <div className="panel-content" style={{padding: '16px', flex:1, overflowY:'auto'}}>
                        {activeDataset ? (
                            <div className="props-group">
                                <h4 style={{color:'var(--accent)'}}>{activeDataset.name}</h4>
                                {!stats ? (
                                    <div style={{marginTop: 20, textAlign: 'center'}}>
                                        <p style={{color:'var(--text-dim)', fontSize:'0.85rem', marginBottom: 15}}>
                                            Properties and statistics have not been loaded yet.
                                        </p>
                                    </div>
                                ) : (
                                    <>
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

                                    <div style={{marginTop: 24}}>
                                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:4}}>
                                            <h4 style={{color:'var(--accent)', margin:0}}>Data Statistics</h4>
                                            <button 
                                                className="primary-btn"
                                                style={{padding: '4px 12px', fontSize: '0.8rem'}}
                                                onClick={handleRefreshStats} 
                                                disabled={isLoadingBarActive}
                                            >
                                                <Activity size={14} style={{marginRight: 4}} /> Fetch Properties
                                            </button>
                                        </div>
                                        
                                        {!stats ? (
                                             <div style={{color:'var(--text-dim)', fontSize:'0.85rem', textAlign: 'center', margin: '20px 0'}}>
                                                 Click Fetch Properties to calculate column metrics and distributions.
                                             </div>
                                        ) : (
                                        <>
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
                                        </>
                                        )}
                                    </div>
                                    </>
                                )}

                            </div>
                        ) : <div className="empty-props">No selection</div>}
                    </div>
                </div>

                {/* 4. Bottom Console */}
                <div className="ide-panel area-bottom" style={{height: consoleHeight, gridColumn: '1 / span 3', position:'relative'}}>
                    <div className="resizer-h" onMouseDown={(e) => startResize(e, 'console')} style={{top:-3, cursor: 'row-resize'}}></div>
                    <div className="panel-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{display:'flex', alignItems:'center'}}>
                            <Terminal size={14} style={{marginRight:6}}/>
                            <span>Training Monitor</span>
                        </div>
                        <button className="clean-icon-btn" onClick={clearLogs} title="Clear Logs">
                            <Eraser size={14}/>
                        </button>
                    </div>
                    <div className="console-output" ref={consoleRef}>
                        {logs.length === 0 ? <div className="console-placeholder">Ready to train.</div> : (
                            <div className="log-lines">
                                {logs.map((log, i) => <div key={i} className="log-entry">[{new Date().toLocaleTimeString()}] {log}</div>)}
                                {isTraining && <div className="log-entry log-info">Training...</div>}
                            </div>
                        )}
                        <div className="cursor-blink">_</div>
                    </div>
                </div>

                {renderReportModal()}
                {renderTestModelModal()}
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