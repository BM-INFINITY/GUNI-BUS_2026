import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DailyJourneySummary() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedDate) {
            fetchSummary();
        }
    }, [selectedDate]);

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/journey/daily-summary/${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                    <h1>Daily Journey Summary</h1>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Date Selector */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <label><strong>Select Date:</strong></label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        <button onClick={fetchSummary} className="primary-btn">Refresh</button>
                    </div>
                </div>

                {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '10px' }}>{error}</div>}

                {loading ? (
                    <div>Loading summary...</div>
                ) : summary ? (
                    <>
                        {/* Overall Statistics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                            <div className="card">
                                <h4 style={{ margin: '0 0 10px 0' }}>Total Routes</h4>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4f46e5' }}>{summary.totalRoutes || 0}</div>
                            </div>
                            <div className="card">
                                <h4 style={{ margin: '0 0 10px 0' }}>Total Students</h4>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{summary.totalStudents || 0}</div>
                            </div>
                            <div className="card">
                                <h4 style={{ margin: '0 0 10px 0' }}>Completed Trips</h4>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7' }}>{summary.completedTrips || 0}</div>
                            </div>
                            <div className="card">
                                <h4 style={{ margin: '0 0 10px 0' }}>Pending Trips</h4>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>{summary.pendingTrips || 0}</div>
                            </div>
                        </div>

                        {/* Route-wise Summary */}
                        <div className="card">
                            <h3>Route-wise Journey Details</h3>
                            {summary.routes && summary.routes.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Shift</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Driver</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Start Time</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>End Time</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Students</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.routes.map((route, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}><strong>{route.routeName}</strong></td>
                                                <td style={{ padding: '10px' }}>{route.shift}</td>
                                                <td style={{ padding: '10px' }}>{route.driverName || 'N/A'}</td>
                                                <td style={{ padding: '10px' }}>{route.startTime ? new Date(route.startTime).toLocaleTimeString() : '-'}</td>
                                                <td style={{ padding: '10px' }}>{route.endTime ? new Date(route.endTime).toLocaleTimeString() : '-'}</td>
                                                <td style={{ padding: '10px' }}>{route.studentsCount || 0}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: route.status === 'completed' ? '#d1fae5' : route.status === 'in-progress' ? '#fef3c7' : '#fee2e2',
                                                        color: route.status === 'completed' ? '#065f46' : route.status === 'in-progress' ? '#92400e' : '#991b1b',
                                                        fontSize: '12px'
                                                    }}>
                                                        {route.status || 'pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No journey data available for this date</p>
                            )}
                        </div>

                        {/* Checkpoint Timeline */}
                        {summary.checkpoints && summary.checkpoints.length > 0 && (
                            <div className="card" style={{ marginTop: '20px' }}>
                                <h3>Checkpoint Timeline</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Checkpoint</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.checkpoints.map((cp, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '10px' }}>{cp.routeName}</td>
                                                <td style={{ padding: '10px' }}>{cp.checkpoint}</td>
                                                <td style={{ padding: '10px' }}>{new Date(cp.timestamp).toLocaleTimeString()}</td>
                                                <td style={{ padding: '10px' }}>{cp.status}</td>
                                                <td style={{ padding: '10px' }}>{cp.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Issues/Delays */}
                        {summary.issues && summary.issues.length > 0 && (
                            <div className="card" style={{ marginTop: '20px', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                                <h3>Issues & Delays Reported</h3>
                                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                                    {summary.issues.map((issue, index) => (
                                        <li key={index} style={{ marginBottom: '8px' }}>
                                            <strong>{issue.route}:</strong> {issue.description} ({new Date(issue.timestamp).toLocaleTimeString()})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Export Button */}
                        <div style={{ marginTop: '20px' }}>
                            <button className="primary-btn" onClick={() => window.print()}>Print/Export Summary</button>
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <p>Select a date to view journey summary</p>
                    </div>
                )}
            </div>
        </div>
    );
}
