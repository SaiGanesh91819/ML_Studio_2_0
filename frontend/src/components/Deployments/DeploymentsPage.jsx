import React from 'react';
import { Rocket } from 'lucide-react';

const DeploymentsPage = () => {
    return (
        <div style={{ padding: '40px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Rocket size={32} color="#10b981" />
                <h1>Deployments</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Manage your model deployments and endpoints. (Coming Soon)</p>
        </div>
    );
};

export default DeploymentsPage;
