import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { dashboardService } from '../../services/api';
import { 
    Activity, 
    Box, 
    Cpu, 
    Zap, 
    ArrowUpRight, 
    Plus,
    Clock,
    CheckCircle,
    Calendar,
    Filter
} from 'lucide-react';

const Dashboard = () => {
    const [selectedYear, setSelectedYear] = useState('2026');
    const [timeSpan, setTimeSpan] = useState('All Year');
    const [stats, setStats] = useState([]);
    const [activityMap, setActivityMap] = useState({});
    const [activities, setActivities] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const res = await dashboardService.getStats();
                const data = res.data;
                
                setStats(data.stats);
                setActivityMap(data.heatmap);
                setResources(data.resources);
                
                // Format activities for the feed
                const formattedActivities = data.recent_activity.map(act => ({
                    time: new Date(act.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(act.updated_at).toLocaleDateString(),
                    title: `${act.experiment_name}`,
                    desc: `Model run status: ${act.status}`,
                    type: act.type
                }));
                setActivities(formattedActivities);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Derived state for heatmap length
    const getWeeks = () => {
        switch(timeSpan) {
            case '6 Months': return 26;
            case '30 Days': return 5;
            default: return 52;
        }
    };

    // Calculate intensity and info for a specific cell
    const getActivityInfo = (weekIndex, dayIndex) => {
        const totalWeeks = getWeeks();
        const daysFromEnd = ((totalWeeks - 1 - weekIndex) * 7) + (6 - dayIndex);
        
        const date = new Date();
        date.setDate(date.getDate() - daysFromEnd);
        const dateStr = date.toISOString().split('T')[0];

        const count = activityMap[dateStr] || 0;
        let intensity = 0;
        if (count > 0) {
            if (count <= 1) intensity = 1;
            else if (count <= 3) intensity = 2;
            else intensity = 3;
        }

        return { intensity, count, dateStr };
    };
    
    const seed = selectedYear + timeSpan;

    const getIcon = (iconName) => {
        switch(iconName) {
            case 'Box': return Box;
            case 'Cpu': return Cpu;
            case 'Zap': return Zap;
            case 'Activity': return Activity;
            default: return Activity;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <div className="loading-spinner">Loading your dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Hero Section */}
            <div className="dashboard-hero">
                <div className="hero-text">
                    <h1>Your Dashboard</h1>
                </div>
                <div className="hero-actions">
                    <button className="action-btn">
                        <ArrowUpRight size={18} />
                        <span>View Reports</span>
                    </button>
                    <button className="action-btn primary">
                        <Plus size={18} />
                        <span>New Experiment</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map(stat => {
                    const IconComp = getIcon(stat.icon);
                    return (
                        <div key={stat.id} className="stat-card">
                            <div className="stat-glow" style={{ '--glow-color': stat.color }}></div>
                            <div className="stat-icon" style={{ color: stat.color }}>
                                <IconComp size={24} />
                            </div>
                            <h2 className="stat-value">{stat.value}</h2>
                            <p className="stat-label">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Content Split */}
            <div className="dashboard-content">
                {/* Left: Activity Graph */}
                <div className="section-card">
                    <div className="section-header">
                        <h3>Training Activity</h3>
                        <div className="heatmap-controls" style={{ display: 'flex', gap: '12px' }}>
                            <div className="control-group">
                                <Calendar size={14} color="rgba(255,255,255,0.5)" />
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="dashboard-select"
                                >
                                    <option value="2026">2026</option>
                                    <option value="2025">2025</option>
                                    <option value="2024">2024</option>
                                </select>
                            </div>
                            <div className="control-group">
                                <Filter size={14} color="rgba(255,255,255,0.5)" />
                                <select 
                                    value={timeSpan} 
                                    onChange={(e) => setTimeSpan(e.target.value)}
                                    className="dashboard-select"
                                >
                                    <option value="All Year">All Year</option>
                                    <option value="6 Months">Last 6 Months</option>
                                    <option value="30 Days">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Activity Heatmap */}
                    <div className="heatmap-wrapper">
                        {/* Month Labels */}
                        <div className="heatmap-months">
                            {timeSpan === 'All Year' ? (
                                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <span key={i} style={{ flex: 1, textAlign: 'left', paddingLeft: '4px' }}>{m}</span>
                                ))
                            ) : timeSpan === '6 Months' ? (
                                ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <span key={i} style={{ flex: 1 }}>{m}</span>
                                ))
                            ) : (
                                ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((m, i) => (
                                    <span key={i} style={{ flex: 1 }}>{m}</span>
                                ))
                            )}
                        </div>

                        <div className="heatmap-body" style={{ display: 'flex', gap: '8px' }}>
                            {/* Day Labels */}
                            <div className="heatmap-days">
                                <span>Mon</span>
                                <span>Wed</span>
                                <span>Fri</span>
                            </div>

                            <div className="heatmap-grid" key={seed}> 
                                {Array.from({ length: getWeeks() }).map((_, weekIndex) => (
                                    <div key={weekIndex} className="heatmap-col">
                                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                                            const { intensity, count, dateStr } = getActivityInfo(weekIndex, dayIndex);
                                            return (
                                                <div 
                                                    key={dayIndex} 
                                                    className={`heatmap-cell intensity-${intensity}`}
                                                    title={`${dateStr}: ${count} experimental runs`}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="heatmap-legend">
                            <span>Less</span>
                            <div className="legend-scale">
                                <div className="heatmap-cell intensity-0"></div>
                                <div className="heatmap-cell intensity-1"></div>
                                <div className="heatmap-cell intensity-2"></div>
                                <div className="heatmap-cell intensity-3"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    <div className="activity-feed-wrapper">
                        {activities.length > 0 ? activities.map((activity, i) => (
                            <div key={i} className="feed-item">
                                <div className="feed-time">{activity.time}</div>
                                <div className="feed-content">
                                    <h4>{activity.title}</h4>
                                    <p>{activity.desc}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="feed-item" style={{justifyContent: 'center', color: 'rgba(255,255,255,0.4)'}}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Resources */}
                <div className="section-card">
                    <div className="section-header">
                        <h3>Resource Usage</h3>
                    </div>
                    <div className="resource-list">
                        {resources.map((res, i) => (
                            <div key={i}>
                                <div className="resource-header">
                                    <span className="resource-name">{res.name}</span>
                                    <span className="resource-val">{res.used} / {res.limit}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${res.usage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Tips or Status */}
                    <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                            <CheckCircle size={18} color="#10b981" />
                            <span style={{ fontWeight: 500, color: '#fff' }}>All Systems Operational</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                            Server load is normal. Scheduled maintenance in 14 days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
