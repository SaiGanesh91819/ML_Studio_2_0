import React, { useEffect, useRef } from 'react';
import './ProjectsPage.css'; // Shared styles

const ProjectContextMenu = ({ project, onClose, onAction }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        // Use capture to handle event before other listeners if needed, 
        // but bubbling is usually fine. Adding to document.
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className="context-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button className="menu-item" onClick={() => onAction('Edit', project)}>Edit Details</button>
            <button className="menu-item" onClick={() => onAction('Share', project)}>Share</button>
            <button className="menu-item" onClick={() => onAction('Archive', project)}>Archive</button>
            <button className="menu-item delete" onClick={() => onAction('delete', project)}>Delete</button>
        </div>
    );
};

export default ProjectContextMenu;
