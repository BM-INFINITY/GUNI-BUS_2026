import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DriverCheckpoint.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DriverCheckpointForm() {
    const navigate = useNavigate();
    const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
    const [checkpointData, setCheckpointData] = useState({});
    const [studentCount, setStudentCount] = useState(0);
    const [odometerReading, setOdometerReading] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentStatus();
    }, []);

    const fetchCurrentStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/checkpoints/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setCheckpointData(res.data.checkpoint);
            setStudentCount(res.data.studentCount);
            setCurrentCheckpoint(res.data.nextCheckpoint);
        } catch (error) {
            console.error('Failed to fetch checkpoint status:', error);
            alert('Failed to load checkpoint data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!odometerReading || odometerReading <= 0) {
            alert('Please enter a valid odometer reading');
            return;
        }

        // Validation: Check if odometer reading is increasing
        const prevCheckpoints = checkpointData.checkpoints || {};
        const lastReading = getLastOdometerReading(prevCheckpoints);
        if (lastReading && parseInt(odometerReading) <= lastReading) {
            alert(`Odometer reading must be greater than previous reading (${lastReading} km)`);
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/checkpoints/submit`,
                {
                    checkpointType: currentCheckpoint,
                    odometerReading: parseInt(odometerReading)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const info = getCheckpointInfo(currentCheckpoint);
            alert(`✅ ${info.title} recorded!\n${res.data.studentsUpdated} students updated.`);
            setOdometerReading('');
            fetchCurrentStatus();

        } catch (error) {
            alert('Failed to submit checkpoint: ' + (error.response?.data?.message || 'Server error'));
        } finally {
            setSubmitting(false);
        }
    };

    const getLastOdometerReading = (checkpoints) => {
        if (checkpoints.reachedHome?.odometerReading) return checkpoints.reachedHome.odometerReading;
        if (checkpoints.leftUniversity?.odometerReading) return checkpoints.leftUniversity.odometerReading;
        if (checkpoints.reachedUniversity?.odometerReading) return checkpoints.reachedUniversity.odometerReading;
        if (checkpoints.shiftStart?.odometerReading) return checkpoints.shiftStart.odometerReading;
        return null;
    };

    const getCheckpointInfo = (type) => {
        const info = {
            shiftStart: {
                title: 'Shift Start',
                icon: '🚀',
                description: 'Record odometer before starting your route',
                action: 'Start Shift',
                color: '#3b82f6'
            },
            reachedUniversity: {
                title: 'Reached University',
                icon: '🏫',
                description: 'All onboarded students will be marked as "Reached University"',
                action: 'Mark Arrival',
                color: '#22c55e'
            },
            leftUniversity: {
                title: 'Left University',
                icon: '🚌',
                description: 'All students will be marked as "Left for Home"',
                action: 'Mark Departure',
                color: '#f59e0b'
            },
            reachedHome: {
                title: 'Reached Home',
                icon: '🏠',
                description: 'All students will be marked as "Reached Home" and journey completed',
                action: 'Complete Journey',
                color: '#8b5cf6'
            }
        };
        return info[type] || {};
    };

    if (loading) {
        return (
            <div className="checkpoint-page">
                <div className="loading-state">Loading...</div>
            </div>
        );
    }

    if (!currentCheckpoint) {
        return (
            <div className="checkpoint-page">
                <div className="checkpoint-complete">
                    <div className="complete-icon">✅</div>
                    <h2>All Checkpoints Complete</h2>
                    <p>You have completed all checkpoints for today's trip.</p>
                    {checkpointData.totalKmTraveled && (
                        <div className="km-badge">
                            Total Distance: {checkpointData.totalKmTraveled} km
                        </div>
                    )}
                    <button className="back-btn-large" onClick={() => navigate('/driver')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const info = getCheckpointInfo(currentCheckpoint);

    return (
        <div className="checkpoint-page">
            <header className="checkpoint-header">
                <button className="back-btn" onClick={() => navigate('/driver')}>
                    ← Back
                </button>
                <h1>Trip Checkpoint</h1>
            </header>

            <div className="checkpoint-form-card">
                <div className="checkpoint-icon" style={{ color: info.color }}>
                    {info.icon}
                </div>
                <h2>{info.title}</h2>
                <p className="checkpoint-desc">{info.description}</p>

                {studentCount > 0 && (
                    <div className="student-count-badge">
                        👥 {studentCount} students onboarded
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Odometer Reading (KM)</label>
                        <input
                            type="number"
                            placeholder="e.g., 45678"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            required
                            min="0"
                            className="odometer-input"
                        />
                        {getLastOdometerReading(checkpointData.checkpoints || {}) && (
                            <small className="hint-text">
                                Previous: {getLastOdometerReading(checkpointData.checkpoints || {})} km
                            </small>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        style={{ background: info.color }}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : `${info.action} & Update Students`}
                    </button>
                </form>

                <div className="checkpoint-progress">
                    <h3>Today's Progress</h3>
                    <div className="progress-list">
                        <CheckpointItem
                            name="Shift Start"
                            icon="🚀"
                            completed={!!checkpointData.checkpoints?.shiftStart}
                            data={checkpointData.checkpoints?.shiftStart}
                        />
                        <CheckpointItem
                            name="Reached University"
                            icon="🏫"
                            completed={!!checkpointData.checkpoints?.reachedUniversity}
                            data={checkpointData.checkpoints?.reachedUniversity}
                        />
                        <CheckpointItem
                            name="Left University"
                            icon="🚌"
                            completed={!!checkpointData.checkpoints?.leftUniversity}
                            data={checkpointData.checkpoints?.leftUniversity}
                        />
                        <CheckpointItem
                            name="Reached Home"
                            icon="🏠"
                            completed={!!checkpointData.checkpoints?.reachedHome}
                            data={checkpointData.checkpoints?.reachedHome}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckpointItem({ name, icon, completed, data }) {
    return (
        <div className={`checkpoint-item ${completed ? 'completed' : 'pending'}`}>
            <span className="checkpoint-icon-small">{icon}</span>
            <div className="checkpoint-details">
                <div className="checkpoint-name">{name}</div>
                {completed && data && (
                    <div className="checkpoint-info">
                        {new Date(data.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })} • {data.odometerReading} km
                    </div>
                )}
            </div>
            <span className="checkpoint-status">{completed ? '✓' : '○'}</span>
        </div>
    );
}
