import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes as routesAPI, admin } from '../../services/api';
import {
    Ticket,
    Calendar,
    IndianRupee,
    TrendingUp,
    Search,
    ArrowLeft,
    Plus,
    MoreHorizontal,
    X,
    QrCode,
    Filter,
    RotateCcw
} from 'lucide-react';

export default function DailyTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [qrModal, setQrModal] = useState({ show: false, ticket: null });

    const [reportStats, setReportStats] = useState({
        today: { count: 0, revenue: 0 },
        thisWeek: { count: 0, revenue: 0 },
        thisMonth: { count: 0, revenue: 0 },
        allTime: { count: 0, revenue: 0 }
    });

    const [filters, setFilters] = useState({
        date: '',          // empty = show all dates (not locked to today)
        route: '',
        shift: 'all',
        status: 'all',
        search: ''
    });

    useEffect(() => {
        fetchRoutes();
        fetchAllTicketsForReports();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filters.date, filters.route, filters.status]);

    useEffect(() => {
        applyClientFilters();
    }, [tickets, filters.shift, filters.search]);

    const fetchRoutes = async () => {
        try {
            const res = await routesAPI.getAll();
            setRoutes(res.data);
        } catch (error) {
            console.error("Fetch routes error", error);
        }
    };

    const fetchAllTicketsForReports = async () => {
        try {
            const res = await admin.getTicketsReport();

            const allTickets = res.data;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const getTicketsInRange = (start, end) => allTickets.filter(t => {
                const d = new Date(t.travelDate);
                return d >= start && (!end || d < end);
            });

            const paidRev = (ts) => ts.filter(t => t.paymentStatus === 'completed').reduce((s, t) => s + (t.amount || 0), 0);

            const todayTs = getTicketsInRange(today, new Date(today.getTime() + 86400000));
            const weekTs = getTicketsInRange(weekStart);
            const monthTs = getTicketsInRange(monthStart);

            setReportStats({
                today: { count: todayTs.length, revenue: paidRev(todayTs) },
                thisWeek: { count: weekTs.length, revenue: paidRev(weekTs) },
                thisMonth: { count: monthTs.length, revenue: paidRev(monthTs) },
                allTime: { count: allTickets.length, revenue: paidRev(allTickets) }
            });
        } catch (error) {
            console.error("Fetch report stats error", error);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.date) params.date = filters.date;
            if (filters.route) params.routeId = filters.route;
            if (filters.status !== 'all') params.status = filters.status;

            const res = await admin.getAllTickets(params);
            setTickets(res.data);
        } catch (error) {
            console.error("Fetch tickets error", error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const applyClientFilters = () => {
        let filtered = [...tickets];
        if (filters.shift !== 'all') filtered = filtered.filter(t => t.shift === filters.shift);
        if (filters.search) {
            const s = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.studentName?.toLowerCase().includes(s) ||
                t.enrollmentNumber?.toLowerCase().includes(s) ||
                t.referenceNumber?.toLowerCase().includes(s)
            );
        }
        setFilteredTickets(filtered);
    };

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const resetFilters = () => setFilters({
        date: '',
        route: '',
        shift: 'all',
        status: 'all',
        search: ''
    });

    const currentRevenue = filteredTickets
        .filter(t => t.paymentStatus === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    if (loading && tickets.length === 0) {
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
                        <h1>One day Tickets</h1>
                    </div>
                </div>
            </header>

            {/* Performance KPIs */}
            <div className="admin-grid-stats">
                <div className="admin-stat-card border-b-4 border-indigo-500">
                    <div className="flex justify-between">
                        <div>
                            <span className="admin-stat-title">Today's Tickets</span>
                            <div className="admin-stat-value">{reportStats.today.count}</div>
                            <div className="text-xs text-indigo-600 font-semibold mt-1">₹{reportStats.today.revenue} Revenue</div>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Ticket size={24} /></div>
                    </div>
                </div>
                <div className="admin-stat-card border-b-4 border-green-500">
                    <div className="flex justify-between">
                        <div>
                            <span className="admin-stat-title">This Week</span>
                            <div className="admin-stat-value">{reportStats.thisWeek.count}</div>
                            <div className="text-xs text-green-600 font-semibold mt-1">₹{reportStats.thisWeek.revenue} Revenue</div>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl"><IndianRupee size={24} /></div>
                    </div>
                </div>
                <div className="admin-stat-card border-b-4 border-purple-500">
                    <div className="flex justify-between">
                        <div>
                            <span className="admin-stat-title">This Month</span>
                            <div className="admin-stat-value">{reportStats.thisMonth.count}</div>
                            <div className="text-xs text-purple-600 font-semibold mt-1">₹{reportStats.thisMonth.revenue} Revenue</div>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Calendar size={24} /></div>
                    </div>
                </div>
                <div className="admin-stat-card border-b-4 border-amber-500">
                    <div className="flex justify-between">
                        <div>
                            <span className="admin-stat-title">All Time</span>
                            <div className="admin-stat-value">{reportStats.allTime.count}</div>
                            <div className="text-xs text-amber-600 font-semibold mt-1">₹{reportStats.allTime.revenue} Revenue</div>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={24} /></div>
                    </div>
                </div>
            </div>

            {/* Selection Filters */}
            <div className="admin-filter-bar shadow-sm">
                <div className="flex-1 min-w-[180px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            className="admin-input pl-9 w-full"
                            placeholder="Search"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>
                <div className="relative w-56">
                    <input
                        type={filters.date ? "date" : "text"}
                        placeholder="Date"
                        value={filters.date}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                        }}
                        onChange={(e) => handleFilterChange("date", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none"
                    />
                </div>
                <select className="admin-select" value={filters.route} onChange={(e) => handleFilterChange('route', e.target.value)}>
                    <option value="">All Routes</option>
                    {routes.map(r => <option key={r._id} value={r._id}>{r.routeName}</option>)}
                </select>

                <select className="admin-select" value={filters.shift} onChange={(e) => handleFilterChange('shift', e.target.value)}>
                    <option value="all">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                </select>

                <select className="admin-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                    <option value="all">Any Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Used</option>
                    <option value="pending">Pending Payment</option>
                </select>

                <button onClick={resetFilters} className="admin-filter-reset" title="Reset Filters">
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-sm text-slate-600">
                    Showing <span className="font-bold text-slate-900">{filteredTickets.length}</span> tickets for selected criteria
                </div>
                <div className="text-sm font-semibold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">
                    Current View Revenue: ₹{currentRevenue}
                </div>
            </div>

            {/* Table Area */}
            <div className="admin-table-container">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                <th>Student</th>
                                <th>Travel Date</th>
                                <th>Route</th>
                                <th>Shift</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20 text-slate-400">
                                        No tickets found for the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                                                    {ticket.studentPhoto ? <img src={ticket.studentPhoto} className="w-full h-full object-cover" /> : <Ticket size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-sm">{ticket.studentName}</div>
                                                    <div className="text-xs text-slate-500">{ticket.enrollmentNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-slate-800 text-xs">
                                                {ticket.travelDate
                                                    ? new Date(ticket.travelDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
                                                    : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium text-slate-700">{ticket.routeName}</div>
                                            <div className="text-xs text-slate-400">{ticket.selectedStop}</div>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${ticket.shift === 'morning' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                                                {ticket.shift}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-sm font-bold text-slate-800">₹{ticket.amount}</div>
                                            {ticket.priceOverride && <div className="text-[10px] text-orange-600 font-bold uppercase">Overridden</div>}
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${ticket.paymentStatus === 'completed' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                                                {ticket.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'active' ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                                <span className="text-sm text-slate-600 capitalize">{ticket.status}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button onClick={() => setQrModal({ show: true, ticket })} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                                                    <QrCode size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QR Ticket Modal */}
            {qrModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQrModal({ show: false, ticket: null })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center">
                            <h3 className="font-bold text-lg">Digital Ticket</h3>
                            <p className="text-indigo-100 text-sm">Valid for {new Date(qrModal.ticket.travelDate).toLocaleDateString()}</p>
                        </div>
                        <div className="p-6 text-center">
                            <div className="bg-slate-100 p-4 rounded-2xl inline-block mx-auto mb-4">
                                <img src={qrModal.ticket.qrCode} className="w-48 h-48" alt="QR" />
                            </div>
                            <div className="space-y-1 mb-6">
                                <div className="font-bold text-slate-900">{qrModal.ticket.studentName}</div>
                                <div className="text-sm text-slate-500">{qrModal.ticket.routeName} • {qrModal.ticket.shift}</div>
                                <div className="text-xs font-mono text-slate-400 mt-2">REF: {qrModal.ticket.referenceNumber}</div>
                            </div>
                            <button onClick={() => setQrModal({ show: false, ticket: null })} className="admin-btn admin-btn-secondary w-full justify-center">
                                Close Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
