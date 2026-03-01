import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaints } from '../../services/api';
import {
    ArrowLeft, Plus, Clock, CheckCircle, XCircle,
    RotateCcw, ChevronDown, ChevronUp, Send,
    MessageCircle, ShieldCheck, Calendar
} from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700', icon: Clock },
    reviewing: { label: 'Reviewing', cls: 'bg-blue-100 text-blue-700', icon: RotateCcw },
    resolved: { label: 'Resolved', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700', icon: XCircle },
};

const CAT_LABELS = {
    bus_late_no_show: 'Bus Late / No-Show', driver_behaviour: 'Driver Behaviour',
    bus_condition: 'Bus Condition', route_deviation: 'Route Deviation',
    qr_pass_issue: 'QR / Pass Issue', overcharging: 'Overcharging',
    safety_concern: 'Safety Concern', stop_issue: 'Stop Issue', other: 'Other',
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
            <Icon size={11} />{cfg.label}
        </span>
    );
}

// ── Chat Bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg }) {
    const isAdmin = msg.senderRole === 'admin';
    const time = new Date(msg.createdAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    return (
        <div className={`flex gap-2 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1
                ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {isAdmin ? <ShieldCheck size={13} /> : msg.senderName?.charAt(0) || 'S'}
            </div>
            <div className={`max-w-[78%] ${isAdmin ? '' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                    ${isAdmin
                        ? 'bg-indigo-600 text-white rounded-tl-none'
                        : 'bg-slate-100 text-slate-800 rounded-tr-none'}`}>
                    {msg.text}
                </div>
                <div className={`text-[10px] text-slate-400 mt-1 ${isAdmin ? 'ml-1' : 'mr-1 text-right'}`}>
                    {isAdmin ? 'Support Team' : msg.senderName} · {time}
                </div>
            </div>
        </div>
    );
}

// ── Complaint Card ───────────────────────────────────────────────────────────
function ComplaintCard({ c, onMessageSent }) {
    const [expanded, setExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [thread, setThread] = useState(c.messages || []);
    const bottomRef = useRef(null);

    const canMessage = c.status === 'pending' || c.status === 'reviewing';

    // Scroll to bottom of thread on expand or new message
    useEffect(() => {
        if (expanded) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [expanded, thread.length]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');
        // Optimistic UI update
        const optimistic = {
            senderRole: 'student',
            senderName: c.studentName || 'You',
            text,
            createdAt: new Date().toISOString(),
        };
        setThread(prev => [...prev, optimistic]);
        setSending(true);
        try {
            const res = await complaints.sendMessage(c._id, text);
            // Replace optimistic with server response
            setThread(res.data.messages || [...thread, optimistic]);
            onMessageSent?.(c._id, res.data.messages);
        } catch (_) {
            // Remove optimistic message on failure
            setThread(prev => prev.filter(m => m !== optimistic));
            setInput(text);
        } finally {
            setSending(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden
            ${c.priority === 'urgent' ? 'border-rose-200' : 'border-slate-100'}`}>

            {/* Header */}
            <div className="px-5 py-4 flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={c.status} />
                        {c.priority === 'urgent' && (
                            <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Urgent</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">{c.referenceNumber}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{c.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span>{CAT_LABELS[c.category] || c.category}</span>
                        {c.incidentDate && (
                            <><span>·</span><span><Calendar size={9} className="inline mr-0.5" />{c.incidentDate}</span></>
                        )}
                        <span>·</span>
                        <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MessageCircle size={9} />{thread.length}</span>
                    </div>
                </div>
                <div className="shrink-0 mt-1 text-slate-400">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Thread */}
            {expanded && (
                <div className="border-t border-slate-100">
                    {/* Context strip */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-4 flex-wrap text-xs text-slate-500">
                        {c.routeName && <span>🚌 {c.routeName}</span>}
                        {c.shift && <span>⏰ {c.shift} shift</span>}
                        {c.photo && <a href={c.photo} target="_blank" rel="noreferrer" className="text-indigo-500 font-medium">📎 View Photo</a>}
                    </div>

                    {/* Chat thread */}
                    <div className="px-4 py-4 space-y-3 max-h-80 overflow-y-auto">
                        {thread.length === 0 ? (
                            <p className="text-center text-slate-400 text-xs py-4">No messages yet.</p>
                        ) : (
                            thread.map((msg, i) => <Bubble key={i} msg={msg} />)
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Status history pills */}
                    {c.statusHistory?.length > 1 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                            {c.statusHistory.map((h, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium capitalize">
                                    {h.status} · {new Date(h.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    {canMessage && (
                        <div className="px-4 pb-4">
                            <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-2xl p-2">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    rows={1}
                                    placeholder="Add a message… (Enter to send)"
                                    className="flex-1 bg-transparent text-sm resize-none outline-none text-slate-700 placeholder:text-slate-400 leading-relaxed max-h-24 overflow-y-auto px-2 py-1"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !input.trim()}
                                    className="w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0">
                                    <Send size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                {(c.status === 'resolved' || c.status === 'rejected') ? 'This complaint is closed.' : 'Press Enter or click Send'}
                            </p>
                        </div>
                    )}
                    {!canMessage && (
                        <div className="px-4 pb-4">
                            <p className="text-xs text-center text-slate-400 bg-slate-50 rounded-xl py-2">
                                This complaint is closed — no further messages can be sent.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyComplaints() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await complaints.getMine();
            setData(res.data || []);
        } catch (_) { }
        finally { setLoading(false); }
    };

    // Update thread in-place when student sends a message
    const handleMessageSent = (complaintId, newMessages) => {
        setData(prev => prev.map(c =>
            c._id === complaintId ? { ...c, messages: newMessages } : c
        ));
    };

    const counts = {
        pending: data.filter(c => c.status === 'pending').length,
        reviewing: data.filter(c => c.status === 'reviewing').length,
        resolved: data.filter(c => c.status === 'resolved').length,
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/student')}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900">My Complaints</h1>
                        <p className="text-sm text-slate-400">{data.length} total</p>
                    </div>
                </div>
                <button onClick={() => navigate('/student/raise-complaint')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                    <Plus size={16} /> New
                </button>
            </div>

            {/* Mini stats */}
            {data.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Pending', count: counts.pending, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { label: 'Reviewing', count: counts.reviewing, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { label: 'Resolved', count: counts.resolved, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-2xl border p-3 text-center ${s.color}`}>
                            <div className="text-2xl font-extrabold">{s.count}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">No Complaints Yet</h3>
                    <p className="text-sm text-slate-400 mb-6">Any complaints you raise will appear here.</p>
                    <button onClick={() => navigate('/student/raise-complaint')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        Raise a Complaint
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map(c => (
                        <ComplaintCard key={c._id} c={c} onMessageSent={handleMessageSent} />
                    ))}
                </div>
            )}
        </div>
    );
}
