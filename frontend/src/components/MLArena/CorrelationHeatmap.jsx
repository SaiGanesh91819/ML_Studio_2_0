/* eslint-disable no-unused-vars */
import React from 'react';
import { X } from 'lucide-react';
import './MLArenaPage.css';

const CorrelationHeatmap = ({ data, onClose }) => {
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Safety check
    if (!data || !mounted) return null;

    const columns = Object.keys(data);
    if (columns.length === 0) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, zIndex: 9999, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'grid', placeItems: 'center'
        }} onClick={onClose}>
            <div className="modal-content correlation-modal" style={{
                background: '#121212', border: '1px solid #333', 
                borderRadius: '12px', padding: '24px', 
                maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                    <h3 style={{margin:0, color:'#fff'}}>Correlation Matrix</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}>
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="heatmap-container" style={{overflow:'auto', maxHeight:'calc(90vh - 100px)'}}>
                    <table className="correlation-table" style={{borderCollapse:'collapse', width:'100%'}}>
                        <thead>
                            <tr>
                                <th></th>
                                {columns.map(col => (
                                    <th key={col} title={col} style={{
                                        padding:8, textAlign:'center', color:'#aaa', fontSize:'0.8rem',
                                        borderBottom:'1px solid #333'
                                    }}>
                                        {col.substring(0, 10)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map(row => (
                                <tr key={row}>
                                    <td className="row-label" title={row} style={{
                                        padding:8, textAlign:'right', color:'#aaa', fontSize:'0.8rem', fontWeight:'bold',
                                        borderRight:'1px solid #333'
                                    }}>
                                        {row.substring(0, 10)}
                                    </td>
                                    {columns.map(col => {
                                        const val = data[row][col];
                                        // Color scale -1 to 1
                                        const intensity = Math.abs(val);
                                        const color = val > 0 
                                            ? `rgba(139, 92, 246, ${intensity})` // Violet for positive
                                            : `rgba(239, 68, 68, ${intensity})`; // Red for negative
                                        return (
                                            <td key={col} style={{
                                                background: color, 
                                                color: intensity > 0.5 ? '#fff' : '#aaa',
                                                padding: 8,
                                                textAlign: 'center',
                                                fontSize: '0.8rem'
                                            }}>
                                                {val?.toFixed(2)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>,
        document.body
    );
};

import ReactDOM from 'react-dom';

export default CorrelationHeatmap;
