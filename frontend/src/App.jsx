/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import ProjectsPage from './components/ProjectsPage/ProjectsPage';
import Dashboard from './components/Dashboard/Dashboard';
import DatasetsPage from './components/DatasetPage/DatasetsPage';
import ModelsPage from './components/ModelsPage/ModelsPage';
import SettingsPage from './components/SettingsPage/SettingsPage';
import MLArenaPage from './components/MLArena/MLArenaPage';
import Footer from './components/Footer/Footer';
import LoginPage from './components/Auth/LoginPage';
import Preloader from './components/Preloader/Preloader';
import ProfileHeader from './components/Header/ProfileHeader'; // Import Header
import { User, Cpu, Activity, Server, X, ArrowRight, Folder, Box, BrainCircuit, Search } from 'lucide-react';
import Lenis from 'lenis';
import { Toaster } from 'sonner';
import { authService, projectService } from './services/api';
import './index.css';

const navItems = [
    { label: 'HOME', id: 'Home', path: '/' },
    { label: 'PROJECTS', id: 'Projects', path: '/projects' },
    { label: 'DASHBOARD', id: 'Dashboard', path: '/dashboard' },
    { label: 'DATASETS', id: 'Datasets', path: '/datasets' },
    { label: 'MODELS', id: 'Models', path: '/models' },
    { label: 'SETTINGS', id: 'Settings', path: '/settings' },
];

import { LaunchProvider, useLaunch } from './context/LaunchContext.jsx';

