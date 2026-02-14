import { useState, useEffect } from 'react';
import { journey } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import { Bus, Clock, MapPin, Home, AlertCircle, CheckCircle, Calendar, Filter, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            const res = await journey.getLogs(dateFilter);
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

    return (
        <StudentLayout>
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header & Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-8 h-8 text-indigo-600" />
                            My Journey History
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Track your daily commute logs</p>
                    </div>

                    <div className="bg-emerald-600 rounded-full p-1 flex items-center shadow-lg w-full sm:w-auto relative">
                        <button
                            onClick={() => setDateFilter('7')}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-l-full rounded-r-none text-sm font-bold text-white transition-colors relative z-10 bg-transparent hover:bg-white/10"
                        >
                            {dateFilter === '7' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-l-full rounded-r-none"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">Last 7 Days</span>
                        </button>
                        <button
                            onClick={() => setDateFilter('30')}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-r-full rounded-l-none text-sm font-bold text-white transition-colors relative z-10 bg-transparent hover:bg-white/10"
                        >
                            {dateFilter === '30' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-r-full rounded-l-none"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">Last 30 Days</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-500 font-medium">Loading your journey history...</p>
                    </div>
                ) : journeyLogs.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No Journeys Found</h3>
                        <p className="text-slate-500">No travel records found for the selected period.</p>
                    </motion.div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence>
                            {journeyLogs.map((log, index) => (
                                <motion.div
                                    key={log._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <JourneyCard
                                        log={log}
                                        formatDate={formatDate}
                                        formatTime={formatTime}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}

function JourneyCard({ log, formatDate, formatTime }) {
    const isCompleted = log.journeyStatus === 'completed';
    const isInProgress = log.journeyStatus === 'in_progress';
    const isAbsent = log.journeyStatus === 'absent';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                <div className="space-y-1.5 flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{formatDate(log.date)}</h3>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Bus className="w-4 h-4 text-slate-400" />
                        <span>{log.routeId?.routeName || 'Route not assigned'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${log.shift === 'morning'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                        {log.shift} Shift
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        isInProgress ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                        {isCompleted && <CheckCircle className="w-3 h-3" />}
                        {isInProgress && <Clock className="w-3 h-3" />}
                        {isAbsent && <AlertCircle className="w-3 h-3" />}
                        {isCompleted ? 'Completed' : isInProgress ? 'Live' : 'Absent'}
                    </span>
                </div>
            </div>

            {!log.isAbsent ? (
                <div className="relative pl-2">
                    {/* Connecting Line */}
                    <div className="absolute left-[19px] top-3 bottom-8 w-0.5 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>

                    <div className="space-y-6">
                        <TimelinePhase
                            icon={Bus}
                            label="Boarded Bus"
                            time={formatTime(log.onboarded?.time)}
                            completed={!!log.onboarded?.time}
                            method="QR Scan"
                            color="blue"
                        />
                        <TimelinePhase
                            icon={MapPin}
                            label="Reached University"
                            time={formatTime(log.reachedUniversity?.time)}
                            completed={!!log.reachedUniversity?.time}
                            method="Checkpoint"
                            color="indigo"
                        />
                        <TimelinePhase
                            icon={Bus}
                            label="Left for Home"
                            time={formatTime(log.leftForHome?.time)}
                            completed={!!log.leftForHome?.time}
                            method="Checkpoint"
                            color="orange"
                        />
                        <TimelinePhase
                            icon={Home}
                            label="Reached Home"
                            time={formatTime(log.reachedHome?.time)}
                            completed={!!log.reachedHome?.time}
                            method="Checkpoint"
                            color="emerald"
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0 text-rose-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-rose-800">Marked Absent</p>
                        <p className="text-sm text-rose-600">You did not board the bus on this day.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function TimelinePhase({ icon: Icon, label, time, completed, method, color }) {
    const colorStyles = {
        blue: 'bg-blue-100 text-blue-600 border-blue-200',
        indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
        orange: 'bg-orange-100 text-orange-600 border-orange-200',
        emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        gray: 'bg-slate-100 text-slate-400 border-slate-200'
    };

    return (
        <div className="flex gap-4 relative">
            <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm transition-transform group-hover:scale-105 ${completed ? colorStyles[color] : colorStyles.gray}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 pt-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`font-bold text-sm ${completed ? 'text-slate-900' : 'text-slate-400'}`}>{label}</p>
                        {completed && method && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{method}</p>
                        )}
                    </div>
                    <span className={`text-sm font-mono font-medium ${completed ? 'text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md' : 'text-slate-300'}`}>
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
}
