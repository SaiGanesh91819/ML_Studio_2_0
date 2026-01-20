import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import { Mail, Lock, User, Github, Chrome, KeyRound, ChevronLeft, Sun, Moon, Check, X } from 'lucide-react';
import { authService } from '../../services/api';
import { toast } from 'sonner';

const LoginPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    
    // Theme State
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        otp: ''
    });
    
    // Validation State
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        upper: false,
        number: false,
        special: false
    });
    const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', null

    const checkPassword = (pwd) => {
        const criteria = {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[!@#$%^&*]/.test(pwd)
        };
        setPasswordCriteria(criteria);
        return Object.values(criteria).every(Boolean);
    };

    const checkUsername = async (username) => {
        if (!username || username.length < 3) {
            setUsernameStatus(null);
            return;
        }
        setUsernameStatus('checking');
        try {
            const res = await authService.checkUsername(username);
            setUsernameStatus(res.exists ? 'taken' : 'available');
        } catch (err) {
            console.error("Username check failed", err);
            setUsernameStatus(null);
        }
    };

    // Debounce username check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isLogin && step === 1) {
                checkUsername(formData.username);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.username, isLogin, step]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') checkPassword(value);
    };

    const resetForm = () => {
        setFormData({ username: '', email: '', password: '', otp: '' });
        setStep(1);
        setIsLoading(false);
        setPasswordCriteria({ length: false, upper: false, number: false, special: false });
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        resetForm();
    };

    const handleSendOTP = async () => {
        // Validate all password criteria before sending OTP
        if (!checkPassword(formData.password)) {
             toast.error("Password does not meet requirements");
             return;
        }

        if (!formData.email || !formData.username) {
            toast.error("Please fill in all fields.");
            return;
        }
        
        setIsLoading(true);
        try {
            await authService.sendOTP(formData.email);
            toast.success("Verification code sent to your email!");
            setStep(2);
        } catch (err) {
            console.error(err);
            const errorData = err.response?.data;
            if (errorData?.email?.[0] === "Email already registered.") {
                toast.error("Email already registered. Please Log In.");
            } else {
                toast.error(errorData?.email?.[0] || "Failed to send OTP. Try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLogin && step === 1) {
            await handleSendOTP();
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await authService.login(formData.username, formData.password);
                toast.success("Welcome back!");
                setTimeout(() => {
                    onLogin();
                }, 1000);
            } else {
                 if (!checkPassword(formData.password)) {
                    toast.error("Invalid password format");
                    setIsLoading(false);
                    return;
                }
                if (usernameStatus === 'taken') {
                    toast.error("Username is already taken");
                    setIsLoading(false);
                    return;
                }

                // Verify OTP & Register
                await authService.register(
                    formData.username, 
                    formData.email, 
                    formData.password,
                    formData.otp
                );
                
                toast.success("Account created successfully! Please login.");
                setIsLogin(true); // Switch to login mode
                resetForm(); // Reset form states
            }
        } catch (err) {
            console.error("Auth Error:", err);
            const msg = err.response?.data?.detail 
                        || err.response?.data?.otp?.[0]
                        || "Authentication failed.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-grid-bg"></div>
            
            {/* Theme Toggle - Top Right */}
            <div className="login-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </div>
            
            <div className="login-card">
                <div className="login-header">
                    <div className="brand-logo">
                        <span className="logo-ml">ML</span>
                        <span className="logo-studio">Studio</span>
                    </div>
                    <h2>
                        {!isLogin && step === 2 ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}
                    </h2>
                    <p>
                        {!isLogin && step === 2 
                            ? `Enter the code sent to ${formData.email}` 
                            : (isLogin ? 'Enter your credentials to access.' : 'Join the future of machine learning.')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    
                    {/* OTP INPUT STEP */}
                    {!isLogin && step === 2 ? (
                        <div className="fade-in">
                            <div className="input-group">
                                <KeyRound size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    name="otp"
                                    placeholder="Enter 6-digit OTP" 
                                    value={formData.otp}
                                    onChange={handleChange}
                                    maxLength={6}
                                    className="otp-input"
                                    autoFocus
                                    required
                                />
                            </div>
                            <button type="button" className="text-btn" onClick={() => setStep(1)} style={{marginBottom: '10px'}}>
                                <ChevronLeft size={14} /> Change Email
                            </button>
                        </div>
                    ) : (
                        /* STANDARD INPUTS */
                        <div className="fade-in">
                            {!isLogin && (
                                    <div className="input-group">
                                        <User size={18} className="input-icon" />
                                        <input 
                                            type="text" 
                                            name="username"
                                            placeholder="Username" 
                                            value={formData.username}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            readOnly={formData.username === ''}
                                            onFocus={(e) => e.target.removeAttribute('readonly')}
                                            required
                                        />
                                        {usernameStatus === 'checking' && <span className="input-status">Checking...</span>}
                                        {usernameStatus === 'available' && <span className="input-status success">✓</span>}
                                        {usernameStatus === 'taken' && <span className="input-status error">Taken</span>}
                                    </div>
                            )}
                            
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    name={isLogin ? "username" : "email"} 
                                    placeholder={isLogin ? "Username" : "Email Address"}
                                    value={isLogin ? formData.username : formData.email}
                                    onChange={(e) => {
                                        const field = isLogin ? 'username' : 'email';
                                        handleChange({ target: { name: field, value: e.target.value } });
                                    }}
                                    required={step === 1}
                                    disabled={step === 2}
                                />
                            </div>

                                <div className="input-group">
                                    <Lock size={18} className="input-icon" />
                                    <input 
                                        type="password" 
                                        name="password"
                                        placeholder="Password" 
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={step === 1}
                                        disabled={step === 2}
                                        readOnly={formData.password === ''} // Hack to prevent autocomplete until focus
                                        onFocus={(e) => e.target.removeAttribute('readonly')}
                                        autoComplete="new-password"
                                        list="autocompleteOff"
                                    />
                                </div>
                                
                                {/* Password Validation Checklist (Only on Signup/Reset steps, not Login) */}
                                {!isLogin && (
                                    <div className="password-checklist">
                                        <div className={`checklist-item ${passwordCriteria.length ? 'valid' : 'invalid'}`}>
                                            {passwordCriteria.length ? <Check size={12} /> : <X size={12} />} 8+ Characters
                                        </div>
                                        <div className={`checklist-item ${passwordCriteria.upper ? 'valid' : 'invalid'}`}>
                                            {passwordCriteria.upper ? <Check size={12} /> : <X size={12} />} Uppercase
                                        </div>
                                        <div className={`checklist-item ${passwordCriteria.number ? 'valid' : 'invalid'}`}>
                                            {passwordCriteria.number ? <Check size={12} /> : <X size={12} />} Number
                                        </div>
                                        <div className={`checklist-item ${passwordCriteria.special ? 'valid' : 'invalid'}`}>
                                            {passwordCriteria.special ? <Check size={12} /> : <X size={12} />} Special Char
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (
                            !isLogin && step === 1 ? 'Send Verification Code' : (isLogin ? 'Sign In' : 'Create Account')
                        )}
                    </button>
                </form>

                <div className="divider">
                    <span>Or continue with</span>
                </div>

                <div className="social-login">
                    <button className="social-btn"><Chrome size={20} /></button>
                    <button className="social-btn"><Github size={20} /></button>
                </div>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={toggleMode}>
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
