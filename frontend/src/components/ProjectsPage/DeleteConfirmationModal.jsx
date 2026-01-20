import React from 'react';
import ReactDOM from 'react-dom';
import './ProjectsPage.css'; // Shared styles

const DeleteConfirmationModal = ({ onClose, onConfirm }) => {
    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Delete Project?</h2>
                <p>Are you sure you want to delete this workspace? This action cannot be undone and all associated data will be lost.</p>
                <div className="modal-actions">
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-danger" onClick={onConfirm}>Delete Forever</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmationModal;
