import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { admin } from '../services/api';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalStudents: 0,
        pendingChanges: 0,
        pendingPasses: 0,
        approvedPasses: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [studentsRes, changesRes, pendingRes, approvedRes] = await Promise.all([
                admin.getStudents({ page: 1, limit: 1 }),
                admin.getProfileChangeRequests(),
                admin.getPendingPassesByRoute(),
                admin.getApprovedPassesByRoute()
            ]);

            const totalPending = pendingRes.data.reduce((sum, route) => sum + route.pendingCount, 0);
            const totalApproved = approvedRes.data.reduce((sum, route) => sum + route.approvedCount, 0);

            setStats({
                totalStudents: studentsRes.data.totalStudents || 0,
                pendingChanges: changesRes.data.length || 0,
                pendingPasses: totalPending,
                approvedPasses: totalApproved
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            icon: '👥',
            title: 'Manage Students',
            desc: 'Add, view, and manage student records',
            path: '/admin/students',
            count: stats.totalStudents
        },
        {
            icon: '📝',
            title: 'Profile Changes',
            desc: 'Review and approve profile change requests',
            path: '/admin/profile-changes',
            count: stats.pendingChanges,
            highlight: stats.pendingChanges > 0
        },
        {
            icon: '⏳',
            title: 'Pending Passes',
            desc: 'Approve or reject pass applications',
            path: '/admin/passes/pending',
            count: stats.pendingPasses,
            highlight: stats.pendingPasses > 0
        },
        {
            icon: '✅',
            title: 'Approved Passes',
            desc: 'View all approved bus passes',
            path: '/admin/passes/approved',
            count: stats.approvedPasses
        },
        {
            icon: '🔴',
            title: 'Live Attendance',
            desc: 'Real-time tracking of all routes',
            path: '/admin/live-attendance',
            count: 'Live'
        },
        {
            icon: '🚌',
            title: 'Manage Buses',
            desc: 'Create and manage fleet',
            path: '/admin/buses',
            count: 'Manage'
        },
        {
            icon: '👮‍♂️',
            title: 'Manage Drivers',
            desc: 'Create drivers and assign routes',
            path: '/admin/drivers',
            count: 'Manage'
        },
        {
            icon: '📊',
            title: 'Pass Scan',
            desc: 'Scan pass check in/check out',
            path: '/admin/scan-pass',
            count: 'N/A'
        }
    ];

    return (
        <div className="dashboard modern-dashboard">
            {/* Header */}
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>🚌 University Bus System</h1>
                        <span className="user-badge">Admin Panel</span>
                    </div>
                    <div className="header-right">
                        <span style={{ marginRight: '15px' }}>{user?.name}</span>
                        <button className="secondary-btn" onClick={logout}>Logout</button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="dashboard-content modern-content">
                <h2 style={{ marginBottom: '20px' }}>Welcome, Admin</h2>

                {loading ? (
                    <div className="loading">Loading dashboard...</div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px'
                        }}
                    >
                        {menuItems.map((item, index) => (
                            <div
                                key={index}
                                className="card modern-card"
                                onClick={() => navigate(item.path)}
                                style={{
                                    cursor: 'pointer',
                                    borderLeft: item.highlight
                                        ? '4px solid #ffc107'
                                        : '4px solid #4f46e5',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                                    {item.icon}
                                </div>
                                <h3>{item.title}</h3>
                                <p style={{ color: '#666', marginBottom: '15px' }}>
                                    {item.desc}
                                </p>
                                <div
                                    style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        background: item.highlight ? '#fff3cd' : '#e8f4fd',
                                        borderRadius: '20px',
                                        fontWeight: 'bold',
                                        color: item.highlight ? '#856404' : '#1565c0'
                                    }}
                                >
                                    {item.count}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
