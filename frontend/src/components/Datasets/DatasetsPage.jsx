import React from 'react';
import { Database } from 'lucide-react';

const DatasetsPage = () => {
    return (
        <div style={{ padding: '40px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Database size={32} color="#3b82f6" />
                <h1>Datasets</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Manage your training and evaluation datasets here. (Coming Soon)</p>
        </div>
    );
};

export default DatasetsPage;
