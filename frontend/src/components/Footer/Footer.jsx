import React from 'react';
import { Github, Twitter, Linkedin, Heart, ArrowRight } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="shared-footer">
            <div className="footer-bg-glow" />
            <div className="footer-content">
                <div className="footer-brand-section">
                    <div className="footer-brand">
                        <span className="footer-logo">ML Studio</span>
                        <div className="footer-status">
                            <span className="status-dot"></span>
                            System Operational
                        </div>
                    </div>
                    <p className="footer-tagline">
                        The next generation platform for machine learning development. 
                        Build, train, and deploy models with liquid-smooth interaction.
                    </p>
                    <div className="newsletter-box">
                        <input type="email" placeholder="Enter your email for updates..." className="newsletter-input" />
                        <button className="newsletter-btn">
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="footer-nav-grid">
                    <div className="footer-column">
                        <h4>Platform</h4>
                        <a href="#">Datasets</a>
                        <a href="#">Models</a>
                        <a href="#">Training</a>
                        <a href="#">Deployment</a>
                    </div>
                    <div className="footer-column">
                        <h4>Resources</h4>
                        <a href="#">Documentation</a>
                        <a href="#">API Reference</a>
                        <a href="#">Community Hub</a>
                        <a href="#">Showcase</a>
                    </div>
                    <div className="footer-column">
                        <h4>Company</h4>
                        <a href="#">Our Story</a>
                        <a href="#">Careers</a>
                        <a href="#">Blog</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="copyright-lock">
                    <p className="copyright">© 2026 ML Studio. All rights reserved.</p>
                </div>
                
                <div className="social-links">
                    <a href="#" className="social-icon"><Github size={20} /></a>
                    <a href="#" className="social-icon"><Twitter size={20} /></a>
                    <a href="#" className="social-icon"><Linkedin size={20} /></a>
                </div>
                
                <div className="made-with">
                   <span>Architected in San Francisco</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
