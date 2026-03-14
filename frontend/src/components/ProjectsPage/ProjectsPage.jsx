import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    MoreHorizontal, 
    Folder, 
    Box, 
    BrainCircuit,
    Clock,
    Share2
} from 'lucide-react';
import { toast } from 'sonner';
import './ProjectsPage.css';

import CreateWorkspaceModal from './CreateWorkspaceModal';
import EditWorkspaceModal from './EditWorkspaceModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ProjectContextMenu from './ProjectContextMenu';
import Dialog from '../shared/Modal/Dialog';
import { projectService, authService } from '../../services/api';
// import { useLaunch } from '../../context/LaunchContext.jsx'; // Unused

const ProjectsPage = () => {
    const navigate = useNavigate();
    // const { enterArenaWithProject } = useLaunch(); // Unused now
    const [activeFilter, setActiveFilter] = useState('All');
// ... (skip lines)

    const [projectsState, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, userRes] = await Promise.all([
                projectService.getProjects(),
                authService.getProfile()
            ]);
            
            // Map backend data to UI format
            const mappedProjects = projectsRes.data
                .map(p => ({
                    id: p.id,
                    title: p.name,
                    desc: p.description,
                    type: p.domain,
                    lastEdited: new Date(p.updated_at).toLocaleDateString(),
                    updatedAt: new Date(p.updated_at),
                    status: p.status, // 'Active', 'Archived', 'Completed'
                    members: [userRes.data.username || 'User'], // Owner
                    icon: p.domain === 'CV' ? Box : p.domain === 'NLP' ? BrainCircuit : Folder
                }))
                .sort((a, b) => b.updatedAt - a.updatedAt); // Newest first

            setProjects(mappedProjects);
            setUser(userRes.data);

        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };
    const [activeMenu, setActiveMenu] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null); 
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(null);
    const [projectToEdit, setProjectToEdit] = useState(null);

    const handleCreateProject = async (formDataState) => {
        try {
            const formData = new FormData();
            formData.append('name', formDataState.name);
            formData.append('domain', formDataState.domain);
            formData.append('description', formDataState.desc);

            const response = await projectService.createProject(formData);
            
            // Transform backend response to UI model
            const newProject = {
                id: response.data.id,
                title: response.data.name,
                type: response.data.domain,
                lastEdited: 'Just now',
                status: response.data.status,
                members: [user?.username || 'Me'], 
                icon: response.data.domain === 'CV' ? Box : response.data.domain === 'NLP' ? BrainCircuit : Folder
            };
            
            setProjects([newProject, ...projectsState]);
            setShowCreateModal(false);
            toast.success("Workspace created successfully");
        } catch {
            toast.error("Failed to create workspace");
        }
    };

    const handleDeleteProject = async () => {
        try {
            await projectService.deleteProject(showDeleteModal);
            setProjects(projectsState.filter(p => p.id !== showDeleteModal));
            setShowDeleteModal(null);
            toast.success("Project deleted");
        } catch {
            toast.error("Failed to delete project");
        }
    };

    const handleUpdateProject = async (id, data) => {
        try {
            const response = await projectService.updateProject(id, {
                name: data.name,
                description: data.desc,
                domain: data.domain
            });
            
            // Update local state
            setProjects(projectsState.map(p => {
                if(p.id === id) {
                    return {
                        ...p,
                        title: response.data.name,
                        type: response.data.domain,
                        // desc updates but UI doesn't show it in card currently
                    };
                }
                return p;
            }));
            
            setShowEditModal(false);
            setProjectToEdit(null);
            toast.success("Project updated");
            fetchData();
        } catch {
            toast.error("Failed to update project");
        }
    };

    const handleMoreClick = (e, id) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

    const handleMenuAction = async (action, project) => {
        setActiveMenu(null);
        
        switch (action) {
            case 'delete':
                setShowDeleteModal(project.id);
                break;
            case 'edit':
                setProjectToEdit(project);
                setShowEditModal(true);
                break;
            case 'archive':
            case 'restore':
                try {
                    const newStatus = action === 'archive' ? 'Archived' : 'Active';
                    await projectService.updateProject(project.id, { status: newStatus });
                    toast.success(`Project ${action === 'archive' ? 'archived' : 'restored'}`);
                    fetchData();
                } catch {
                    toast.error(`Failed to ${action} project`);
                }
                break;
            case 'share':
                setDialogConfig({
                    isOpen: true,
                    title: 'Share Workspace',
                    message: `Collaborate on "${project.title}". Invite your team to share datasets and experiments.`,
                    type: 'info',
                    isConfirm: true,
                    confirmText: 'Send Invite',
                    onConfirm: () => toast.success("Invitation sent successfully!")
                });
                break;
            default:
                break;
        }
    };

    const handleCardClick = (project) => {
        if (activeMenu) { setActiveMenu(null); return; } 
        navigate(`/projects/${project.id}`);
    };
    const handleMouseMove = (e) => {
        for(const card of document.getElementsByClassName("project-card")) {
            const rect = card.getBoundingClientRect(),
                  x = e.clientX - rect.left,
                  y = e.clientY - rect.top;
            
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        };
    };

    if (loading) {
        return <div className="loading-state">Loading projects...</div>;
    }

    return (
        <div className="projects-container" onMouseMove={handleMouseMove}>
            {/* Header and Filter Bar ... same as before */}
             <div className="projects-header">
                <div className="header-content" style={{ textAlign: 'left' }}>
                    <h1 style={{ textAlign: 'left', marginLeft: 0 }}>Workspaces</h1>
                    <p style={{ textAlign: 'left' }}>Manage and organize your machine learning projects</p>
                </div>
                <button className="create-btn" onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}>
                    <Plus size={20} />
                    <span>New Project</span>
                </button>
            </div>

            <div className="projects-filter-bar">
                {['All', 'Recent', 'Shared', 'Archived'].map(filter => (
                    <button 
                        key={filter}
                        className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter)}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="projects-grid">
                {projectsState
                    .filter(p => {
                        if (activeFilter === 'All') return p.status !== 'Archived';
                        if (activeFilter === 'Archived') return p.status === 'Archived';
                        if (activeFilter === 'Recent') {
                            const oneWeekAgo = new Date();
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                            return p.updatedAt > oneWeekAgo && p.status !== 'Archived';
                        }
                        if (activeFilter === 'Shared') return p.status !== 'Archived' && p.members.length > 1;
                        return true;
                    })
                    .map(project => (
                    <div key={project.id} className="project-card" onClick={() => handleCardClick(project)}>
                        <div className="card-content">
                            <div className="card-header">
                                <div className="project-icon">
                                    <project.icon size={24} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button className="more-btn" onClick={(e) => handleMoreClick(e, project.id)}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                    {activeMenu === project.id && (
                                        <ProjectContextMenu 
                                            project={project} 
                                            onClose={() => setActiveMenu(null)}
                                            onAction={(action) => handleMenuAction(action, project)}
                                        />
                                    )}
                                </div>
                            </div>
                            
                            <h3 className="project-title">{project.title}</h3>
                            <p className="project-meta">{project.type} • Edited {project.lastEdited}</p>

                            <div className="card-footer">
                                <span className={`status-badge ${project.status.toLowerCase()}`}>
                                    {project.status}
                                </span>
                                <div className="members-stack">
                                    {project.members.map((member, i) => {
                                        const initials = member ? member.slice(0, 2).toUpperCase() : 'U';
                                        const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
                                        const colorIndex = member.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                                        const bgColor = colors[colorIndex];
                                        
                                        return (
                                            <div 
                                                key={i} 
                                                className="member-avatar"
                                                title={member}
                                                style={{
                                                    background: bgColor,
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #1a1a1a' // Match card bg for stacking effect
                                                }}
                                            >
                                                {initials}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* New Workspace Placeholder Card */}
                <div className="project-card" onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }} style={{ borderStyle: 'dashed', background: 'transparent' }}>
                     <div className="card-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                        <div className="project-icon" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                            <Plus size={24} />
                        </div>
                        <h3 className="project-title" style={{ fontSize: '1rem' }}>Create Workspace</h3>
                     </div>
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateWorkspaceModal 
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateProject}
                />
            )}

            {showEditModal && projectToEdit && (
                <EditWorkspaceModal
                    project={projectToEdit}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={handleUpdateProject}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmationModal
                    onClose={() => setShowDeleteModal(null)}
                    onConfirm={handleDeleteProject}
                />
            )}

            <Dialog 
                {...dialogConfig} 
                onClose={() => setDialogConfig({ isOpen: false })} 
            />
        </div>
    );
};

export default ProjectsPage;
