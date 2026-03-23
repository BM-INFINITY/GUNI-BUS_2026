import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
                color: 'blue'
            },
            reachedUniversity: {
                title: 'Reached University',
                icon: '🏫',
                description: 'All onboarded students will be marked as "Reached University"',
                action: 'Mark Arrival',
                color: 'emerald'
            },
            leftUniversity: {
                title: 'Left University',
                icon: '🚌',
                description: 'All students will be marked as "Left for Home"',
                action: 'Mark Departure',
                color: 'amber'
            },
            reachedHome: {
                title: 'Reached Home',
                icon: '🏠',
                description: 'All students will be marked as "Reached Home" and journey completed',
                action: 'Complete Journey',
                color: 'purple'
            }
        };
        return info[type] || {};
    };

    if (loading) {
        return (
            <div className="flex bg-slate-50 justify-center items-center h-full w-full max-w-lg mx-auto pb-8">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!currentCheckpoint) {
        return (
            <div className="flex flex-col h-full bg-slate-50 w-full max-w-lg mx-auto pb-8 p-4">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center mt-6">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                        ✅
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">All Complete</h2>
                    <p className="text-slate-500 mb-6">You have completed all checkpoints for today's trip.</p>
                    
                    {checkpointData.totalKmTraveled && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-6 mb-8 w-full">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Distance</span>
                            <span className="text-2xl font-black text-indigo-600">{checkpointData.totalKmTraveled} <span className="text-lg">km</span></span>
                        </div>
                    )}
                    
                    <button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-sm"
                        onClick={() => navigate('/driver')}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const info = getCheckpointInfo(currentCheckpoint);
    
    // Quick helper for dynamic color classes
    const colorClasses = {
        blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', text: 'text-blue-500' },
        emerald: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50', text: 'text-emerald-500' },
        amber: { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', light: 'bg-amber-50', text: 'text-amber-500' },
        purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', text: 'text-purple-500' }
    };
    const activeColor = colorClasses[info.color] || colorClasses.blue;

    return (
        <div className="flex flex-col h-full bg-slate-50 w-full max-w-lg mx-auto pb-8">
            <header className="bg-white px-5 py-4 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800 text-center">Trip Checkpoint</h1>
            </header>

            <div className="p-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center flex flex-col items-center">
                    <div className={`w-20 h-20 ${activeColor.light} ${activeColor.text} rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner`}>
                        {info.icon}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">{info.title}</h2>
                    <p className="text-sm text-slate-500 mb-6">{info.description}</p>

                    {studentCount > 0 && (
                        <div className="mb-6 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            <span>👥</span> {studentCount} students onboarded
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="w-full flex flex-col items-start text-left mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                            Odometer Reading (KM)
                        </label>
                        <input
                            type="number"
                            placeholder="e.g., 45678"
                            value={odometerReading}
                            onChange={(e) => setOdometerReading(e.target.value)}
                            required
                            min="0"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                        />
                        {getLastOdometerReading(checkpointData.checkpoints || {}) && (
                            <small className="text-slate-500 font-medium mb-6">
                                Previous: <span className="font-bold text-slate-700">{getLastOdometerReading(checkpointData.checkpoints || {})} km</span>
                            </small>
                        )}

                        <button
                            type="submit"
                            className={`w-full mt-4 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:active:scale-100 ${activeColor.bg} ${activeColor.hover}`}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : `${info.action}`}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-slate-400">📍</span> Today's Progress
                    </h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
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
        <div className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
            completed ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 opacity-60'
        }`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 shadow-sm ${
                    completed ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                    {icon}
                </div>
                <div>
                    <div className={`font-bold ${completed ? 'text-indigo-900' : 'text-slate-600'}`}>
                        {name}
                    </div>
                    {completed && data && (
                        <div className="text-xs font-medium text-indigo-600/70 mt-0.5 flex items-center gap-2">
                            <span>{new Date(data.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit'
                            })}</span>
                            <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
                            <span>{data.odometerReading} km</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                completed ? 'bg-indigo-500 text-white shadow-sm' : 'border-2 border-slate-200 text-transparent'
            }`}>
                ✓
            </div>
        </div>
    );
}
