import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dayTickets } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import {
    Ticket,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    MapPin,
    QrCode,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



export default function MyDayTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [todayTicket, setTodayTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
        fetchTodayTicket();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await dayTickets.getMyTickets();
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayTicket = async () => {
        try {
            const res = await dayTickets.getTodayTicket();
            setTodayTicket(res.data);
        } catch (error) {
            console.error('Error fetching today ticket:', error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'used': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'expired': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-indigo-600" />
                        My Day Tickets
                    </h1>
                    <p className="text-slate-500 mt-2 ml-11">Manage and view your daily travel passes.</p>
                </div>

                {/* Today's Active Ticket */}
                {todayTicket ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-1 text-white shadow-xl overflow-hidden relative"
                    >
                        <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-[20px]">
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold border border-white/10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                            Active Now
                                        </div>
                                        <p className="text-white/80 font-mono tracking-wider text-sm">{todayTicket.referenceNumber}</p>
                                    </div>

                                    <div>
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Route</p>
                                        <h3 className="text-2xl font-bold">{todayTicket.route?.routeName}</h3>
                                        <p className="text-white/70 flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {todayTicket.selectedStop}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                                            <p className="text-indigo-200 text-xs uppercase mb-1">Shift</p>
                                            <p className="font-semibold capitalize">{todayTicket.shift}</p>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/5">
                                            <p className="text-indigo-200 text-xs uppercase mb-1">Type</p>
                                            <p className="font-semibold capitalize">{todayTicket.ticketType}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl">
                                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-500"
                                                style={{ width: `${(todayTicket.scanCount / todayTicket.maxScans) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold">{todayTicket.scanCount}/{todayTicket.maxScans} Scans</span>
                                    </div>

                                    <button
                                        onClick={() => setSelectedTicket(todayTicket)}
                                        className="w-full bg-white text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                                    >
                                        View Full Ticket
                                    </button>
                                </div>

                                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-lg max-w-[240px] mx-auto md:mx-0">
                                    <img src={todayTicket.qrCode} alt="QR Code" className="w-full h-auto" />
                                    <p className="text-slate-400 text-xs mt-2 text-center">Scan at bus entry</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Ticket className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Ticket</h3>
                        <p className="text-slate-500 mb-6">You don't have a valid ticket for today. Traveling today?</p>
                        <button
                            onClick={() => navigate('/student/apply-day-ticket')}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:-translate-y-1"
                        >
                            Purchase Day Ticket
                        </button>
                    </div>
                )}

                {/* Pending Payments */}
                {tickets.filter(t => t.paymentStatus === 'pending').length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Payments
                        </h3>
                        {tickets.filter(t => t.paymentStatus === 'pending').map(ticket => (
                            <div key={ticket._id} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-amber-900 text-lg mb-1">{new Date(ticket.travelDate).toLocaleDateString()}</h4>
                                    <p className="text-amber-800 text-sm">
                                        {ticket.route?.routeName} • {ticket.shift} • {ticket.ticketType === 'single' ? 'One Way' : 'Round Trip'}
                                    </p>
                                    <p className="text-amber-700 font-mono text-xs mt-1">Ref: {ticket.referenceNumber}</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-amber-700">₹{ticket.amount}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/student/apply-day-ticket?payTicket=${ticket._id}`)}
                                        className="flex-1 md:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
                                    >
                                        Ids Pay Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* History */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        Ticket History
                    </h3>

                    {tickets.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No tickets found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {tickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${ticket.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                                ticket.status === 'expired' ? 'bg-rose-100 text-rose-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {new Date(ticket.travelDate).getDate()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                        {new Date(ticket.travelDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {ticket.route?.routeName} • {ticket.ticketType}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ticket Details Modal */}
                <AnimatePresence>
                    {selectedTicket && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                            >
                                <div className="bg-indigo-600 p-6 text-white text-center">
                                    <h3 className="text-lg font-medium opacity-90">Day Ticket</h3>
                                    <h2 className="text-3xl font-bold mt-1">{new Date(selectedTicket.travelDate).toLocaleDateString()}</h2>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Route</span>
                                            <span className="font-medium text-slate-900 text-right">{selectedTicket.route?.routeName}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Stop</span>
                                            <span className="font-medium text-slate-900 text-right">{selectedTicket.selectedStop}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Type</span>
                                            <span className="font-medium text-slate-900 capitalize">{selectedTicket.ticketType} Trip</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Status</span>
                                            <span className={`font-bold capitalize ${selectedTicket.status === 'active' ? 'text-emerald-600' : 'text-slate-600'
                                                }`}>{selectedTicket.status}</span>
                                        </div>
                                    </div>

                                    {selectedTicket.qrCode && selectedTicket.status === 'active' && (
                                        <div className="flex flex-col items-center justify-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <img src={selectedTicket.qrCode} alt="QR Code" className="w-40 h-40 object-contain mix-blend-multiply" />
                                            <p className="text-xs text-slate-400 mt-2">Scan this QR code</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </StudentLayout>
    );
}
