import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { seatReservation } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import { Armchair, Calendar, Bus, Zap, Clock, ArrowRight, Repeat2, CalendarDays, AlertCircle, CheckCircle } from 'lucide-react';

function dirLabel(dir) {
    return dir === 'home_to_uni' ? 'Home → University' : 'University → Home';
}

function tripTypeIcon(type) {
    if (type === 'round_trip') return <Repeat2 className="w-3.5 h-3.5" />;
    if (type === 'multi_day') return <CalendarDays className="w-3.5 h-3.5" />;
    return <ArrowRight className="w-3.5 h-3.5" />;
}

export default function MyReservations() {
    const [upcoming, setUpcoming] = useState([]);
    const [past, setPast] = useState([]);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await seatReservation.getMy();
            setUpcoming(res.data.upcoming || []);
            setPast(res.data.past || []);
            setRewardPoints(res.data.rewardPoints ?? 0);
        } catch (err) {
            console.error('Failed to fetch reservations', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this reservation? A refund applies if > 24h before travel.')) return;
        setCancellingId(id);
        try {
            const res = await seatReservation.cancel(id);
            showToast(res.data.message, 'success');
            fetchReservations();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to cancel.', 'error');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            </StudentLayout>
        );
    }

    const list = activeTab === 'upcoming' ? upcoming : past;

    return (
        <StudentLayout>
            <div className="max-w-2xl mx-auto px-4 py-6">

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
                        >
                            {toast.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Armchair className="w-6 h-6 text-indigo-600" /> My Reservations
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage your seat reservations.</p>
                </div>

                {/* Points Banner */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-5 py-4 mb-6 shadow-lg">
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Available Points</div>
                        <div className="text-3xl font-black">{rewardPoints}</div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                    {['upcoming', 'past'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab} ({tab === 'upcoming' ? upcoming.length : past.length})
                        </button>
                    ))}
                </div>

                {/* List */}
                {list.length === 0 ? (
                    <div className="text-center py-16">
                        <Armchair className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No {activeTab} reservations.</p>
                        {activeTab === 'upcoming' && (
                            <a href="/student/seat-reservation" className="mt-3 inline-block text-indigo-600 text-sm font-semibold hover:underline">
                                + Reserve a Seat
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map(r => {
                            const isCancelled = r.status === 'cancelled';
                            return (
                                <motion.div
                                    key={r._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white rounded-2xl border ${isCancelled ? 'border-slate-200 opacity-60' : 'border-slate-200 shadow-sm'} p-4`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Seat badge */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl shadow-inner ${isCancelled ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700'}`}>
                                            {r.seatNumber}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCancelled ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {isCancelled ? '✕ Cancelled' : '✓ Active'}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                                    {tripTypeIcon(r.tripType)}
                                                    {r.tripType.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-0.5">
                                                <Bus className="w-3.5 h-3.5 text-indigo-500" />
                                                {r.busId?.busNumber}
                                                <span className="text-slate-400 font-normal text-xs">·</span>
                                                <span className="text-slate-500 font-medium text-xs">{r.busId?.busType}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                {dirLabel(r.direction)}
                                            </div>

                                            <div className="flex items-center gap-1 mt-1.5 text-xs text-indigo-600 font-semibold">
                                                <Zap className="w-3 h-3" />
                                                {r.pointsSpent} pts spent
                                            </div>
                                        </div>

                                        {/* Cancel button (upcoming + active only) */}
                                        {activeTab === 'upcoming' && !isCancelled && (
                                            <button
                                                onClick={() => handleCancel(r._id)}
                                                disabled={cancellingId === r._id}
                                                className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                                            >
                                                {cancellingId === r._id ? '...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>

                                    {r.cancelledAt && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            Cancelled on {new Date(r.cancelledAt).toLocaleDateString('en-IN')}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
