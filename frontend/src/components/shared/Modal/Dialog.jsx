import React from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Dialog.css';

const Dialog = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Message', 
    message = '', 
    type = 'info', // 'info', 'success', 'warning', 'danger'
    confirmText = 'OK',
    cancelText = 'Cancel',
    isConfirm = false 
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={24} />;
            case 'danger':
            case 'warning': return <AlertCircle size={24} />;
            default: return <Info size={24} />;
        }
    };

    return ReactDOM.createPortal(
        <div className="shared-dialog-overlay" onClick={onClose}>
            <div className="shared-dialog-content" onClick={e => e.stopPropagation()}>
                <div className={`shared-dialog-accent ${type}`} />
                
                <button className="shared-dialog-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="shared-dialog-header">
                    <div className={`shared-dialog-icon ${type}`}>
                        {getIcon()}
                    </div>
                    <h2>{title}</h2>
                </div>
                
                <div className="shared-dialog-body">
                    <p>{message}</p>
                </div>
                
                <div className="shared-dialog-footer">
                    {isConfirm && (
                        <button className="shared-dialog-btn secondary" onClick={onClose}>
                            {cancelText}
                        </button>
                    )}
                    <button 
                        className={`shared-dialog-btn primary ${type}`} 
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Dialog;
