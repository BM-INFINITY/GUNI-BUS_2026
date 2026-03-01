import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { journey } from '../../services/api';
import {
    Calendar, Users, CheckSquare, AlertTriangle, Printer,
    RefreshCw, ArrowLeft, TrendingUp, Bus, Sun, Sunset,
    Activity, MapPin, Ticket, UserCheck
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

export default function DailyJourneySummary() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(today());
    const [data, setData] = useState([]);      // array of route+shift rows
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (selectedDate) fetchData(); }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await journey.getRouteSummary(selectedDate);
            setData(res.data.summary || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    // Aggregate totals across all routes
    const totals = data.reduce(
        (acc, row) => ({
            expected: acc.expected + row.totalExpected,
            boarded: acc.boarded + row.boarded,
            returned: acc.returned + row.returned,
            absent: acc.absent + row.absent,
        }),
        { expected: 0, boarded: 0, returned: 0, absent: 0 }
    );
    const overallRate = totals.expected > 0
        ? Math.round((totals.boarded / totals.expected) * 100)
        : 0;

    const rateColor = (rate) => {
        if (rate >= 80) return 'text-emerald-600';
        if (rate >= 60) return 'text-amber-500';
        return 'text-rose-600';
    };
    const barColor = (rate) => {
        if (rate >= 80) return 'bg-emerald-500';
        if (rate >= 60) return 'bg-amber-400';
        return 'bg-rose-500';
    };

    return (
        <div className="admin-page-container">
            {/* Header */}
            <header className="page-header-premium">
                <div className="header-hero-box">
                    <button className="back-hero-btn" onClick={() => navigate('/admin')}>
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1>Journey Summary</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Route × Shift attendance breakdown</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            max={today()}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="admin-input text-sm"
                        />
                        <button onClick={fetchData} disabled={loading}
                            className="admin-btn admin-btn-primary h-[40px] px-3">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => window.print()}
                            className="admin-btn admin-btn-secondary h-[40px] px-3">
                            <Printer size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                    <AlertTriangle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Overall KPI Bar */}
            {data.length > 0 && (
                <div className="admin-grid-stats mb-6">
                    <div className="admin-stat-card border-b-4 border-indigo-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="admin-stat-title">Total Expected</span>
                                <div className="admin-stat-value">{totals.expected}</div>
                                <div className="text-[10px] font-bold text-indigo-500 uppercase mt-1">Pass + Ticket</div>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Ticket size={20} /></div>
                        </div>
                    </div>
                    <div className="admin-stat-card border-b-4 border-emerald-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="admin-stat-title">Boarded</span>
                                <div className="admin-stat-value">{totals.boarded}</div>
                                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Scanned In</div>
                            </div>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><UserCheck size={20} /></div>
                        </div>
                    </div>
                    <div className="admin-stat-card border-b-4 border-blue-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="admin-stat-title">Returned</span>
                                <div className="admin-stat-value">{totals.returned}</div>
                                <div className="text-[10px] font-bold text-blue-500 uppercase mt-1">Evening Scan</div>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20} /></div>
                        </div>
                    </div>
                    <div className="admin-stat-card border-b-4 border-rose-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="admin-stat-title">Absent</span>
                                <div className="admin-stat-value">{totals.absent}</div>
                                <div className="text-[10px] font-bold text-rose-500 uppercase mt-1">No-shows</div>
                            </div>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={20} /></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overall attendance rate strip */}
            {data.length > 0 && (
                <div className="admin-card p-4 mb-6 flex items-center gap-4">
                    <TrendingUp size={18} className="text-indigo-500 shrink-0" />
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Overall Attendance Rate</span>
                            <span className={`text-sm font-extrabold ${rateColor(overallRate)}`}>{overallRate}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor(overallRate)}`}
                                style={{ width: `${overallRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Route × Shift Cards */}
            {loading && !data.length ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
            ) : data.length === 0 ? (
                <div className="admin-card p-20 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Data for This Date</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                        No passes or tickets were active on this date, or no routes are configured yet.
                    </p>
                </div>
            ) : (
                <div className="admin-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Bus size={16} className="text-indigo-500" />
                            Route × Shift Breakdown — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">{data.length} route-shift slots</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Shift</th>
                                    <th className="text-center">Pass Holders</th>
                                    <th className="text-center">Day Tickets</th>
                                    <th className="text-center">Total Expected</th>
                                    <th className="text-center">Boarded</th>
                                    <th className="text-center">Returned</th>
                                    <th className="text-center">Absent</th>
                                    <th className="text-center">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td>
                                            <div className="font-bold text-slate-900 text-xs uppercase">{row.routeName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase">{row.routeNumber}</div>
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase
                                                ${row.shift === 'morning'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-indigo-100 text-indigo-700'}`}>
                                                {row.shift === 'morning'
                                                    ? <Sun size={11} />
                                                    : <Sunset size={11} />}
                                                {row.shift}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-sm font-bold text-slate-700">{row.expectedPasses}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-sm font-bold text-slate-700">{row.expectedTickets}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold">{row.totalExpected}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">{row.boarded}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">{row.returned}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold
                                                ${row.absent > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {row.absent}
                                            </span>
                                        </td>
                                        <td className="text-center min-w-[120px]">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${barColor(row.attendanceRate)}`}
                                                        style={{ width: `${row.attendanceRate}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-extrabold w-9 text-right ${rateColor(row.attendanceRate)}`}>
                                                    {row.attendanceRate}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totals row */}
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                                    <td colSpan={2} className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Grand Total</td>
                                    <td className="text-center text-sm font-extrabold text-slate-800">—</td>
                                    <td className="text-center text-sm font-extrabold text-slate-800">—</td>
                                    <td className="text-center text-sm font-extrabold text-slate-800">{totals.expected}</td>
                                    <td className="text-center text-sm font-extrabold text-emerald-700">{totals.boarded}</td>
                                    <td className="text-center text-sm font-extrabold text-blue-700">{totals.returned}</td>
                                    <td className="text-center text-sm font-extrabold text-rose-700">{totals.absent}</td>
                                    <td className="text-center">
                                        <span className={`text-sm font-extrabold ${rateColor(overallRate)}`}>{overallRate}%</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
