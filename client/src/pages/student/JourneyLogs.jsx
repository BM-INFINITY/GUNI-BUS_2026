import { useState, useEffect } from 'react';
import axios from 'axios';
import './JourneyLogs.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function JourneyLogs() {
    const [journeyLogs, setJourneyLogs] = useState([]);
    const [dateFilter, setDateFilter] = useState('7');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJourneyLogs();
    }, [dateFilter]);

    const fetchJourneyLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `${API_URL}/journey/my-logs?days=${dateFilter}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setJourneyLogs(res.data);
        } catch (error) {
            console.error('Failed to fetch journey logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="journey-logs-section">
                <h2>📅 My Journey History</h2>
                <div className="loading-state">Loading journey logs...</div>
            </div>
        );
    }

    return (
        <div className="journey-logs-section">
            <div className="section-header">
                <h2>📅 My Journey History</h2>
                <div className="date-filter">
                    <button
                        className={dateFilter === '7' ? 'active' : ''}
                        onClick={() => setDateFilter('7')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        className={dateFilter === '30' ? 'active' : ''}
                        onClick={() => setDateFilter('30')}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {journeyLogs.length === 0 ? (
                <div className="no-logs">
                    <p>No journey records found for the selected period</p>
                </div>
            ) : (
                <div className="journey-cards">
                    {journeyLogs.map(log => (
                        <JourneyCard
                            key={log._id}
                            log={log}
                            formatDate={formatDate}
                            formatTime={formatTime}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function JourneyCard({ log, formatDate, formatTime }) {
    return (
        <div className={`journey-card ${log.journeyStatus}`}>
            <div className="journey-header">
                <div className="date-info">
                    <h3>{formatDate(log.date)}</h3>
                    <span className="shift-badge">{log.shift}</span>
                </div>
                <span className={`status-badge ${log.journeyStatus}`}>
                    {log.journeyStatus === 'completed' && '✅ Completed'}
                    {log.journeyStatus === 'in_progress' && '🔄 In Progress'}
                    {log.journeyStatus === 'absent' && '❌ Absent'}
                </span>
            </div>

            {!log.isAbsent ? (
                <div className="journey-timeline">
                    <TimelinePhase
                        icon="🚌"
                        label="Onboarded"
                        time={formatTime(log.onboarded?.time)}
                        completed={!!log.onboarded?.time}
                        method="QR Scan"
                    />
                    <TimelinePhase
                        icon="🏫"
                        label="Reached University"
                        time={formatTime(log.reachedUniversity?.time)}
                        completed={!!log.reachedUniversity?.time}
                        method="Driver Checkpoint"
                    />
                    <TimelinePhase
                        icon="🚌"
                        label="Left for Home"
                        time={formatTime(log.leftForHome?.time)}
                        completed={!!log.leftForHome?.time}
                        method="Driver Checkpoint"
                    />
                    <TimelinePhase
                        icon="🏠"
                        label="Reached Home"
                        time={formatTime(log.reachedHome?.time)}
                        completed={!!log.reachedHome?.time}
                        method="Driver Checkpoint"
                    />
                </div>
            ) : (
                <div className="absence-indicator">
                    <span className="absent-icon">❌</span>
                    <p>Marked Absent</p>
                    <small>Reason: Did not board</small>
                </div>
            )}

            <div className="journey-meta">
                <span>📍 {log.routeId?.routeName || 'Route not assigned'}</span>
                {log.passType === 'day_ticket' && (
                    <span className="ticket-badge">
                        🎟️ Day Ticket ({log.ticketType})
                    </span>
                )}
            </div>
        </div>
    );
}

function TimelinePhase({ icon, label, time, completed, method }) {
    return (
        <div className={`timeline-phase ${completed ? 'completed' : 'pending'}`}>
            <div className="phase-icon">{icon}</div>
            <div className="phase-content">
                <div className="phase-label">{label}</div>
                <div className="phase-time">{time}</div>
                {completed && method && (
                    <div className="phase-method">{method}</div>
                )}
            </div>
            <div className="phase-status">
                {completed ? '✓' : '○'}
            </div>
        </div>
    );
}
