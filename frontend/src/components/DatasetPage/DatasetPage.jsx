import React from 'react';
import { Upload, FileSpreadsheet, Database } from 'lucide-react';

const DatasetPage = () => {
    return (
        <div>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '700', 
                        color: '#fff', 
                        marginBottom: '12px',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Dataset Management
                    </h1>
                    <p style={{ 
                        fontSize: '1.125rem', 
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Upload and manage your datasets for machine learning
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '24px' 
                }}>
                    <div style={{
                        padding: '40px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '24px',
                        backdropFilter: 'blur(30px)',
                        textAlign: 'center'
                    }}>
                        <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '20px' }} />
                        <h3 style={{ color: '#fff', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Upload CSV</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
                            Import data from CSV files
                        </p>
                    </div>

                    <div style={{
                        padding: '40px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '24px',
                        backdropFilter: 'blur(30px)',
                        textAlign: 'center'
                    }}>
                        <FileSpreadsheet size={48} style={{ color: 'var(--secondary)', marginBottom: '20px' }} />
                        <h3 style={{ color: '#fff', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Upload Excel</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
                            Import data from Excel files
                        </p>
                    </div>

                    <div style={{
                        padding: '40px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '24px',
                        backdropFilter: 'blur(30px)',
                        textAlign: 'center'
                    }}>
                        <Database size={48} style={{ color: '#00F0FF', marginBottom: '20px' }} />
                        <h3 style={{ color: '#fff', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Connect Database</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
                            Connect to external databases
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetPage;
