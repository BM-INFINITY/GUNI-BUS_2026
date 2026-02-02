import { useState, useEffect } from 'react';
import axios from 'axios';
import './CheckpointAnalytics.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CheckpointAnalytics() {
    const [checkpoints, setCheckpoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        endDate: getTodayString()
    });

    useEffect(() => {
        fetchCheckpointHistory();
    }, [dateRange]);

    const fetchCheckpointHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            const res = await axios.get(
                `${API_URL}/checkpoints/history?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCheckpoints(res.data);
        } catch (error) {
            console.error('Failed to fetch checkpoint history:', error);
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

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const totalKm = checkpoints.reduce((sum, cp) => sum + (cp.totalKmTraveled || 0), 0);
    const avgKm = checkpoints.length > 0 ? (totalKm / checkpoints.length).toFixed(2) : 0;

    return (
        <div className="checkpoint-analytics-page">
            <header className="analytics-header">
                <h1>🚗 Checkpoint & KM Analytics</h1>
                <div className="date-range-controls">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="date-input"
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="date-input"
                    />
                </div>
            </header>

            {/* Summary Stats */}
            <div className="analytics-summary">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Trips</div>
                        <div className="stat-value">{checkpoints.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🛣️</div>
                    <div className="stat-content">
                        <div className="stat-label">Total KM</div>
                        <div className="stat-value">{totalKm.toFixed(2)}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-label">Avg KM/Trip</div>
                        <div className="stat-value">{avgKm}</div>
                    </div>
                </div>
            </div>

            {/* Checkpoint History Table */}
            {loading ? (
                <div className="loading-state">Loading checkpoint data...</div>
            ) : checkpoints.length === 0 ? (
                <div className="no-data">No checkpoint records found for this date range</div>
            ) : (
                <div className="checkpoint-table-container">
                    <table className="checkpoint-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Driver</th>
                                <th>Route</th>
                                <th>Bus</th>
                                <th>Shift</th>
                                <th>Shift Start</th>
                                <th>Reached Univ</th>
                                <th>Left Univ</th>
                                <th>Reached Home</th>
                                <th>Total KM</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {checkpoints.map(cp => (
                                <tr key={cp._id}>
                                    <td>{formatDate(cp.date)}</td>
                                    <td>{cp.driverId?.name || 'N/A'}</td>
                                    <td>{cp.routeId?.routeName || 'N/A'}</td>
                                    <td>{cp.busId?.busNumber || 'N/A'}</td>
                                    <td className="shift-cell">{cp.shift}</td>
                                    <td>
                                        {cp.checkpoints?.shiftStart ? (
                                            <div className="checkpoint-cell">
                                                <div>{formatTime(cp.checkpoints.shiftStart.timestamp)}</div>
                                                <small>{cp.checkpoints.shiftStart.odometerReading} km</small>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {cp.checkpoints?.reachedUniversity ? (
                                            <div className="checkpoint-cell">
                                                <div>{formatTime(cp.checkpoints.reachedUniversity.timestamp)}</div>
                                                <small>{cp.checkpoints.reachedUniversity.odometerReading} km</small>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {cp.checkpoints?.leftUniversity ? (
                                            <div className="checkpoint-cell">
                                                <div>{formatTime(cp.checkpoints.leftUniversity.timestamp)}</div>
                                                <small>{cp.checkpoints.leftUniversity.odometerReading} km</small>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {cp.checkpoints?.reachedHome ? (
                                            <div className="checkpoint-cell">
                                                <div>{formatTime(cp.checkpoints.reachedHome.timestamp)}</div>
                                                <small>{cp.checkpoints.reachedHome.odometerReading} km</small>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="km-cell">
                                        <strong>{cp.totalKmTraveled ? cp.totalKmTraveled.toFixed(2) : '-'}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${cp.tripStatus}`}>
                                            {cp.tripStatus}
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

function getDateString(date) {
    return date.toISOString().split('T')[0];
}