// ProjectLauncher and ProjectSelectionModal removed as logic moves to ArenaPage and better routing

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isArenaVisible, activeProject, triggerLaunch, enterArenaWithProject, resetLaunch } = useLaunch();

  // Derive active module from URL
  const getActiveModule = (pathname) => {
    if (pathname === '/' || pathname === '') return 'Home';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/datasets')) return 'Datasets';
    if (pathname.startsWith('/models')) return 'Models';
    if (pathname.startsWith('/settings')) return 'Settings';
    // Arena is strictly separated now, returning Home as fallback for HUD active state if navigating elsewhere
    return 'Home';
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [autoReveal, setAutoReveal] = useState(false);
  const [activeModule, setActiveModule] = useState('Home');
  const prevActiveModule = useRef('Home');
  const [rotationOffset, setRotationOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);
  const scrollTimeout = useRef(null);
  const isSnapping = useRef(false);
  const leftSectionRef = useRef(null);
  const lastPath = useRef(location.pathname);

  // Refs for tracking snap state
  // The above declarations already cover these, removing redundant ones.
  // const isSnapping = useRef(false);
  // const prevActiveModule = useRef(activeModule);


  // Auth Flow Handling
  useEffect(() => {
    const checkAuth = () => {
        if (authService.isAuthenticated()) {
            setIsAuthenticated(true);
            setShowPreloader(false);
        } else {
             // If not authenticated and not on login page, might need to handle?
             // But router will handle redirects if we protect routes.
             // Ideally we'd have ProtectedRoute wrapper.
        }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowPreloader(true);
  };

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
    setAutoReveal(true);
    // setTimeout(() => setAutoReveal(false), 2000); <-- REMOVED
  };

  // Disable autoReveal on first mouse move
  useEffect(() => {
    const onMouseMove = () => {
        if (autoReveal) {
            setAutoReveal(false);
        }
    };
    if (autoReveal) {
        window.addEventListener('mousemove', onMouseMove, { once: true });
    }
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [autoReveal]);

  const handleStartClick = () => {
      // Launch the arena. If no project is active, ArenaPage will show the picker.
      triggerLaunch();
  };

  const lenisRef = useRef(null);

  useEffect(() => {
    // Target the new inner scroll container
    const scrollContainer = document.querySelector(".scroll-content");
    if (!scrollContainer) return;

    const lenis = new Lenis({
      wrapper: scrollContainer,
      content: scrollContainer, // Explicitly set content to self if needed, or let it detect
      duration: 1.2,
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
    
    // Scroll to top immediately on route change
    lenis.scrollTo(0, { immediate: true });

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [location.pathname]); // Re-init and scroll top on route change

  // Control Lenis based on Arena visibility
  useEffect(() => {
      if (lenisRef.current) {
          if (isArenaVisible) {
              lenisRef.current.stop();
          } else {
              lenisRef.current.start();
          }
      }
  }, [isArenaVisible]);

  // Effect to handle project ID from URL and launch Arena
  useEffect(() => {
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/');
    const projectIndex = pathSegments.indexOf('projects');
    const isProjectUrl = projectIndex > -1 && pathSegments.length > projectIndex + 1;
    const urlProjectId = isProjectUrl ? pathSegments[projectIndex + 1] : null;

    // 1. Sync Project from URL
    if (isProjectUrl && urlProjectId) {
        // Handle slugged IDs or UUIDs. UUIDs are 36 chars.
        // We'll look for a project that matches either the full segment or the first part
        console.log("Arena URL Sync:", { urlProjectId, currentProjectUuid: activeProject?.uuid });
        
        if (!activeProject || (activeProject.uuid !== urlProjectId && activeProject.id.toString() !== urlProjectId)) {
            const fetchAndLaunchProject = async () => {
                try {
                    const res = await projectService.getProjects();
                    // Match by UUID or ID (fallback)
                    const project = res.data.find(p => p.uuid === urlProjectId || p.id.toString() === urlProjectId);
                    if (project) {
                        enterArenaWithProject({ 
                            id: project.id, 
                            uuid: project.uuid,
                            title: project.name, 
                            type: project.domain 
                        });
                    }
                } catch (error) {
                    console.error("Arena URL Sync Error:", error);
                }
            };
            fetchAndLaunchProject();
        } else if (!isArenaVisible) {
            triggerLaunch();
        }
    } 
    
    // 2. Lifecycle: Hide Arena only when NAVIGATING to hub pages
    const isHubPage = ['/dashboard', '/datasets', '/models', '/settings', '/projects'].includes(currentPath);
    const pathChanged = lastPath.current !== currentPath;
    
    if (isArenaVisible && isHubPage && !isProjectUrl && pathChanged) {
        console.log("Arena Lifecycle: Hiding because navigated to Hub Page", currentPath);
        resetLaunch();
    }

    lastPath.current = currentPath;
  }, [location.pathname, isArenaVisible, activeProject, enterArenaWithProject, triggerLaunch, resetLaunch]);


  const handleWheel = useCallback((e) => {
    if (!isHoveringLeft) return;
    e.preventDefault();

    // User interaction cancels any active snap
    isSnapping.current = false;

    setIsScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
    }, 150);

    // Normal scroll logic
    const sensitivity = 0.08;
    const direction = e.deltaY > 0 ? -1 : 1;
    const scrollAmount = Math.abs(e.deltaY) * sensitivity * direction;

    const minRotation = -200;
    const maxRotation = 0;

    setRotationOffset(prev => {
      const newValue = prev + scrollAmount;
      return Math.max(minRotation, Math.min(maxRotation, newValue));
    });
  }, [isHoveringLeft]);

  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;

    appContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      appContainer.removeEventListener('wheel', handleWheel);
    };
  }, [isHoveringLeft, handleWheel]);

  // ... (useEffect for event listener - unchanged)

  // Snap back logic
  // Snap back logic
  useEffect(() => {
    // Update activeModule based on current path
    const currentActiveModule = getActiveModule(location.pathname);
    if (currentActiveModule !== activeModule) {
        setActiveModule(currentActiveModule);
    }

    // Detect active module change to trigger mandatory snap
    if (activeModule !== prevActiveModule.current) {
        isSnapping.current = true;
        prevActiveModule.current = activeModule;
    }

    if (isArenaVisible) return;

    // Smart Snap Logic:
    // 1. If actively scrolling -> Don't snap.
    // 2. If hovering AND NOT executing a mandatory snap (click) -> Don't snap (allow free explore).
    // 3. Otherwise (Mouse left or Mandatory Snap) -> Snap to active.
    if (isScrolling) return;

    // Only block snapping if we are hovering and NOT in a mandatory snap state
    if (isHoveringLeft && !isSnapping.current) return;

    const index = navItems.findIndex(item => item.id === activeModule);
    const targetIndex = index === -1 ? 0 : index;
    const step = 30;

    // Re-calculating absolute target to avoid drift:
    const absoluteTargetRotation = - (targetIndex * step);
    const minRotation = -210;
    const maxRotation = 70;
    const clampedRotation = Math.max(minRotation, Math.min(maxRotation, absoluteTargetRotation));

    // Check if we need to animate (don't animate if already there)
    if (Math.abs(rotationOffset - clampedRotation) < 0.5) {
        if (Math.abs(rotationOffset - clampedRotation) > 0.01) {
             setRotationOffset(clampedRotation);
        }
        // Snap complete
        isSnapping.current = false;
        return;
    }

    const startRotation = rotationOffset;
    const distance = clampedRotation - startRotation;
    const duration = 600;
    let startTime = null;
    let animationFrameId;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      const newRotation = startRotation + (distance * easeProgress);
      setRotationOffset(newRotation);

      if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isScrolling, activeModule, isArenaVisible, rotationOffset, isHoveringLeft, location.pathname]);

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  const getTextOpacity = (angle) => {
      const sweetSpot = -45;
      const diff = angle - sweetSpot;

      if (diff < 0) {
          const ratio = Math.abs(diff) / 30;
          return Math.max(0, 1 - Math.pow(ratio, 4));
      } else {
          const ratio = diff / 120;
          return Math.max(0, 1 - Math.pow(ratio, 1.5));
      }
  };

  const baseAngle = -45;
  const step = 30;
  const isNavActive = autoReveal || isHoveringLeft;
  const currentRadius = isNavActive ? 380 : 250;

    return (
    <>
        <Toaster 
            position="top-center" 
            theme="dark" 
            richColors 
            closeButton 
            expand={true}
            visibleToasts={5}
            toastOptions={{ 
                style: { 
                    zIndex: 9999
                } 
            }} 
        />
        {!isAuthenticated && <div style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 10000 }}><LoginPage onLogin={handleLogin} /></div>}
        {isAuthenticated && showPreloader && <div style={{ position: 'fixed', width: '100vw', height: '100vh', zIndex: 10000 }}><Preloader onComplete={handlePreloaderComplete} /></div>}



        <div className={`app-container ${isArenaVisible ? 'show-arena' : ''} ${isNavActive ? 'nav-active' : ''}`}>
            {isAuthenticated && !showPreloader && (
            <>
                {/* Layer 1: Main Application */}
                <div className="main-view-layer">
                    {isAuthenticated && !showPreloader && (
                        <div style={{ position: 'absolute', top: '20px', right: '30px', zIndex: 2000 }}>
                            <ProfileHeader onLogout={() => setIsAuthenticated(false)} />
                        </div>
                    )}
                    <div className="focus-overlay" />
                    <div className="bg-grid" />
                    <div className="bg-glow" />

                    <div className="main-layout">
                        <aside
                          ref={leftSectionRef}
                          className={`left-navigation-section ${isNavActive ? 'active' : ''}`}
                          onMouseEnter={() => setIsHoveringLeft(true)}
                          onMouseLeave={() => setIsHoveringLeft(false)}
                        >
                            <div className="nav-hitbox-proxy" />
                            <div className="app-logo">
                                <div className="logo-brand">
                                    <span className="logo-ml">ML</span>
                                    <span className="logo-studio">Studio</span>
                                </div>
                                <div className="logo-tagline">Machine Learning Platform</div>
                            </div>



                            <div className="active-module-indicator">
                                <div className="module-label">Active Tab</div>
                                <div className="module-name">{activeModule}</div>
                                <div className="module-underline"></div>
                            </div>

                            <div className="tech-hud-wrapper">
                                 <TechRingSystem rotationOffset={rotationOffset} isHovering={isNavActive} />
                                 <div className="hud-center">
                                     <button className="start-button" onClick={handleStartClick}>
                                        START
                                     </button>
                                 </div>

                                 <div className="nav-layer">
                                    {navItems.map((item, index) => {
                                        const currentAngle = baseAngle + (index * step) + rotationOffset;
                                        return (
                                            <NavItem
                                                key={item.id}
                                                label={item.label}
                                                active={activeModule === item.id}
                                                onClick={() => handleNavClick(item)}
                                                angle={currentAngle}
                                                textOpacity={getTextOpacity(currentAngle)}
                                                radius={currentRadius}
                                            />
                                        );
                                    })}
                                 </div>
                            </div>
                        </aside>
                        <main className="content-viewport">
                            <div className="scroll-content">
                                <div key={location.pathname} className="page-transition-enter">
                                    <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/projects" element={<ProjectsPage />} />
                                        <Route path="/projects/:projectId/*" element={<ProjectsPage />} />
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/datasets" element={<DatasetsPage />}>
                                            <Route path=":datasetId" element={<DatasetsPage />} />
                                        </Route>
                                        <Route path="/models" element={<ModelsPage />}>
                                            <Route path=":runId" element={<ModelsPage />} />
                                        </Route>
                                        <Route path="/settings" element={<SettingsPage />}>
                                            <Route path=":tab" element={<SettingsPage />} />
                                        </Route>
                                        <Route path="/u/:username" element={<SettingsPage />} /> {/* Profile fallback */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </div>

                                <Footer />
                            </div>
                        </main>
                    </div>
                </div>

                {/* Layer 2: ML Arena */}
                <div className="arena-view-layer">
                    <MLArenaPage />
                </div>


            </>
            )}
        </div>
    </>
  );
}

