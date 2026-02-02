import { useState, useEffect } from 'react';
import axios from 'axios';
import './CheckpointControl.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CheckpointControl({ onPhaseChange }) {
    const [checkpointStatus, setCheckpointStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [odometerReading, setOdometerReading] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/checkpoints/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCheckpointStatus(res.data);
            if (onPhaseChange) onPhaseChange(res.data.currentPhase, res.data.canScan);
        } catch (error) {
            console.error('Failed to fetch checkpoint status:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitCheckpoint = async (endpoint) => {
        if (!odometerReading || odometerReading <= 0) {
            alert('Please enter a valid odometer reading');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/checkpoints/${endpoint}`,
                { odometerReading: parseInt(odometerReading) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(res.data.message);
            setOdometerReading('');
            fetchStatus();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit checkpoint');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="checkpoint-control loading">Loading...</div>;
    }

    const phase = checkpointStatus?.currentPhase || 'not_started';

    return (
        <div className="checkpoint-control">
            <div className="phase-indicator">
                <PhaseStatus phase={phase} />
            </div>

            {phase === 'not_started' && (
                <div className="checkpoint-action">
                    <h3>🚀 Start Your Shift</h3>
                    <p>Enter starting odometer reading to begin</p>
                    <input
                        type="number"
                        placeholder="Odometer (KM)"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        className="odometer-input"
                    />
                    <button
                        onClick={() => submitCheckpoint('start-shift')}
                        disabled={submitting}
                        className="checkpoint-btn start"
                    >
                        {submitting ? 'Starting...' : 'Start Shift'}
                    </button>
                </div>
            )}

            {phase === 'boarding' && (
                <div className="checkpoint-action">
                    <h3>🏫 Reached University?</h3>
                    <p>Students onboarded: {checkpointStatus.studentCount}</p>
                    <input
                        type="number"
                        placeholder="Odometer (KM)"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        className="odometer-input"
                    />
                    <button
                        onClick={() => submitCheckpoint('reached-university')}
                        disabled={submitting}
                        className="checkpoint-btn university"
                    >
                        {submitting ? 'Submitting...' : 'Mark Reached University'}
                    </button>
                </div>
            )}

            {phase === 'at_university' && (
                <div className="checkpoint-action">
                    <h3>🚌 Start Return Trip?</h3>
                    <p>Enter odometer reading to enable return scans</p>
                    <input
                        type="number"
                        placeholder="Odometer (KM)"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        className="odometer-input"
                    />
                    <button
                        onClick={() => submitCheckpoint('start-return')}
                        disabled={submitting}
                        className="checkpoint-btn return"
                    >
                        {submitting ? 'Starting...' : 'Start Return Trip'}
                    </button>
                </div>
            )}

            {phase === 'returning' && (
                <div className="checkpoint-action">
                    <h3>🏠 Reached Home?</h3>
                    <p>Students scanned for return: {checkpointStatus.studentCount}</p>
                    <input
                        type="number"
                        placeholder="Odometer (KM)"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        className="odometer-input"
                    />
                    <button
                        onClick={() => submitCheckpoint('reached-home')}
                        disabled={submitting}
                        className="checkpoint-btn home"
                    >
                        {submitting ? 'Submitting...' : 'Mark Reached Home'}
                    </button>
                </div>
            )}

            {phase === 'completed' && (
                <div className="checkpoint-action completed">
                    <h3>✅ Trip Completed</h3>
                    <p>All checkpoints submitted for today</p>
                    {checkpointStatus.checkpoint?.totalKmTraveled && (
                        <div className="km-display">
                            Total Distance: {checkpointStatus.checkpoint.totalKmTraveled} km
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PhaseStatus({ phase }) {
    const phaseInfo = {
        not_started: { label: 'Not Started', color: '#9ca3af', icon: '⏸️' },
        boarding: { label: 'Boarding Phase', color: '#3b82f6', icon: '🚌' },
        at_university: { label: 'At University', color: '#22c55e', icon: '🏫' },
        returning: { label: 'Return Phase', color: '#f59e0b', icon: '🔄' },
        completed: { label: 'Completed', color: '#8b5cf6', icon: '✅' }
    };

    const info = phaseInfo[phase] || phaseInfo.not_started;

    return (
        <div className="phase-status" style={{ borderColor: info.color }}>
            <span className="phase-icon">{info.icon}</span>
            <span className="phase-label">{info.label}</span>
        </div>
    );
}
