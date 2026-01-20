import React from 'react';
import { Cpu } from 'lucide-react';

const ModelsPage = () => {
    return (
        <div style={{ padding: '40px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Cpu size={32} color="#8b5cf6" />
                <h1>Model Registry</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Track and manage your trained machine learning models. (Coming Soon)</p>
        </div>
    );
};

export default ModelsPage;
