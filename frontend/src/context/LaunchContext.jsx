/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState } from 'react';

const LaunchContext = createContext();

export const LaunchProvider = ({ children }) => {
    const [isArenaVisible, setIsArenaVisible] = useState(false);
    const [activeProject, setActiveProject] = useState(null);


    // Sync state with URL - REMOVED to prevent unmounting background


    const triggerLaunch = () => {
        setIsArenaVisible(true);
    };

    const enterArenaWithProject = (project) => {
        setActiveProject(project);
        triggerLaunch();
    };

    const resetLaunch = () => {
        setIsArenaVisible(false);
    };

    return (
        <LaunchContext.Provider value={{ isArenaVisible, activeProject, setActiveProject, triggerLaunch, enterArenaWithProject, resetLaunch }}>
            {children}
        </LaunchContext.Provider>
    );
};

export const useLaunch = () => useContext(LaunchContext);
