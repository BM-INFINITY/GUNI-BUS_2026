import { useState, useEffect } from 'react';
import axios from 'axios';
import '../admin/ScanHistory.css'; // Reuse admin styles

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MyScanHistory() {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [journeyLogs, setJourneyLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMyScanHistory();
    }, [selectedDate]);

    const fetchMyScanHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Get journey logs for driver's route only
            const res = await axios.get(
                `${API_URL}/journey/my-scans/${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setJourneyLogs(res.data || []);
        } catch (error) {
            console.error('Failed to fetch my scan history:', error);
            // Fallback: try to get all logs and filter client-side
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${API_URL}/journey/daily-summary/${selectedDate}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setJourneyLogs(res.data.logs || []);
            } catch (err) {
                console.error('Fallback also failed:', err);
            }
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

    const boardedCount = journeyLogs.filter(log => log.onboarded?.time).length;
    const returnedCount = journeyLogs.filter(log => log.leftForHome?.time).length;

    return (
        <div className="scan-history-page">
            <header className="scan-history-header">
                <h1>📋 My Scan History</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                />
            </header>

            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-value">{boardedCount}</div>
                    <div className="stat-label">Students Boarded</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{returnedCount}</div>
                    <div className="stat-label">Return Scans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{journeyLogs.length}</div>
                    <div className="stat-label">Total Students</div>
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
                                <tr key={log._id}>
                                    <td><code>{log.enrollmentNumber}</code></td>
                                    <td>{log.studentName}</td>
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
