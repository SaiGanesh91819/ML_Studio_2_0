import { useLaunch } from '../../context/LaunchContext.jsx';
import { Upload, Settings, Brain, Zap, Database, BarChart3, Sparkles, ArrowRight } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
    const { triggerLaunch } = useLaunch();
    
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} />
                        <span>End-to-End ML Platform</span>
                    </div>
                    <h1 className="hero-title">
                        Build Your Own
                        <span className="gradient-text"> ML Models</span>
                    </h1>
                    <p className="hero-description">
                        Upload datasets, preprocess your data, and train custom machine learning models 
                        with our intuitive platform. No coding required.
                    </p>
                    <div className="hero-actions">
                        <button className="primary-btn" onClick={triggerLaunch}>
                            Enter the ML World
                        </button>
                        <button className="secondary-btn">
                            View Examples
                        </button>
                    </div>
                </div>
            </section>

            {/* Workflow Steps */}
            <section className="workflow-section">
                <div className="section-header">
                    <h2 className="section-title">Simple 3-Step Process</h2>
                    <p className="section-subtitle">From raw data to trained model in minutes</p>
                </div>

                <div className="workflow-steps">
                    <div className="workflow-step" style={{ '--hover-color': '#8c00ff95' }}>
                        <div className="step-number">01</div>
                        <div className="step-icon purple">
                            <Upload size={28} />
                        </div>
                        <h3 className="step-title">Upload Dataset</h3>
                        <p className="step-description">
                            Import your data from CSV, Excel, or connect to databases. 
                            Support for multiple file formats.
                        </p>
                        <div className="step-arrow">
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    <div className="workflow-step" style={{ '--hover-color': '#ccff0076' }}>
                        <div className="step-number">02</div>
                        <div className="step-icon lime">
                            <Settings size={28} />
                        </div>
                        <h3 className="step-title">Preprocess Data</h3>
                        <p className="step-description">
                            Clean, transform, and prepare your data with built-in tools. 
                            Handle missing values and feature engineering.
                        </p>
                        <div className="step-arrow">
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    <div className="workflow-step" style={{ '--hover-color': '#00eeff9d' }}>
                        <div className="step-number">03</div>
                        <div className="step-icon cyan">
                            <Brain size={28} />
                        </div>
                        <h3 className="step-title">Build Model</h3>
                        <p className="step-description">
                            Choose from various ML algorithms, train your model, 
                            and evaluate performance with real-time metrics.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="feature-icon purple">
                            <Database size={24} />
                        </div>
                        <h3 className="feature-title">Smart Data Processing</h3>
                        <p className="feature-description">
                            Automated data cleaning, normalization, and feature selection with AI-powered suggestions.
                        </p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon lime">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="feature-title">Visual Analytics</h3>
                        <p className="feature-description">
                            Interactive charts and graphs to understand your data and model performance.
                        </p>
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-icon cyan">
                            <Zap size={24} />
                        </div>
                        <h3 className="feature-title">Auto ML</h3>
                        <p className="feature-description">
                            Automatically find the best model and hyperparameters for your dataset.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
