import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    BarChart3, Users, Bus, TrendingUp, Award, RefreshCw,
    Calendar, CheckCircle, XCircle, AlertTriangle, Zap
} from 'lucide-react';
import { forecast } from '../../services/api';
import io from 'socket.io-client';
import '../../styles/admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function todayPlus(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

function AccuracyBar({ value }) {
    const pct = value ?? 0;
    const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, pct)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ background: color, height: '100%', borderRadius: '9999px' }}
            />
        </div>
    );
}

export default function DemandForecastDashboard() {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(todayPlus(1));
    const [liveAlert, setLiveAlert] = useState('');

    // Socket.io live update listener
    useEffect(() => {
        const socket = io(API_URL);
        socket.on('demand-forecast-updated', (data) => {
            setLiveAlert(`📊 Forecast updated for ${data.date || 'tomorrow'}`);
            queryClient.invalidateQueries(['forecast-date', selectedDate]);
            queryClient.invalidateQueries(['forecast-summary']);
            setTimeout(() => setLiveAlert(''), 5000);
        });
        socket.on('prediction-accuracy-updated', (data) => {
            setLiveAlert(`✅ Accuracy reconciled for ${data.date}`);
            queryClient.invalidateQueries(['forecast-analytics']);
            queryClient.invalidateQueries(['forecast-leaderboard']);
            setTimeout(() => setLiveAlert(''), 5000);
        });
        return () => socket.disconnect();
    }, [selectedDate, queryClient]);

    // Queries
    const { data: forecastData, isLoading: loadingForecast } = useQuery({
        queryKey: ['forecast-date', selectedDate],
        queryFn: async () => {
            const res = await forecast.getByDate(selectedDate);
            return res.data;
        },
        enabled: !!selectedDate
    });

    const { data: summary } = useQuery({
        queryKey: ['forecast-summary'],
        queryFn: async () => {
            const res = await forecast.getSummary();
            return res.data;
        }
    });

    const { data: analytics } = useQuery({
        queryKey: ['forecast-analytics'],
        queryFn: async () => {
            const res = await forecast.getAnalytics();
            return res.data;
        }
    });

    const { data: leaderboard } = useQuery({
        queryKey: ['forecast-leaderboard'],
        queryFn: async () => {
            const res = await forecast.getLeaderboard();
            return res.data;
        }
    });

    const routes = forecastData?.routes || [];
    const trend = analytics?.trend || [];

    // Color coding
    const reliabilityColor = (score) => score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
    const reliabilityBg = (score) => score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-rose-50';

    return (
        <div className="p-6">
            {/* Live Alert Banner */}
            <AnimatePresence>
                {liveAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-4 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 shadow-md"
                    >
                        <Zap className="w-4 h-4" /> {liveAlert}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Demand Forecast</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Real-time bus demand prediction based on student travel intentions</p>
                </div>
                <button
                    onClick={() => {
                        queryClient.invalidateQueries(['forecast-date', selectedDate]);
                        queryClient.invalidateQueries(['forecast-summary']);
                    }}
                    className="admin-btn admin-btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Tomorrow's YES Intents", value: summary?.yesCount ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: "Tomorrow's NO Intents", value: summary?.noCount ?? 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                    { label: 'Routes Forecasted', value: summary?.latestForecast?.length ?? 0, icon: Bus, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                    { label: '30-day Avg Accuracy', value: trend.length > 0 ? `${Math.round(trend.reduce((s, t) => s + t.avgAccuracy, 0) / trend.length)}%` : '--', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                ].map((card, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className={`admin-stat-card border ${card.border}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="admin-stat-title">{card.label}</span>
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}><card.icon size={16} /></div>
                        </div>
                        <div className="admin-stat-value">{card.value}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Route Forecast Table */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Date Selector */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-800">Route-wise Forecast</h2>
                            <input
                                type="date"
                                value={selectedDate}
                                min={todayPlus(-30)}
                                max={todayPlus(7)}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="admin-input ml-auto text-sm"
                                style={{ width: 'auto', padding: '6px 10px' }}
                            />
                        </div>

                        {loadingForecast ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        ) : routes.length === 0 ? (
                            <div className="text-center py-10">
                                <AlertTriangle className="w-10 h-10 mx-auto text-amber-400 mb-2" />
                                <p className="text-slate-500 text-sm">No intent data for this date yet.</p>
                                <p className="text-slate-400 text-xs mt-1">Students declare intent up to 7 days in advance.</p>
                            </div>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Route</th>
                                            <th>YES Intents</th>
                                            <th>NO Intents</th>
                                            <th>Recommended Buses</th>
                                            <th>Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map((r, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="font-semibold text-slate-800 text-sm">{r.routeName}</div>
                                                    <div className="text-xs text-slate-400">{r.routeNumber}</div>
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-sm">
                                                        <CheckCircle className="w-3.5 h-3.5" /> {r.yesCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-sm">
                                                        <XCircle className="w-3.5 h-3.5" /> {r.noCount}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 text-sm">
                                                        <Bus className="w-3.5 h-3.5" /> {r.recommendedBuses} × {r.busCapacity} cap
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.forecast?.predictionAccuracy != null ? (
                                                        <div>
                                                            <span className="font-bold text-sm">{r.forecast.predictionAccuracy}%</span>
                                                            <AccuracyBar value={r.forecast.predictionAccuracy} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">⏳ After 11:30 PM</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Historical Accuracy Trend */}
                    {trend.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-500" /> 30-Day Prediction Accuracy
                            </h2>
                            <div className="space-y-2">
                                {trend.slice(-15).map((t, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 w-20 flex-shrink-0">{t.date.slice(5)}</span>
                                        <div className="flex-1">
                                            <AccuracyBar value={t.avgAccuracy} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{t.avgAccuracy}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Leaderboard */}
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" /> Reliability Leaderboard
                    </h2>
                    {!leaderboard || leaderboard.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No reward data yet. Points accumulate daily.</p>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.slice(0, 15).map((student, i) => (
                                <motion.div
                                    key={student._id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-800 text-sm truncate">{student.name}</div>
                                        <div className="text-xs text-slate-400">{student.enrollmentNumber}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-black text-sm text-indigo-700">{student.rewardPoints} pts</div>
                                        <div className={`text-xs font-semibold ${reliabilityColor(student.reliabilityScore)}`}>
                                            {student.reliabilityScore}%
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
