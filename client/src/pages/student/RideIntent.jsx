import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Lock, Star, TrendingUp, Clock, Zap } from 'lucide-react';
import { rideIntent } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─────────────── Helpers ────────────────────────────────────────────────────

// Skip Sundays (0) — they are not working days
function isWorkingDay(date) {
    return date.getDay() !== 0; // 0 = Sunday
}

// Get next 7 working days (skips Sundays)
function getNextWorkingDays() {
    const days = [];
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    let i = 1;
    while (days.length < 7) {
        const next = new Date(d);
        next.setDate(d.getDate() + i);
        if (isWorkingDay(next)) days.push(new Date(next));
        i++;
    }
    return days;
}

// Lock after 10 PM of the previous day
function isLocked(date) {
    const now = new Date();
    const cutoff = new Date(date);
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(22, 0, 0, 0);
    return now >= cutoff;
}

function fmt(date) {
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmt2(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toKey(date) {
    // Consistent local-date key regardless of timezone
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─────────────── Main Component ─────────────────────────────────────────────

export default function RideIntent() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState('');
    const [reminder, setReminder] = useState(false);

    // Optimistic intent map — updated instantly on user click, then synced from server
    const [localIntents, setLocalIntents] = useState({});

    // Socket.io reminder listener
    useEffect(() => {
        const socket = io(API_URL);
        socket.on('ride-intent-reminder', () => setReminder(true));
        return () => socket.disconnect();
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    // Fetch upcoming declarations + score
    const { data: upcoming, isLoading } = useQuery({
        queryKey: ['rideIntent-upcoming'],
        queryFn: async () => {
            const res = await rideIntent.getUpcoming();
            return res.data;
        },
        onSuccess: (data) => {
            // Sync server state into local map (after initial load or re-fetch)
            const map = {};
            data.intents?.forEach(i => { map[toKey(i.travelDate)] = i.intentStatus; });
            setLocalIntents(map);
        }
    });

    // Fetch history
    const { data: history } = useQuery({
        queryKey: ['rideIntent-history'],
        queryFn: async () => {
            const res = await rideIntent.getHistory();
            return res.data;
        }
    });

    // Seed local intents from server data on load (covers initial render)
    useEffect(() => {
        if (upcoming?.intents) {
            const map = {};
            upcoming.intents.forEach(i => { map[toKey(i.travelDate)] = i.intentStatus; });
            setLocalIntents(map);
        }
    }, [upcoming]);

    // Mutation for submitting intent
    const submitMutation = useMutation({
        mutationFn: ({ dateStr, status }) =>
            rideIntent.submitIntent({ travelDate: dateStr, intentStatus: status }),
        onSuccess: (_, { status }) => {
            // Background sync to keep server and local in agreement
            queryClient.invalidateQueries(['rideIntent-upcoming']);
            showToast(status === 'YES' ? '✅ Declared: Will Travel' : '🚫 Declared: Won\'t Travel');
        },
        onError: (err, { dateStr, prevStatus }) => {
            // Rollback optimistic update on failure
            setLocalIntents(prev => {
                const copy = { ...prev };
                if (prevStatus) copy[dateStr] = prevStatus;
                else delete copy[dateStr];
                return copy;
            });
            showToast('❌ ' + (err.response?.data?.message || 'Failed to submit'));
        }
    });

    const handleToggle = (date, status) => {
        const dateStr = toKey(date);
        if (isLocked(date)) return showToast('🔒 This date is locked (past 10 PM cutoff)');

        const prevStatus = localIntents[dateStr];

        // ✅ OPTIMISTIC UPDATE — update instantly before API returns
        setLocalIntents(prev => ({ ...prev, [dateStr]: status }));

        submitMutation.mutate({ dateStr, status, prevStatus });
    };

    const days = getNextWorkingDays();
    const rewardPoints = upcoming?.rewardPoints ?? 0;
    const reliabilityScore = upcoming?.reliabilityScore ?? 100;

    return (
        <StudentLayout>
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                                background: '#1e293b', color: '#fff', padding: '12px 20px',
                                borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: '320px'
                            }}
                        >
                            {toast}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reminder Badge */}
                <AnimatePresence>
                    {reminder && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-sm font-medium"
                        >
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            Reminder: Declare your travel plans before 10 PM tonight!
                            <button onClick={() => setReminder(false)} className="ml-auto text-amber-500 hover:text-amber-700 font-bold">✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Upcoming Travel Plan</h1>
                    <p className="text-slate-500 text-sm mt-1">Tell us if you'll be riding the bus. Earn reward points for accurate declarations. Sundays are excluded.</p>
                </div>

                {/* Reward Score Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Reward Points</span>
                        </div>
                        <div className="text-4xl font-black">{rewardPoints}</div>
                        <div className="text-xs opacity-70 mt-1">Earned for accurate declarations</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Reliability</span>
                        </div>
                        <div className="text-4xl font-black">{reliabilityScore}<span className="text-xl font-bold opacity-70">%</span></div>
                        <div className="text-xs opacity-70 mt-1">{reliabilityScore >= 80 ? '🌟 Excellent' : reliabilityScore >= 60 ? '👍 Good' : '⚠️ Needs improvement'}</div>
                    </motion.div>
                </div>

                {/* Reward Legend */}
                <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">+10</span> Say YES, board the bus</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">+5</span> Say NO, don't board</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">-8</span> Say YES, but don't show up</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px]">0</span> No declaration made</div>
                </div>

                {/* Date Cards */}
                <div className="space-y-3 mb-10">
                    {days.map((date) => {
                        const key = toKey(date);
                        const currentStatus = localIntents[key]; // Uses optimistic local state instantly
                        const locked = isLocked(date);

                        return (
                            <motion.div
                                key={key}
                                whileHover={!locked ? { scale: 1.01 } : {}}
                                className={`rounded-xl border p-4 flex items-center justify-between gap-3 transition-all ${locked ? 'opacity-60 bg-slate-50' : 'bg-white shadow-sm'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {locked ? <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                                    <div>
                                        <div className="font-semibold text-slate-800 text-sm">{fmt(date)}</div>
                                        {locked && <div className="text-xs text-slate-400">Locked (cutoff passed)</div>}
                                        {currentStatus && (
                                            <motion.div
                                                key={currentStatus}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`text-xs font-bold mt-0.5 inline-block px-1.5 py-0.5 rounded ${currentStatus === 'YES' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}
                                            >
                                                {currentStatus === 'YES' ? '✅ Will Travel' : '🚫 Won\'t Travel'}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {!locked && (
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => handleToggle(date, 'YES')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'YES' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> YES
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => handleToggle(date, 'NO')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${currentStatus === 'NO' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> NO
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Past Declarations */}
                {history && history.length > 0 && (
                    <div>
                        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" /> Past Declarations
                        </h2>
                        <div className="space-y-2">
                            {history.slice(0, 10).map(h => {
                                const matched = h.intentStatus === 'YES' && h.actualBoarded;
                                const missed = h.intentStatus === 'YES' && !h.actualBoarded && h.rewardPointsCalculated;
                                const correct = h.intentStatus === 'NO' && !h.actualBoarded && h.rewardPointsCalculated;
                                const label = h.rewardPointsCalculated
                                    ? (matched ? '✅ Matched' : missed ? '❌ Missed' : correct ? '✅ Correct' : '—')
                                    : '⏳ Pending';
                                const pointLabel = h.rewardPointsCalculated
                                    ? (matched ? '+10pts' : missed ? '-8pts' : correct ? '+5pts' : '0pts')
                                    : '';

                                return (
                                    <div key={h._id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                                        <div>
                                            <span className="font-semibold text-slate-700">{fmt2(h.travelDate)}</span>
                                            <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${h.intentStatus === 'YES' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {h.intentStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{label}</span>
                                            {pointLabel && <span className={`text-xs font-bold ${pointLabel.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{pointLabel}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
