import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { journey } from '../../services/api';
import {
    Search, ArrowLeft, User, Calendar, MapPin, CheckSquare,
    XCircle, Clock, ChevronRight, AlertTriangle, RefreshCw,
    Sun, Sunset, Activity, TrendingUp, X
} from 'lucide-react';

const LAST_N_DAYS = 30;
const defaultStart = () => {
    const d = new Date(); d.setDate(d.getDate() - LAST_N_DAYS);
    return d.toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

// ── Search Result Card ────────────────────────────────────────────────────
function StudentCard({ s, onSelect, isSelected }) {
    return (
        <button
            onClick={() => onSelect(s)}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                ${isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {s.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{s.name}</div>
                <div className="text-xs text-slate-400">{s.enrollmentNumber} · {s.department} Yr{s.year}</div>
            </div>
            <ChevronRight size={16} className={isSelected ? 'text-indigo-500' : 'text-slate-300'} />
        </button>
    );
}

// ── Journey Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        completed: { cls: 'bg-emerald-100 text-emerald-700', label: 'Completed', icon: CheckSquare },
        in_progress: { cls: 'bg-indigo-100 text-indigo-600', label: 'In Progress', icon: Activity },
        absent: { cls: 'bg-rose-100 text-rose-600', label: 'Absent', icon: XCircle },
        not_started: { cls: 'bg-slate-100 text-slate-500', label: 'Not Started', icon: Clock },
    };
    const cfg = map[status] || { cls: 'bg-slate-100 text-slate-500', label: status, icon: Clock };
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
            <Icon size={11} />{cfg.label}
        </span>
    );
}

// ── Stat Mini-Card ────────────────────────────────────────────────────────
function MiniStat({ label, value, color }) {
    return (
        <div className={`rounded-xl px-4 py-3 border ${color}`}>
            <div className="text-xl font-extrabold">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{label}</div>
        </div>
    );
}

