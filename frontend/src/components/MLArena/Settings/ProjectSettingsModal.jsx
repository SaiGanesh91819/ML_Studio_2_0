import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
    X, Settings, Cpu, Database, 
    ShieldCheck, Layout, Save,
    CheckCircle2, AlertCircle, Info,
    Hash, Workflow, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const Toggle = ({ value, onChange }) => (
    <div 
        onClick={() => onChange(!value)}
        style={{
            width: '44px',
            height: '24px',
            borderRadius: '20px',
            background: value ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '2px',
            left: value ? '22px' : '2px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
    </div>
);

const ProjectSettingsModal = ({ isOpen, onClose, project, onSave }) => {
    const [activeTab, setActiveTab] = useState('Training');
    const [settings, setSettings] = useState({
        manual_override: false,
        validation_strategy: 'K-Fold',
        k_folds: 5,
        random_seed: 42,
        stratified_split: true,
        primary_metric: 'accuracy',
        auto_id_discovery: true,
        feature_leakage_shield: true,
        log_verbosity: 'Engineer',
        auto_preprocess_sync: false,
        ...project?.settings
    });

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            await onSave(settings);
            toast.success("Project settings synchronized successfully");
            onClose();
        } catch {
            toast.error("Failed to commit settings to vault");
        }
    };

    const categories = [
        { id: 'Training', icon: Workflow, label: 'Training Logic' },
        { id: 'Governance', icon: ShieldCheck, label: 'Data Governance' },
        { id: 'Metrics', icon: Activity, label: 'Success Metrics' },
        { id: 'Display', icon: Layout, label: 'Studio Display' }
    ];

    const renderSetting = (label, description, element) => (
        <div className="setting-item-row" style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            padding: '20px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div style={{ maxWidth: '65%' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: '1.4' }}>{description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                {element}
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 11000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
                maxWidth: '900px', 
                width: '90%', 
                height: '75vh', 
                display: 'flex', 
                padding: 0,
                overflow: 'hidden'
            }}>
                <div style={{ 
                    width: '260px', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    padding: '32px 16px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 12px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Settings size={20} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Vault Settings</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Project Configuration</div>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            const isActive = activeTab === cat.id;
                            return (
                                <div 
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        marginBottom: '4px',
                                        background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                        color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                                        border: isActive ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent'
                                    }}
                                >
                                    <Icon size={18} />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ padding: '0 12px' }}>
                        <button 
                            className="btn-primary" 
                            onClick={handleSave}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Save size={18} /> Apply Changes
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'var(--bg-dark)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ margin: 0 }}>{activeTab} Settings</h2>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>

                    {activeTab === 'Training' && (
                        <div>
                            {renderSetting(
                                "Manual Hyperparameter Override",
                                "Bypass automated parameter selection. You will be required to define all model specifications manually before every run.",
                                <Toggle value={settings.manual_override} onChange={v => setSettings({...settings, manual_override: v})} />
                            )}
                            {renderSetting(
                                "Validation Strategy",
                                "Method used to evaluate model performance stability across different data slices.",
                                <select 
                                    className="form-input" 
                                    style={{ padding: '8px 12px', fontSize: '0.85rem', width: '200px' }}
                                    value={settings.validation_strategy}
                                    onChange={e => setSettings({...settings, validation_strategy: e.target.value})}
                                >
                                    <option value="K-Fold">K-Fold Cross-Validation</option>
                                    <option value="Holdout">Simple Holdout (80/20)</option>
                                    <option value="Double-Blind">Double-Blind Test Set</option>
                                </select>
                            )}
                            {settings.validation_strategy === 'K-Fold' && renderSetting(
                                "Number of Folds",
                                "Specify the number of partitions for cross-validation. Higher values increase training time but improve result reliability.",
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    style={{ width: '80px', padding: '8px' }}
                                    value={settings.k_folds}
                                    onChange={e => setSettings({...settings, k_folds: parseInt(e.target.value)})}
                                />
                            )}
                            {renderSetting(
                                "Global Random Seed",
                                "Lock the state of randomness across the workspace. Essential for reproducing identical results in collaborative environments.",
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Hash size={14} color="var(--text-dim)" />
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        style={{ width: '100px', padding: '8px' }}
                                        value={settings.random_seed}
                                        onChange={e => setSettings({...settings, random_seed: parseInt(e.target.value)})}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Governance' && (
                        <div>
                            {renderSetting(
                                "Auto-ID Discovery",
                                "Automatically detect and exclude technical IDs, UUIDs, and highly unique strings from the training process to prevent overfitting.",
                                <Toggle value={settings.auto_id_discovery} onChange={v => setSettings({...settings, auto_id_discovery: v})} />
                            )}
                            {renderSetting(
                                "Feature Leakage Shield",
                                "Actively scans input features for 'forward-looking' data that correlates near-perfectly with the target, preventing false performance.",
                                <Toggle value={settings.feature_leakage_shield} onChange={v => setSettings({...settings, feature_leakage_shield: v})} />
                            )}
                            {renderSetting(
                                "Stratified Data Splitting",
                                "Maintain identical class distributions across training and validation sets. Highly recommended for imbalanced datasets.",
                                <Toggle value={settings.stratified_split} onChange={v => setSettings({...settings, stratified_split: v})} />
                            )}
                        </div>
                    )}

                    {activeTab === 'Metrics' && (
                        <div>
                            {renderSetting(
                                "Success Benchmark Metric",
                                "The master metric used to rank experiments and determine the 'Leader' model for this project.",
                                <select 
                                    className="form-input" 
                                    style={{ padding: '8px 12px', fontSize: '0.85rem', width: '200px' }}
                                    value={settings.primary_metric}
                                    onChange={e => setSettings({...settings, primary_metric: e.target.value})}
                                >
                                    <option value="accuracy">Accuracy Score</option>
                                    <option value="f1">F1-Score (Macro)</option>
                                    <option value="precision">Precision</option>
                                    <option value="recall">Recall</option>
                                    <option value="roc_auc">ROC-AUC Curve</option>
                                    <option value="log_loss">Logarithmic Loss</option>
                                </select>
                            )}
                        </div>
                    )}

                    {activeTab === 'Display' && (
                        <div>
                            {renderSetting(
                                "Console Log Verbosity",
                                "Control the level of detail displayed in the Training Monitor during execution.",
                                <select 
                                    className="form-input" 
                                    style={{ padding: '8px 12px', fontSize: '0.85rem', width: '200px' }}
                                    value={settings.log_verbosity}
                                    onChange={e => setSettings({...settings, log_verbosity: e.target.value})}
                                >
                                    <option value="Minimal">Operational (Minimal)</option>
                                    <option value="Engineer">Engineer (Standard)</option>
                                    <option value="Debug">De-Bug (Technical Trace)</option>
                                </select>
                            )}
                            {renderSetting(
                                "Real-time Preprocess Sync",
                                "Automatically apply your saved Pre-processing Canvas logic to any new dataset added to this project context.",
                                <Toggle value={settings.auto_preprocess_sync} onChange={v => setSettings({...settings, auto_preprocess_sync: v})} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProjectSettingsModal;
