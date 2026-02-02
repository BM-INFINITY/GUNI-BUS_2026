import { useState, useEffect } from 'react';
import axios from 'axios';
import './DailyJourneyReport.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DailyJourneyReport() {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [summary, setSummary] = useState({});
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [routeFilter, setRouteFilter] = useState('');
    const [shiftFilter, setShiftFilter] = useState('');

    useEffect(() => {
        fetchDailySummary();
    }, [selectedDate, routeFilter, shiftFilter]);

    const fetchDailySummary = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/journey/daily-summary/${selectedDate}`;
            const params = new URLSearchParams();
            if (routeFilter) params.append('routeId', routeFilter);
            if (shiftFilter) params.append('shift', shiftFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSummary(res.data.summary);
            setLogs(res.data.logs);
        } catch (error) {
            console.error('Failed to fetch daily summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['Enrollment', 'Name', 'Route', 'Shift', 'Onboarded', 'Reached Univ', 'Left Home', 'Reached Home', 'Status'];
        const rows = logs.map(log => [
            log.enrollmentNumber,
            log.studentName,
            log.routeId?.routeName || 'N/A',
            log.shift,
            log.onboarded?.time ? formatTime(log.onboarded.time) : '-',
            log.reachedUniversity?.time ? formatTime(log.reachedUniversity.time) : '-',
            log.leftForHome?.time ? formatTime(log.leftForHome.time) : '-',
            log.reachedHome?.time ? formatTime(log.reachedHome.time) : '-',
            log.journeyStatus
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journey-report-${selectedDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="daily-report-page">
            <header className="report-header">
                <h1>📊 Daily Journey Report</h1>
                <div className="header-controls">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                    <button onClick={exportToCSV} className="export-btn" disabled={logs.length === 0}>
                        📥 Export CSV
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="summary-cards">
                <SummaryCard
                    title="Total Expected"
                    value={summary.totalExpected || 0}
                    icon="👥"
                    color="#3b82f6"
                />
                <SummaryCard
                    title="Boarded"
                    value={summary.totalBoarded || 0}
                    icon="🚌"
                    color="#22c55e"
                />
                <SummaryCard
                    title="Journey Completed"
                    value={summary.journeyCompleted || 0}
                    icon="✅"
                    color="#10b981"
                />
                <SummaryCard
                    title="Absent"
                    value={summary.absent || 0}
                    icon="❌"
                    color="#ef4444"
                />
            </div>

            {/* Filters */}
            <div className="filters-section">
                <select
                    value={shiftFilter}
                    onChange={(e) => setShiftFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>
            </div>

            {/* Journey Table */}
            {loading ? (
                <div className="loading-state">Loading journey data...</div>
            ) : (
                <div className="journey-table-container">
                    {logs.length === 0 ? (
                        <div className="no-data">No journey records found for this date</div>
                    ) : (
                        <table className="journey-table">
                            <thead>
                                <tr>
                                    <th>Enrollment</th>
                                    <th>Name</th>
                                    <th>Route</th>
                                    <th>Shift</th>
                                    <th>Onboarded</th>
                                    <th>Reached Univ</th>
                                    <th>Left Home</th>
                                    <th>Reached Home</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
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
                    )}
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, value, icon, color }) {
    return (
        <div className="summary-card" style={{ borderLeftColor: color }}>
            <div className="card-icon">{icon}</div>
            <div className="card-content">
                <div className="card-title">{title}</div>
                <div className="card-value">{value}</div>
            </div>
        </div>
    );
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
