/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    ReactFlowProvider, 
    ReactFlow, 
    addEdge, 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState,
    Controls as FlowControls
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, X, Wand2 } from 'lucide-react';
import ReactDOM from 'react-dom';
import PreprocessingSidebar from './PreprocessingSidebar';
import PreprocessingNode from './PreprocessingNode';
import PreprocessingOptionModal from './PreprocessingOptionModal';
import Dialog from '../../shared/Modal/Dialog';
// import { toast } from 'sonner';

const nodeTypes = {
    custom: PreprocessingNode,
};

const PreprocessingCanvas = ({ dataset, onClose, onRun, stats }) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [configuringNodeId, setConfiguringNodeId] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    // Initialize with Dataset Node
    useEffect(() => {
        if (nodes.length === 0 && dataset) {
            setNodes([{
                id: 'source',
                type: 'input',
                position: { x: 50, y: 300 },
                data: { label: `Dataset: ${dataset.name}` },
                style: { background: '#8b5cf6', color: '#fff', border: '1px solid #7c3aed', borderRadius:8, width: 180, fontWeight:'bold' }
            }]);
        }
    }, [dataset, setNodes]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNodeId = `node_${Date.now()}`;
            const newNode = {
                id: newNodeId,
                type: 'custom',
                position,
                data: { 
                    label, 
                    type, 
                    config: {},
                    onConfig: () => setConfiguringNodeId(newNodeId),
                    onDelete: () => setNodes((nds) => nds.filter((n) => n.id !== newNodeId))
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const handleConfigSave = (newConfig) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === configuringNodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            config: newConfig,
                        },
                    };
                }
                return node;
            })
        );
        setConfiguringNodeId(null);
    };

    const handleRunPipeline = () => {
        // Convert Graph to Ordered List
        // 1. Find dependencies
        // Simple BFS from Source
        const sortedSteps = [];
        const visited = new Set();
        const queue = ['source'];
        
        // This is a simplified traversal assuming linear or tree from source
        // For real DAG sort we need more robust logic but this works for user "align in order"
        
        // Map source -> targets
        const graph = {};
        edges.forEach(edge => {
            if (!graph[edge.source]) graph[edge.source] = [];
            graph[edge.source].push(edge.target);
        });

        // Traverse
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId)) continue;
            
            visited.add(currentId);
            
            // Add to execution list if not source
            if (currentId !== 'source') {
                const node = nodes.find(n => n.id === currentId);
                if (node) {
                    sortedSteps.push({
                        type: node.data.type,
                        ...node.data.config
                    });
                }
            }

            if (graph[currentId]) {
                queue.push(...graph[currentId]);
            }
        }
        
        if (sortedSteps.length === 0) {
            setDialogConfig({
                isOpen: true,
                title: 'Empty Pipeline',
                message: 'Please connect at least one preprocessing step to the dataset source before running!',
                type: 'warning'
            });
            return;
        }

        onRun(sortedSteps);
    };

    const activeNode = nodes.find(n => n.id === configuringNodeId);

    return (
        <div className="preprocessing-canvas-overlay" style={{
            position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.85)', 
            display:'grid', placeItems:'center', backdropFilter:'blur(5px)'
        }}>
            <div className="preprocessing-canvas-modal" style={{
                width:'90vw', height:'85vh', background:'#0a0a0a', 
                border:'1px solid #333', borderRadius:'12px', overflow:'hidden',
                display:'flex', flexDirection:'column', boxShadow:'0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div className="canvas-header" style={{
                    height: 45, borderBottom: '1px solid #333', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 20px', background:'#0a0a0a'
                }}>
                    <div style={{display:'flex', gap:10}}>
                         <button className="secondary-btn" style={{padding:'4px 12px', fontSize:'0.75rem'}} onClick={onClose}>Discard</button>
                         <button className="primary-btn" onClick={handleRunPipeline} style={{height:30, padding:'0 15px', fontSize:'0.75rem', background: 'var(--accent)', color:'#000', display:'flex', alignItems:'center', gap:6}}>
                            <Play size={14} fill="#000"/> Run Pipeline
                         </button>
                    </div>
                </div>

                {/* Workspace */}
                <div style={{flex:1, display:'flex', overflow:'hidden'}}>
                    <PreprocessingSidebar />
                    <div className="canvas-display" style={{flex:1, position:'relative'}} ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            nodeTypes={nodeTypes}
                            fitView
                            className="react-flow-dark"
                        >
                            <Background color="#151515" gap={20} />
                            <Controls />
                        </ReactFlow>
                        
                        {/* Prompt Overlay if empty */}
                        {nodes.length <= 1 && (
                            <div style={{
                                position:'absolute', top:'20%', left:'50%', transform:'translate(-50%, -50%)', 
                                background:'rgba(0,0,0,0.7)', padding:20, borderRadius:8, pointerEvents:'none', 
                                textAlign:'center', border:'1px dashed #555'
                            }}>
                                <h3 style={{margin:0, marginBottom:8}}>Build Your Pipeline</h3>
                                <p style={{margin:0, opacity:0.7}}>Drag tools from the left sidebar and connect them to your dataset.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Config Modal */}
                {configuringNodeId && activeNode && (
                    <PreprocessingOptionModal 
                        key={configuringNodeId} // Use key to reset state
                        type={activeNode.data.type} 
                        config={activeNode.data.config} 
                        stats={stats}
                        onClose={() => setConfiguringNodeId(null)}
                        onSave={handleConfigSave}
                    />
                )}
                
                <Dialog 
                    {...dialogConfig}
                    onClose={() => setDialogConfig({ isOpen: false })}
                />
            </div>
        </div>
    );
};

// Need to wrap in Provider for hooks like useReactFlow if used deeper, but here we are at top
const PreprocessingCanvasWrapper = (props) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    
    if (!mounted) return null;

    return ReactDOM.createPortal(
        <ReactFlowProvider>
            <PreprocessingCanvas {...props} />
        </ReactFlowProvider>,
        document.body
    );
};

export default PreprocessingCanvasWrapper;
