import { useState, useEffect } from 'react';
import axios from 'axios';

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
        <div className="flex flex-col h-full bg-slate-50 w-full max-w-lg mx-auto pb-8">
            <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800">📋 Scan History</h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
            </header>

            <div className="p-4 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col justify-center items-center">
                        <div className="text-2xl font-black text-indigo-600 leading-none mb-1">{boardedCount}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Boarded</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col justify-center items-center">
                        <div className="text-2xl font-black text-emerald-600 leading-none mb-1">{returnedCount}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Returned</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col justify-center items-center">
                        <div className="text-2xl font-black text-slate-800 leading-none mb-1">{journeyLogs.length}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total</div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : journeyLogs.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-4xl mb-4 opacity-50">📭</div>
                        <h3 className="font-bold text-slate-700">No Scans Found</h3>
                        <p className="text-sm text-slate-500 mt-1">There are no passenger logs for this date.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {journeyLogs.map(log => (
                            <div key={log._id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{log.studentName}</h3>
                                        <p className="text-xs font-mono text-slate-500 mt-0.5">{log.enrollmentNumber}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                        log.journeyStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                        log.journeyStatus === 'In_Progress' ? 'bg-indigo-100 text-indigo-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {log.journeyStatus.replace('_', ' ')}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-50 p-2 rounded-xl flex justify-between">
                                        <span className="text-slate-500">Boarded</span>
                                        <span className="font-bold text-slate-700">{formatTime(log.onboarded?.time)}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xl flex justify-between">
                                        <span className="text-slate-500">Reached Uni</span>
                                        <span className="font-bold text-slate-700">{formatTime(log.reachedUniversity?.time)}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xl flex justify-between">
                                        <span className="text-slate-500">Left Uni</span>
                                        <span className="font-bold text-slate-700">{formatTime(log.leftForHome?.time)}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-xl flex justify-between">
                                        <span className="text-slate-500">Reached Home</span>
                                        <span className="font-bold text-slate-700">{formatTime(log.reachedHome?.time)}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-1 rounded inline-block">
                                        {log.shift || 'Unknown Shift'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
