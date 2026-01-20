import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
    return (
        <div style={{ padding: '40px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Settings size={32} color="#64748b" />
                <h1>Settings</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Configure your workspace preferences and account settings. (Coming Soon)</p>
        </div>
    );
};

export default SettingsPage;
