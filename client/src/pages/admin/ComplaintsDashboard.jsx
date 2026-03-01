import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaints } from '../../services/api';
import {
    ArrowLeft, Search, RefreshCw, AlertTriangle, Clock,
    CheckCircle, XCircle, RotateCcw, X, ShieldCheck,
    TrendingUp, Zap, BarChart3, MessageSquare, Send
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'pending', 'reviewing', 'resolved', 'rejected'];
const PRIORITY_OPTIONS = ['all', 'normal', 'high', 'urgent'];
const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'bus_late_no_show', label: 'Bus Late / No-Show' },
    { value: 'driver_behaviour', label: 'Driver Behaviour' },
    { value: 'bus_condition', label: 'Bus Condition' },
    { value: 'route_deviation', label: 'Route Deviation' },
    { value: 'qr_pass_issue', label: 'QR / Pass Issue' },
    { value: 'overcharging', label: 'Overcharging' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'stop_issue', label: 'Stop Issue' },
    { value: 'other', label: 'Other' },
];

const STATUS_CFG = {
    pending: { cls: 'bg-amber-100 text-amber-700', icon: Clock },
    reviewing: { cls: 'bg-blue-100 text-blue-700', icon: RotateCcw },
    resolved: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { cls: 'bg-rose-100 text-rose-700', icon: XCircle },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
            <Icon size={10} />{status}
        </span>
    );
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }) {
    const isAdmin = msg.senderRole === 'admin';
    const time = new Date(msg.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    return (
        <div className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1
                ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isAdmin ? <ShieldCheck size={13} /> : msg.senderName?.charAt(0) || 'S'}
            </div>
            <div className={`max-w-[78%]`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${isAdmin
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                    {msg.text}
                </div>
                <div className={`text-[10px] text-slate-400 mt-1 ${isAdmin ? 'text-right mr-1' : 'ml-1'}`}>
                    {isAdmin ? 'You (Admin)' : msg.senderName} · {time}
                </div>
            </div>
        </div>
    );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function ComplaintModal({ complaint, onClose, onUpdate }) {
    const [thread, setThread] = useState(complaint.messages || []);
    const [input, setInput] = useState('');
    const [newStatus, setNewStatus] = useState(complaint.status);
    const [remark, setRemark] = useState('');
    const [savingStatus, setSavingStatus] = useState(false);
    const [sendingMsg, setSendingMsg] = useState(false);
    const [err, setErr] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, [thread.length]);

    const handleSendMsg = async () => {
        if (!input.trim() || sendingMsg) return;
        const text = input.trim();
        setInput('');
        const optimistic = { senderRole: 'admin', senderName: 'You (Admin)', text, createdAt: new Date().toISOString() };
        setThread(prev => [...prev, optimistic]);
        setSendingMsg(true);
        try {
            const res = await complaints.sendAdminMessage(complaint._id, text);
            setThread(res.data.messages || [...thread, optimistic]);
            onUpdate(complaint._id, { messages: res.data.messages });
        } catch (_) {
            setThread(prev => prev.filter(m => m !== optimistic));
            setInput(text);
        } finally { setSendingMsg(false); }
    };

    const handleStatusUpdate = async () => {
        setSavingStatus(true); setErr('');
        try {
            const res = await complaints.updateStatus(complaint._id, { status: newStatus, remark });
            setThread(res.data.complaint?.messages || thread);
            setRemark('');
            onUpdate(complaint._id, { status: newStatus, adminRemark: remark, messages: res.data.complaint?.messages });
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed');
        } finally { setSavingStatus(false); }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMsg(); }
    };

    const isClosed = complaint.status === 'resolved' || complaint.status === 'rejected';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Top bar */}
                <div className={`px-6 py-4 shrink-0 rounded-t-3xl ${complaint.priority === 'urgent' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold opacity-70 uppercase mb-0.5">{complaint.referenceNumber}</div>
                            <h3 className="font-extrabold text-base leading-snug truncate">{complaint.title}</h3>
                            <div className="text-xs opacity-75 mt-0.5">
                                {complaint.studentName} · {complaint.enrollmentNumber}
                                {complaint.routeName && ` · ${complaint.routeName}`}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {complaint.priority === 'urgent' && (
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold">🚨 URGENT</span>
                            )}
                            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30">
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status strip */}
                <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 shrink-0 bg-slate-50">
                    <StatusBadge status={complaint.status} />
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    {complaint.incidentDate && (
                        <><span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">Incident: {complaint.incidentDate}</span></>
                    )}
                    {complaint.photo && (
                        <a href={complaint.photo} target="_blank" rel="noreferrer"
                            className="ml-auto text-xs text-indigo-500 font-medium">📎 Photo</a>
                    )}
                </div>

                {/* Chat thread */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
                    {thread.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-8">No messages in thread.</p>
                    ) : (
                        thread.map((msg, i) => <Bubble key={i} msg={msg} />)
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Admin reply box */}
                {!isClosed && (
                    <div className="px-5 pb-3 pt-2 border-t border-slate-100 shrink-0">
                        <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-2xl p-2 mb-3">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                rows={2}
                                placeholder="Type a reply… (Enter to send)"
                                className="flex-1 bg-transparent text-sm resize-none outline-none text-slate-700 placeholder:text-slate-400 px-2 py-1 max-h-24 overflow-y-auto"
                            />
                            <button onClick={handleSendMsg} disabled={sendingMsg || !input.trim()}
                                className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0">
                                {sendingMsg ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                            </button>
                        </div>

                        {/* Status update row */}
                        <div className="space-y-2">
                            {err && <p className="text-rose-600 text-xs">{err}</p>}
                            <div className="flex gap-1.5">
                                {['reviewing', 'resolved', 'rejected'].map(s => (
                                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all
                                            ${newStatus === s
                                                ? s === 'resolved' ? 'bg-emerald-600 text-white'
                                                    : s === 'rejected' ? 'bg-rose-600 text-white'
                                                        : 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={remark} onChange={e => setRemark(e.target.value)}
                                    placeholder="Status change remark (optional)"
                                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                                <button onClick={handleStatusUpdate} disabled={savingStatus || newStatus === complaint.status}
                                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0">
                                    {savingStatus ? '…' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {isClosed && (
                    <div className="px-5 pb-4 pt-2 border-t border-slate-100 text-center text-xs text-slate-400 shrink-0">
                        This complaint is closed ({complaint.status}).
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ComplaintsDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all', category: 'all', priority: 'all', search: '',
    });

    useEffect(() => { fetchAll(); fetchAnalytics(); }, []);
    useEffect(() => { fetchAll(); }, [filters]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.status !== 'all') params.status = filters.status;
            if (filters.category !== 'all') params.category = filters.category;
            if (filters.priority !== 'all') params.priority = filters.priority;
            if (filters.search) params.search = filters.search;
            const res = await complaints.getAll(params);
            setData(res.data || []);
        } catch (_) { }
        finally { setLoading(false); }
    };

    const fetchAnalytics = async () => {
        try { const res = await complaints.getAnalytics(); setAnalytics(res.data); } catch (_) { }
    };

    // Patch a single complaint in the list (optimistic, from modal)
    const handleUpdate = (id, patch) => {
        setData(prev => prev.map(c => c._id === id ? { ...c, ...patch } : c));
        // Also patch modal
        setModal(prev => prev?._id === id ? { ...prev, ...patch } : prev);
        fetchAnalytics();
    };

    const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));

    return (
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">
                    <button className="back-hero-btn" onClick={() => navigate('/admin')}><ArrowLeft size={22} /></button>
                    <div>
                        <h1>Complaints Dashboard</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Student grievance management</p>
                    </div>
                </div>
            </header>

            {/* Analytics Strip */}
            {analytics && (
                <>
                    <div className="admin-grid-stats mb-4">
                        {[
                            { label: 'Total', value: analytics.total, color: 'border-indigo-500', icon: BarChart3, bg: 'bg-indigo-50 text-indigo-600' },
                            { label: 'Pending', value: analytics.pending, color: 'border-amber-500', icon: Clock, bg: 'bg-amber-50 text-amber-600' },
                            { label: 'Reviewing', value: analytics.reviewing, color: 'border-blue-500', icon: RotateCcw, bg: 'bg-blue-50 text-blue-600' },
                            { label: 'Resolved', value: analytics.resolved, color: 'border-emerald-500', icon: CheckCircle, bg: 'bg-emerald-50 text-emerald-600' },
                            { label: 'Urgent', value: analytics.urgent, color: 'border-rose-500', icon: Zap, bg: 'bg-rose-50 text-rose-600' },
                        ].map(s => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className={`admin-stat-card border-b-4 ${s.color}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="admin-stat-title">{s.label}</span>
                                            <div className="admin-stat-value">{s.value}</div>
                                        </div>
                                        <div className={`p-2 rounded-lg ${s.bg}`}><Icon size={20} /></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {analytics.byCategory?.length > 0 && (
                        <div className="admin-card p-4 mb-4 flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase mr-1">By Category:</span>
                            {analytics.byCategory.map(bc => (
                                <span key={bc.category}
                                    onClick={() => setFilter('category', bc.category)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                                    {bc.label}
                                    <span className="bg-white rounded-full px-1.5 py-0.5 text-[10px] font-extrabold">{bc.count}</span>
                                </span>
                            ))}
                            {analytics.avgResolutionHours != null && (
                                <span className="ml-auto text-xs text-slate-400">
                                    Avg resolution: <strong className="text-indigo-600">{analytics.avgResolutionHours}h</strong>
                                </span>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Filters */}
            <div className="admin-filter-bar mb-4">
                <div className="relative flex-1 min-w-[180px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search name, enrollment, ref…" value={filters.search}
                        onChange={e => setFilter('search', e.target.value)}
                        className="admin-input pl-9 w-full" />
                </div>
                <select className="admin-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
                </select>
                <select className="admin-select" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select className="admin-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priority' : p}</option>)}
                </select>
                <button onClick={() => setFilters({ status: 'all', category: 'all', priority: 'all', search: '' })}
                    className="admin-filter-reset"><RotateCcw size={16} /></button>
            </div>

            {/* Table */}
            <div className="admin-card overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <MessageSquare size={15} className="text-indigo-500" /> All Complaints
                    </h3>
                    <span className="text-xs text-slate-400">{data.length} results</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Student</th>
                                <th>Category</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Messages</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center py-16">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                                </td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-16 text-slate-400">
                                    No complaints match your filters.
                                </td></tr>
                            ) : data.map(c => (
                                <tr key={c._id} className={`hover:bg-slate-50/80 transition-colors ${c.priority === 'urgent' ? 'bg-rose-50/40' : ''}`}>
                                    <td><span className="font-mono text-xs text-indigo-600 font-bold">{c.referenceNumber}</span></td>
                                    <td>
                                        <div className="font-bold text-slate-900 text-xs">{c.studentName}</div>
                                        <div className="text-[10px] text-slate-400">{c.enrollmentNumber}</div>
                                    </td>
                                    <td><span className="text-xs text-slate-600">
                                        {CATEGORY_OPTIONS.find(x => x.value === c.category)?.label || c.category}
                                    </span></td>
                                    <td><div className="text-xs text-slate-700 max-w-[180px] truncate font-medium">{c.title}</div></td>
                                    <td>
                                        <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full
                                            ${c.priority === 'urgent' ? 'bg-rose-500 text-white'
                                                : c.priority === 'high' ? 'bg-amber-200 text-amber-800'
                                                    : 'bg-slate-100 text-slate-500'}`}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td>
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <MessageSquare size={11} />{c.messages?.length || 0}
                                        </span>
                                    </td>
                                    <td><span className="text-xs text-slate-400">
                                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </span></td>
                                    <td>
                                        <button onClick={() => setModal(c)}
                                            className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                                            Open Thread
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <ComplaintModal
                    complaint={modal}
                    onClose={() => setModal(null)}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
