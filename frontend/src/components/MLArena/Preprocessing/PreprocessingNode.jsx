import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Settings, Trash2 } from 'lucide-react';

const PreprocessingNode = ({ data, isConnectable, selected }) => {
    return (
        <div className="preprocessing-node" style={{
            background: '#1a1a1a',
            border: selected ? '2px solid #8b5cf6' : '1px solid #333', // Violet accent
            borderRadius: '8px',
            padding: '10px 15px',
            minWidth: '150px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            color: '#fff',
            position: 'relative',
            transition: 'all 0.2s ease'
        }}>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} style={{background:'#555', width:10, height:10}} />
            
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:10}}>
                <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{data.label}</div>
                <div className="node-actions" style={{display:'flex', gap:4}}>
                    <button 
                         className="icon-btn-tiny" 
                         onClick={(e) => { e.stopPropagation(); data.onConfig(); }}
                         style={{background:'transparent', border:'none', color:'#ccc', cursor:'pointer'}}
                         title="Configure"
                    >
                        <Settings size={14}/>
                    </button>
                    <button 
                         className="icon-btn-tiny" 
                         onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
                         style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}}
                         title="Remove Step"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
            {data.config && Object.keys(data.config).length > 0 && (
                <div style={{fontSize:'0.7rem', color:'#888', marginTop:4, borderTop:'1px solid #333', paddingTop:4}}>
                    {Object.entries(data.config).map(([k, v]) => (
                        <div key={k}>{k}: <span style={{color:'#8b5cf6'}}>{v}</span></div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} style={{background:'#555', width:10, height:10}} />
        </div>
    );
};

export default memo(PreprocessingNode);
