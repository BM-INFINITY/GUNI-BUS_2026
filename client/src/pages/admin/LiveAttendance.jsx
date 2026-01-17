import { useEffect, useState } from 'react';
import axios from 'axios';
import './LiveAttendance.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LiveAttendance() {
    const [liveData, setLiveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchLiveData();
        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchLiveData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchLiveData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/analytics/live`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLiveData(res.data);
            setLoading(false);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch live data", err);
            setLoading(false);
        }
    };

    // Calculate aggregations
    const totalFleetOccupancy = liveData.reduce((acc, r) => acc + (r.occupancy || 0), 0) / (liveData.length || 1);
    const totalActiveStudents = liveData.reduce((acc, r) => acc + (r.checkedIn || 0), 0);
    const totalCompleted = liveData.reduce((acc, r) => acc + (r.checkedOut || 0), 0);
    const totalSeats = liveData.reduce((acc, r) => acc + (r.totalSeats || 0), 0);

    return (
        <div className="live-dashboard">
            <header className="live-header">
                <div>
                    <h2>🔴 Live Operations Center</h2>
                    <p className="subtitle">Real-time Fleet & Passenger Monitoring</p>
                </div>
                <div className="live-meta">
                    <span className="pulse-dot"></span>
                    <span className="update-time">
                        Last Updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>
            </header>

            {/* High Level Stats */}
            <div className="stats-overview-grid">
                <div className="erp-stat-card primary">
                    <div className="stat-icon">🚌</div>
                    <div className="stat-details">
                        <h3>Active Fleet</h3>
                        <div className="number">{liveData.length}</div>
                        <span className="label">Routes Monitored</span>
                    </div>
                </div>

                <div className="erp-stat-card success">
                    <div className="stat-icon">👥</div>
                    <div className="stat-details">
                        <h3>On Board</h3>
                        <div className="number">{totalActiveStudents}</div>
                        <span className="label">Students in Transit</span>
                    </div>
                </div>

                <div className="erp-stat-card info">
                    <div className="stat-icon">🏁</div>
                    <div className="stat-details">
                        <h3>Completed</h3>
                        <div className="number">{totalCompleted}</div>
                        <span className="label">Trips Finished</span>
                    </div>
                </div>

                <div className="erp-stat-card warning">
                    <div className="stat-icon">💺</div>
                    <div className="stat-details">
                        <h3>Total Capacity</h3>
                        <div className="number">{totalSeats}</div>
                        <span className="label">Fleet Seats</span>
                    </div>
                </div>
            </div>

            {/* Detailed Grid */}
            <div className="route-grid-container">
                <h3 className="section-title">Live Route Status</h3>

                {loading ? (
                    <div className="loading-grid">Loading Live Data...</div>
                ) : (
                    <div className="live-grid">
                        {liveData.map(route => (
                            <div key={route.routeId} className={`route-card ${route.checkedIn > 0 ? 'active' : 'idle'}`}>
                                <div className="route-card-header">
                                    <span className="route-badge">{route.routeNumber}</span>
                                    <span className={`status-dot ${route.checkedIn > 0 ? 'online' : 'offline'}`}></span>
                                </div>

                                <h4 className="route-title">{route.routeName}</h4>
                                <div className="bus-info">
                                    <small>{route.busNumber} ({route.regNumber})</small>
                                </div>

                                <div className="occupancy-section">
                                    <div className="progress-bar-container">
                                        <div
                                            className={`progress-bar-fill ${getOccupancyColor(route.occupancy)}`}
                                            style={{ width: `${route.occupancy}%` }}
                                        ></div>
                                    </div>
                                    <div className="occupancy-labels">
                                        <span>{route.occupancy}% Full</span>
                                        <span>{route.checkedIn} / {route.totalSeats} Seats</span>
                                    </div>
                                </div>

                                <div className="metrics-row">
                                    <div className="metric">
                                        <span className="val">{route.availableSeats}</span>
                                        <span className="lbl">Available</span>
                                    </div>
                                    <div className="metric">
                                        <span className="val">{route.totalPassengers}</span>
                                        <span className="lbl">Expected</span>
                                    </div>
                                    <div className="metric">
                                        <span className="val">{route.checkedOut}</span>
                                        <span className="lbl">Dropped</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getOccupancyColor(percentage) {
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
}
