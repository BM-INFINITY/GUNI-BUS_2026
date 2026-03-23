import { useState, useEffect } from 'react';
import axios from 'axios';

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
        return (
            <div className="flex justify-center items-center p-8 bg-white/50 animate-pulse">
                <div className="h-6 w-24 bg-slate-200 rounded-lg"></div>
            </div>
        );
    }

    const phase = checkpointStatus?.currentPhase || 'not_started';

    return (
        <div className="bg-white px-5 py-6 flex flex-col items-center">
            {/* Phase Indicator */}
            <div className="mb-6 w-full">
                <PhaseStatus phase={phase} />
            </div>

            <div className="w-full max-w-sm">
                {phase === 'not_started' && (
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Start Your Shift</h3>
                        <p className="text-sm text-slate-500 mb-5">Enter starting odometer reading to begin</p>
                        <input
                            type="number"
                            placeholder="Odometer (KM)"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-center text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                        />
                        <button
                            onClick={() => submitCheckpoint('start-shift')}
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {submitting ? 'Starting...' : 'Start Shift'}
                        </button>
                    </div>
                )}

                {phase === 'boarding' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex justify-center items-center text-3xl mb-4 shadow-sm">
                            🏫
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Reached University?</h3>
                        <p className="text-sm text-slate-500 mb-5">Students onboarded: <strong className="text-slate-800">{checkpointStatus.studentCount}</strong></p>
                        <input
                            type="number"
                            placeholder="Odometer (KM)"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-center text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                        />
                        <button
                            onClick={() => submitCheckpoint('reached-university')}
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {submitting ? 'Submitting...' : 'Mark Reached University'}
                        </button>
                    </div>
                )}

                {phase === 'at_university' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex justify-center items-center text-3xl mb-4 shadow-sm">
                            🚌
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Start Return Trip?</h3>
                        <p className="text-sm text-slate-500 mb-5">Enter odometer reading to enable return scans</p>
                        <input
                            type="number"
                            placeholder="Odometer (KM)"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-center text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-inner"
                        />
                        <button
                            onClick={() => submitCheckpoint('start-return')}
                            disabled={submitting}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {submitting ? 'Starting...' : 'Start Return Trip'}
                        </button>
                    </div>
                )}

                {phase === 'returning' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex justify-center items-center text-3xl mb-4 shadow-sm">
                            🏠
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Reached Home?</h3>
                        <p className="text-sm text-slate-500 mb-5">Students scanned for return: <strong className="text-slate-800">{checkpointStatus.studentCount}</strong></p>
                        <input
                            type="number"
                            placeholder="Odometer (KM)"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-center text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
                        />
                        <button
                            onClick={() => submitCheckpoint('reached-home')}
                            disabled={submitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {submitting ? 'Submitting...' : 'Mark Reached Home'}
                        </button>
                    </div>
                )}

                {phase === 'completed' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-white text-emerald-500 rounded-full flex justify-center items-center text-3xl mb-4 mx-auto shadow-sm">
                            ✅
                        </div>
                        <h3 className="text-xl font-bold text-emerald-800 mb-2">Trip Completed</h3>
                        <p className="text-emerald-600 font-medium mb-4">All checkpoints submitted for today</p>
                        {checkpointStatus.checkpoint?.totalKmTraveled && (
                            <div className="inline-block bg-white text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
                                Total Distance: {checkpointStatus.checkpoint.totalKmTraveled} km
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function PhaseStatus({ phase }) {
    const phaseInfo = {
        not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: '⏸️' },
        boarding: { label: 'Boarding Phase', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🚌' },
        at_university: { label: 'At University', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '🏫' },
        returning: { label: 'Return Phase', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🔄' },
        completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' }
    };

    const info = phaseInfo[phase] || phaseInfo.not_started;

    return (
        <div className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-full border ${info.color} font-bold text-sm mx-auto shadow-sm`}>
            <span>{info.icon}</span>
            <span>{info.label}</span>
        </div>
    );
}
