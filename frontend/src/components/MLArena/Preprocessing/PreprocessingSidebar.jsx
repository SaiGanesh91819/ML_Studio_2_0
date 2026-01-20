import React from 'react';
import { Layers, Wand2, Hash, Type, Percent } from 'lucide-react';

const tools = [
    { type: 'normalization', label: 'Normalization', icon: <Percent size={16}/>, description: 'Scale numeric data' },
    { type: 'encoding', label: 'Encoding', icon: <Hash size={16}/>, description: 'Convert categories to numbers' },
    { type: 'imputation', label: 'Imputation', icon: <Wand2 size={16}/>, description: 'Fill missing values' },
    { type: 'cleaning', label: 'Data Cleaning', icon: <Type size={16}/>, description: 'Change types, rename cols' },
    // { type: 'feature_selection', label: 'Feature Selection', icon: <Layers size={16}/>, description: 'Select best features' }
];

const PreprocessingSidebar = () => {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="preprocessing-sidebar" style={{
            width: '250px', 
            background: '#111', 
            borderRight: '1px solid #333', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <h3 style={{color:'#fff', marginTop:0, marginBottom:10, fontSize:'1rem'}}>Tools</h3>
            <p style={{color:'#666', fontSize:'0.8rem', marginTop:-8, marginBottom:16}}>Drag items to the canvas.</p>
            
            {tools.map(tool => (
                <div 
                    key={tool.type}
                    onDragStart={(event) => onDragStart(event, tool.type, tool.label)}
                    draggable
                    style={{
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#eee',
                        transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
                >
                    <div style={{color:'#8b5cf6'}}>{tool.icon}</div>
                    <div>
                        <div style={{fontWeight:'bold', fontSize:'0.9rem'}}>{tool.label}</div>
                        <div style={{fontSize:'0.75rem', color:'#666'}}>{tool.description}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PreprocessingSidebar;
