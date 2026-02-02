import { useState, useEffect } from 'react';
import axios from 'axios';
import './ScanHistory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ScanHistory() {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [journeyLogs, setJourneyLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchScanHistory();
    }, [selectedDate]);

    const fetchScanHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `${API_URL}/journey/daily-summary/${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setJourneyLogs(res.data.logs || []);
            setStats(res.data.summary || {});
        } catch (error) {
            console.error('Failed to fetch scan history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="scan-history-page">
            <header className="scan-history-header">
                <h1>📊 Scan History - All Routes</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                />
            </header>

            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalBoarded || 0}</div>
                    <div className="stat-label">Total Boarded</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.journeyCompleted || 0}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.absent || 0}</div>
                    <div className="stat-label">Absent</div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading scan history...</div>
            ) : journeyLogs.length === 0 ? (
                <div className="no-data">No scans found for this date</div>
            ) : (
                <div className="scan-table-container">
                    <table className="scan-table">
                        <thead>
                            <tr>
                                <th>Enrollment</th>
                                <th>Name</th>
                                <th>Route</th>
                                <th>Shift</th>
                                <th>Boarded</th>
                                <th>Reached Uni</th>
                                <th>Left Uni</th>
                                <th>Reached Home</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journeyLogs.map(log => (
                                <tr key={log._id} className={log.isAbsent ? 'absent-row' : ''}>
                                    <td><code>{log.enrollmentNumber}</code></td>
                                    <td>{log.studentName}</td>
                                    <td>{log.routeId?.routeName || 'N/A'}</td>
                                    <td className="shift-cell">{log.shift}</td>
                                    <td>{formatTime(log.onboarded?.time)}</td>
                                    <td>{formatTime(log.reachedUniversity?.time)}</td>
                                    <td>{formatTime(log.leftForHome?.time)}</td>
                                    <td>{formatTime(log.reachedHome?.time)}</td>
                                    <td>
                                        <span className={`status-badge ${log.journeyStatus}`}>
                                            {log.journeyStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