function App() {
    return (
        <LaunchProvider>
            <AppContent />
        </LaunchProvider>
    );
}

const NavItem = memo(({ label, active, onClick, angle, textOpacity, radius }) => {
    return (
        <div 
            className={`nav-item ${active ? 'active' : ''}`}
            style={{ 
                '--angle': `${angle}deg`,
                '--text-opacity': textOpacity,
                '--radius': `${radius}px`
            }}
            onClick={onClick}
        >
            <div className="nav-connector" />
            <div className="nav-hex" />
            <span className="nav-text">{label}</span>
        </div>
    );
});

const TechRingSystem = memo(({ rotationOffset, isHovering }) => {
    const rotationScale = 2; 
    const scrollRotation = rotationOffset * rotationScale;
    const ringScale = isHovering ? 1 : 0.85;

    return (
        <div className="tech-ring-container" style={{ transform: `scale(${ringScale})`, transition: 'transform 0.5s ease', willChange: 'transform' }}>
            <svg viewBox="0 0 600 600" className="tech-svg">
                <defs>
                    <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--ring-metal-1)" />
                        <stop offset="50%" stopColor="var(--ring-metal-2)" />
                        <stop offset="100%" stopColor="var(--ring-metal-1)" />
                    </linearGradient>
                </defs>
                
                {/* Outer Rings - Single Group for smoother rotation */}
                <g style={{ transform: `rotate(${scrollRotation * 0.4}deg)`, transformOrigin: '300px 300px', willChange: 'transform' }}>
                    <circle cx="300" cy="300" r="270" fill="none" stroke="var(--ring-stroke-1)" strokeWidth="1" strokeDasharray="60 30" className="idle-spin-ccw" />
                    <circle cx="300" cy="300" r="250" fill="none" stroke="var(--ring-stroke-2)" strokeWidth="1" strokeDasharray="10 5" className="idle-spin-cw" />
                </g>
                
                <g style={{ transform: `rotate(${scrollRotation * 0.8}deg)`, transformOrigin: '300px 300px', willChange: 'transform' }}>
                    <circle cx="300" cy="300" r="210" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="50 30" opacity="0.3" className="idle-spin-cw" />
                </g>

                <g style={{ transform: `rotate(${scrollRotation}deg)`, transformOrigin: '300px 300px', willChange: 'transform' }}>
                    <path d="M300,100 L300,120 M300,480 L300,500 M100,300 L120,300 M480,300 L500,300" stroke="var(--secondary)" strokeWidth="4" />
                    <circle cx="300" cy="300" r="170" fill="none" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="2 10" className="idle-spin-ccw" />
                </g>
                
                <circle cx="300" cy="300" r="110" fill="url(#metal-grad)" stroke="var(--primary)" strokeWidth="2" />
                <circle cx="300" cy="300" r="90" fill="var(--ring-center-bg)" />
            </svg>
        </div>
    );
});

export default App;