export default function StudentJourneyLogs() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentData, setStudentData] = useState(null); // { student, logs, stats }
    const [loadingJourney, setLoadingJourney] = useState(false);
    const [journeyError, setJourneyError] = useState('');

    const [startDate, setStartDate] = useState(defaultStart());
    const [endDate, setEndDate] = useState(today());

    // Search debounce
    const handleSearch = useCallback(async (q) => {
        setQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await journey.searchStudents(q);
            setSearchResults(res.data || []);
        } catch (_) {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setSearchResults([]);
        setQuery('');
        await fetchJourney(student._id);
    };

    const fetchJourney = async (userId, start = startDate, end = endDate) => {
        setLoadingJourney(true);
        setJourneyError('');
        setStudentData(null);
        try {
            const res = await journey.getStudentJourney(userId, start, end);
            setStudentData(res.data);
        } catch (err) {
            setJourneyError(err.response?.data?.message || 'Failed to load journey data');
        } finally {
            setLoadingJourney(false);
        }
    };

    const handleDateRefresh = () => {
        if (selectedStudent) fetchJourney(selectedStudent._id);
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
                        <h1>Student Journey Logs</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Search any student → view full travel history</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left Panel: Search ─────────────────────────────────────── */}
                <div className="lg:col-span-1 flex flex-col gap-3">
                    {/* Search bar */}
                    <div className="admin-card p-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                            Search Student
                        </label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Name or enrollment no…"
                                className="admin-input pl-9 w-full"
                            />
                            {query && (
                                <button onClick={() => { setQuery(''); setSearchResults([]); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Results */}
                        {searching && (
                            <div className="mt-3 text-center text-xs text-slate-400">Searching…</div>
                        )}
                        {searchResults.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                                {searchResults.map(s => (
                                    <StudentCard
                                        key={s._id}
                                        s={s}
                                        onSelect={handleSelectStudent}
                                        isSelected={selectedStudent?._id === s._id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected student card */}
                    {selectedStudent && (
                        <div className="admin-card p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                                    {selectedStudent.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{selectedStudent.name}</div>
                                    <div className="text-xs text-slate-400">{selectedStudent.enrollmentNumber}</div>
                                    <div className="text-xs text-slate-400">{selectedStudent.department} · Year {selectedStudent.year}</div>
                                </div>
                            </div>

                            {studentData?.stats && (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <MiniStat label="Days Logged" value={studentData.stats.total} color="border-slate-200 text-slate-700" />
                                    <MiniStat label="Boarded" value={studentData.stats.boarded} color="border-emerald-200 text-emerald-700 bg-emerald-50" />
                                    <MiniStat label="Completed" value={studentData.stats.completed} color="border-blue-200 text-blue-700 bg-blue-50" />
                                    <MiniStat label="Absent" value={studentData.stats.absent} color="border-rose-200 text-rose-700 bg-rose-50" />
                                </div>
                            )}

                            {/* Attendance rate */}
                            {studentData?.stats && studentData.stats.total > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Attendance Rate</span>
                                        <span className="text-sm font-extrabold text-indigo-600">
                                            {Math.round((studentData.stats.boarded / studentData.stats.total) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${Math.round((studentData.stats.boarded / studentData.stats.total) * 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date range filter */}
                    {selectedStudent && (
                        <div className="admin-card p-4 flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date Range</label>
                            <div className="flex flex-col gap-2">
                                <input type="date" value={startDate} max={endDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="admin-input text-sm" />
                                <input type="date" value={endDate} min={startDate} max={today()}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="admin-input text-sm" />
                            </div>
                            <button onClick={handleDateRefresh} disabled={loadingJourney}
                                className="admin-btn admin-btn-primary w-full flex items-center justify-center gap-2">
                                <RefreshCw size={14} className={loadingJourney ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right Panel: Journey Table ─────────────────────────────── */}
                <div className="lg:col-span-2">
                    {!selectedStudent ? (
                        <div className="admin-card p-20 text-center h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                                <User size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Search a Student</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                Type a student name or enrollment number to find them and view their day-by-day journey history.
                            </p>
                        </div>
                    ) : loadingJourney ? (
                        <div className="admin-card p-20 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                        </div>
                    ) : journeyError ? (
                        <div className="admin-card p-8">
                            <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
                                <AlertTriangle size={18} />
                                <p className="text-sm font-medium">{journeyError}</p>
                            </div>
                        </div>
                    ) : studentData?.logs?.length === 0 ? (
                        <div className="admin-card p-16 text-center">
                            <Calendar size={48} className="text-slate-200 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-700">No journey records found</h3>
                            <p className="text-sm text-slate-400 mt-1">Try expanding the date range.</p>
                        </div>
                    ) : (
                        <div className="admin-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-indigo-500" />
                                    Journey History — {studentData?.student?.name}
                                </h3>
                                <span className="text-xs text-slate-400">{studentData?.logs?.length} records</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Route</th>
                                            <th>Shift</th>
                                            <th>Pass Type</th>
                                            <th>Boarded</th>
                                            <th>Returned</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentData.logs.map((log, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td>
                                                    <div className="font-bold text-slate-900 text-xs">
                                                        {new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                                            weekday: 'short', day: 'numeric', month: 'short'
                                                        })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-xs font-bold text-slate-800">{log.routeId?.routeName || '—'}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{log.routeId?.routeNumber}</div>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase
                                                        ${log.shift === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {log.shift === 'morning' ? <Sun size={10} /> : <Sunset size={10} />}
                                                        {log.shift}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded
                                                        ${log.passType === 'bus_pass' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                                        {log.passType === 'bus_pass' ? 'Pass' : 'Day Ticket'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {log.onboarded?.time ? (
                                                        <span className="text-xs font-bold text-emerald-700">
                                                            {new Date(log.onboarded.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {log.leftForHome?.time ? (
                                                        <span className="text-xs font-bold text-blue-700">
                                                            {new Date(log.leftForHome.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td><StatusBadge status={log.journeyStatus} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
