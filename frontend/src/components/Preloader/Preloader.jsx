import React, { useEffect, useState } from 'react';
import './Preloader.css';
import { ArrowRight } from 'lucide-react';

const Preloader = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setShowButton(true);
                    return 100;
                }
                // Random increments to simulate loading
                return prev + Math.random() * 5; 
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="preloader-container">
            <div className="preloader-content">
                <div className="brand-logo large">
                    <span className="logo-ml">ML</span>
                    <span className="logo-studio">Studio</span>
                </div>
                
                <div className="loading-bar-container">
                    <div className="loading-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="loading-text">
                    {progress < 100 ? `Initializing Systems... ${Math.floor(progress)}%` : 'System Ready'}
                </div>

                {showButton && (
                    <button className="enter-btn-large" onClick={onComplete}>
                        <span>Enter ML World</span>
                        <ArrowRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Preloader;
