import { useEffect, useState } from 'react';
import { admin } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Bus,
    Users,
    CheckCircle2,
    Armchair,
    RefreshCw,
    Activity,
    Navigation,
    UserCheck,
    AlertCircle,
    Info,
    ArrowLeft
} from 'lucide-react';

export default function LiveAttendance() {
    const navigate = useNavigate();
    const [liveData, setLiveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchLiveData = async () => {
        try {
            const res = await admin.getLiveAnalytics();
            setLiveData(res.data);
            setLoading(false);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch live data", err);
            setLoading(false);
        }
    };

    const totalActiveStudents = liveData.reduce((acc, r) => acc + (r.checkedIn || 0), 0);
    const totalCompleted = liveData.reduce((acc, r) => acc + (r.checkedOut || 0), 0);
    const totalSeats = liveData.reduce((acc, r) => acc + (r.totalSeats || 0), 0);

    const getOccupancyLevel = (percentage) => {
        if (percentage >= 90) return { label: 'Full', class: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' };
        if (percentage >= 70) return { label: 'High', class: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
        return { label: 'Normal', class: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    };

    if (loading && liveData.length === 0) {
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
                        <h1 className="flex items-center gap-3">
                            Live Operations Center
                            {/* Live Pulse Indicator */}
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                        </h1>
                    </div>
                </div>
            </header>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-medium text-slate-500">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Auto-syncing active
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Last pulse: {lastUpdated.toLocaleTimeString()}
                </span>
            </div>

            {/* Fleet Overview Stats */}
            <div className="admin-grid-stats mb-8">
                <div className="admin-stat-card border-l-4 border-indigo-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Bus size={24} />
                        </div>
                        <div>
                            <span className="admin-stat-title text-slate-500">Active Buses</span>
                            <div className="admin-stat-value text-2xl">{liveData.length}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-stat-card border-l-4 border-emerald-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <span className="admin-stat-title text-slate-500">Currently Onboard</span>
                            <div className="admin-stat-value text-2xl">{totalActiveStudents}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-stat-card border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <span className="admin-stat-title text-slate-500">Trips Completed</span>
                            <div className="admin-stat-value text-2xl">{totalCompleted}</div>
                        </div>
                    </div>
                </div>

                <div className="admin-stat-card border-l-4 border-amber-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Armchair size={24} />
                        </div>
                        <div>
                            <span className="admin-stat-title text-slate-500">Fleet Capacity</span>
                            <div className="admin-stat-value text-2xl">{totalSeats}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Route Grid */}
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Navigation size={20} className="text-indigo-600" />
                Active Route Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveData.map(route => {
                    const level = getOccupancyLevel(route.occupancy);
                    return (
                        <div key={route.routeId} className="bg-indigo-100 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                        Route {route.routeNumber}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${route.checkedIn > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${route.checkedIn > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        <span className="text-[10px] font-bold uppercase">{route.checkedIn > 0 ? 'Live' : 'Idle'}</span>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors uppercase truncate">
                                    {route.routeName}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                                    <Bus size={12} />
                                    <span>{route.busNumber} • {route.regNumber}</span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className={`text-[10px] font-bold uppercase ${level.text}`}>
                                            {level.label} Occupancy
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">{route.occupancy}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${level.class}`}
                                            style={{ width: `${route.occupancy}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                                        <span>Current: {route.checkedIn}</span>
                                        <span>Capacity: {route.totalSeats}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4">
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-slate-900">{route.availableSeats}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Free</div>
                                    </div>
                                    <div className="text-center border-x border-slate-50">
                                        <div className="text-xs font-bold text-slate-900">{route.totalPassengers}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Expect</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-slate-900">{route.checkedOut}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Drop</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {liveData.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No Active Operations</h3>
                    <p className="text-slate-500 text-sm">Real-time data will appear here once buses start their journeys.</p>
                </div>
            )}
        </div>
    );
}
