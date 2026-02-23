import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { journey } from '../../services/api';
import {
    Calendar,
    Map,
    Users,
    CheckSquare,
    Clock,
    AlertTriangle,
    Printer,
    Download,
    Search,
    MapPin,
    ArrowLeft,
    TrendingUp,
    Briefcase,
    Activity,
    Info,
    RefreshCw,
    Filter
} from 'lucide-react';

export default function DailyJourneySummary() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedDate) {
            fetchSummary();
        }
    }, [selectedDate]);

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await journey.getDailySummary(selectedDate);
            // The API returns { summary, logs }
            // Map logs to routes if needed, or adjust UI to use summary stats
            setSummary({
                ...res.data.summary,
                routes: res.data.logs // For the table
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load journey summary');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const config = {
            'completed': { class: 'admin-badge-success', icon: CheckSquare },
            'in-progress': { class: 'bg-indigo-50 text-indigo-600 border border-indigo-100', icon: Activity },
            'pending': { class: 'admin-badge-warning', icon: Clock },
            'delayed': { class: 'admin-badge-danger', icon: AlertTriangle }
        }[status?.toLowerCase()] || { class: 'admin-badge-info', icon: Info };

        const Icon = config.icon;
        return (
            <span className={`admin-badge flex items-center gap-1.5 w-fit ${config.class}`}>
                <Icon size={12} />
                {status || 'Scheduled'}
            </span>
        );
    };

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">

                    <button
                        className="back-hero-btn"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div>
                        <h1>System Logistics Summary</h1>
                    </div>

                </div>
            </header>

            <div className="flex items-end justify-end gap-2 mb-2 mt-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent"
                    />
                </div>
                <button
                    onClick={() => window.print()}
                    className="admin-btn admin-btn-secondary h-[42px]"
                >
                    <Printer size={16} />
                </button>
                <button
                    onClick={fetchSummary}
                    className="admin-btn admin-btn-primary h-[42px]"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                    <AlertTriangle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {summary ? (
                <>
                    {/* KPI Section */}
                    <div className="admin-grid-stats mb-8">
                        <div className="admin-stat-card border-b-4 border-indigo-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="admin-stat-title">Deployed Fleet</span>
                                    <div className="admin-stat-value">{summary.totalRoutes || 0}</div>
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Routes Active</div>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Map size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="admin-stat-card border-b-4 border-emerald-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="admin-stat-title">Student Load</span>
                                    <div className="admin-stat-value">{summary.totalStudents || 0}</div>
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Checked In</div>
                                </div>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="admin-stat-card border-b-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="admin-stat-title">Success Rate</span>
                                    <div className="admin-stat-value">{summary.completedTrips || 0}</div>
                                    <div className="text-[10px] font-bold text-blue-500 uppercase mt-1">Trips Completed</div>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <CheckSquare size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="admin-stat-card border-b-4 border-rose-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="admin-stat-title">Operational Loss</span>
                                    <div className="admin-stat-value">{summary.pendingTrips || 0}</div>
                                    <div className="text-[10px] font-bold text-rose-500 uppercase mt-1">Incomplete/Cancelled</div>
                                </div>
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Alerts if any */}
                    {summary.issues && summary.issues.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-2xl">
                            <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                                <AlertTriangle size={16} />
                                Critical Incidents & Delays
                            </h4>
                            <div className="space-y-2">
                                {summary.issues.map((issue, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white/50 p-2 rounded-lg text-xs">
                                        <span className="font-bold text-amber-900 min-w-[100px] uppercase">{issue.route}</span>
                                        <span className="text-amber-700">{issue.description}</span>
                                        <span className="ml-auto text-amber-500 font-medium">{new Date(issue.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Analysis Table */}
                    <div className="admin-card">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Filter size={16} className="text-indigo-500" />
                                Detailed Route Matrix
                            </h3>
                            <button className="text-xs font-bold text-indigo-600 hover:indigo-700 flex items-center gap-1 uppercase tracking-wider">
                                <Download size={14} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Route Identification</th>
                                        <th>Shift Details</th>
                                        <th>Personnel</th>
                                        <th>Timing (In/Out)</th>
                                        <th>Load</th>
                                        <th>Operational Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.routes?.length > 0 ? (
                                        summary.routes.map((route, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td>
                                                    <div className="font-bold text-slate-900 uppercase text-xs">{route.routeName}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Code: {route.routeNumber || 'SYS-RD'}</div>
                                                </td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${route.shift === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {route.shift}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                                                            {route.driverName?.charAt(0) || 'D'}
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-600">{route.driverName || 'System Driver'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-bold text-slate-700">
                                                        {route.startTime ? new Date(route.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        <span className="mx-2 text-slate-300">→</span>
                                                        {route.endTime ? new Date(route.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={12} className="text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-800">{route.studentsCount || 0}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <StatusBadge status={route.status} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <MapPin size={40} className="opacity-20" />
                                                    <p className="text-sm">No operational data found for this period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Timeline section if data exists */}
                    {summary.checkpoints && summary.checkpoints.length > 0 && (
                        <div className="mt-8 admin-card p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-indigo-600" />
                                Operational Timeline (System Pulse)
                            </h3>
                            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                                {summary.checkpoints.map((cp, idx) => (
                                    <div key={idx} className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-50 flex items-center justify-center z-10">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-slate-900 uppercase">{cp.routeName} • {cp.checkpoint}</span>
                                                <span className="text-[10px] font-bold text-indigo-600">{new Date(cp.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">{cp.notes || `Checkpoint cleared by operator.`}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="admin-card p-20 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Operational Archive</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Enter a date or select from the calendar to retrieve historical journey performance data and logistics logs.</p>
                </div>
            )}
        </div>
    );
}
