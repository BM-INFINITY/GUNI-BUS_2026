import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import StudentLayout from '../../components/layout/StudentLayout';
import {
    Ticket,
    Bus,
    MapPin,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function ApplyDayTicket() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const payTicketId = searchParams.get('payTicket');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pendingTicket, setPendingTicket] = useState(null);

    const [profileData, setProfileData] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [formData, setFormData] = useState({
        routeId: '',
        selectedStop: '',
        shift: 'morning',
        ticketType: 'single',
        travelDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            if (payTicketId) {
                const ticketRes = await axios.get(`${API_URL}/day-tickets/my-tickets`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const ticket = ticketRes.data.find(t => t._id === payTicketId);

                if (ticket && ticket.paymentStatus === 'pending') {
                    if (ticket.route && typeof ticket.route === 'object') {
                        ticket.routeName = ticket.route.routeName;
                        ticket.routeNumber = ticket.route.routeNumber;
                    }
                    setPendingTicket(ticket);
                    setLoading(false);
                    return;
                } else {
                    setError('Ticket not found or already paid');
                    setLoading(false);
                    return;
                }
            }

            const [profileRes, routesRes, passesRes] = await Promise.all([
                axios.get(`${API_URL}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/routes`),
                axios.get(`${API_URL}/passes/my-passes`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const hasActivePass = passesRes.data.some(p => p.status === 'approved');
            // if (hasActivePass) {
            //     alert("Restricted: You already have an active Bus Pass.");
            //     navigate('/student');
            //     return;
            // }

            setProfileData(profileRes.data);
            setRoutes(routesRes.data);

            if (!profileRes.data.isProfileComplete) {
                setError('Please complete your profile before purchasing a day ticket');
            }
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        const route = routes.find(r => r._id === routeId);
        setSelectedRoute(route);
        setFormData({ ...formData, routeId, selectedStop: '' });
    };

    const handlePayment = async (applicationData) => {
        const { applicationId, amount, referenceNumber } = applicationData;

        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setError('Failed to load payment gateway');
                return;
            }

            const token = localStorage.getItem('token');
            const orderResponse = await axios.post(
                `${API_URL}/day-ticket-payment/create-order`,
                { ticketApplicationId: applicationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const orderData = orderResponse.data;
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount * 100,
                currency: 'INR',
                name: 'GUNI Bus Service',
                description: `Day Ticket - ${referenceNumber}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        const verifyResponse = await axios.post(
                            `${API_URL}/day-ticket-payment/verify`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                ticketApplicationId: applicationId
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );

                        if (verifyResponse.data.success) {
                            setSuccess('Payment successful! Ticket activated.');
                            setTimeout(() => navigate('/student/my-day-tickets'), 2000);
                        } else {
                            setError('Payment verification failed: ' + (verifyResponse.data.message || 'Unknown error'));
                            setSubmitting(false);
                        }
                    } catch (error) {
                        setError('Payment verification failed');
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: pendingTicket ? pendingTicket.studentName : (user?.name || ''),
                    email: pendingTicket ? pendingTicket.email : (user?.email || ''),
                    contact: pendingTicket ? pendingTicket.mobile : (user?.mobile || '')
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: async function () {
                        await axios.post(
                            `${API_URL}/day-ticket-payment/failed`,
                            {
                                ticketApplicationId: applicationId,
                                error: 'Payment cancelled by user'
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setError('Payment cancelled');
                        setSubmitting(false);
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Payment failed');
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/day-tickets/apply`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await handlePayment({
                applicationId: response.data.applicationId,
                amount: response.data.amount,
                referenceNumber: response.data.referenceNumber
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application');
            setSubmitting(false);
        }
    };

    const getTicketPrice = () => {
        if (!selectedRoute || !selectedRoute.ticketPrices) return 0;
        return selectedRoute.ticketPrices[formData.ticketType] || 0;
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
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-indigo-600" />
                        {pendingTicket ? 'Complete Ticket Payment' : 'Purchase One-Day Ticket'}
                    </h1>
                    <p className="text-slate-500 mt-2 ml-11">
                        {pendingTicket ? 'Complete your payment to activate this ticket.' : 'Get a quick pass for a single day of travel.'}
                    </p>
                </div>

                <AnimatePresence>
                    {(error || success) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center ${error ? 'border-t-4 border-rose-500' : 'border-t-4 border-emerald-500'}`}
                            >
                                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${error ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {error ? <AlertCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${error ? 'text-slate-800' : 'text-slate-800'}`}>
                                    {error ? 'Action Required' : 'Success!'}
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    {error || success}
                                </p>
                                <button
                                    onClick={() => { setError(''); setSuccess(''); }}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${error ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {error ? 'Dismiss' : 'Continue'}
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Pending Ticket Card */}
                {pendingTicket && (
                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 shadow-sm mb-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 mb-1">Payment Pending</h3>
                                <p className="text-amber-700 text-sm mb-4">This ticket is reserved but not active yet.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/50 p-4 rounded-xl mb-6 border border-amber-100/50">
                                    <div>
                                        <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Route</p>
                                        <p className="font-semibold text-amber-900">{pendingTicket.routeName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Date</p>
                                        <p className="font-semibold text-amber-900">{new Date(pendingTicket.travelDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Amount</p>
                                        <p className="font-bold text-xl text-amber-700">₹{pendingTicket.amount}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePayment({
                                        applicationId: pendingTicket._id,
                                        amount: pendingTicket.amount,
                                        referenceNumber: pendingTicket.referenceNumber
                                    })}
                                    disabled={submitting}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95"
                                >
                                    {submitting ? 'Processing...' : 'Pay Now & Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!pendingTicket && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Date Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Travel Date</label>
                                <input
                                    type="date"
                                    value={formData.travelDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                />
                            </div>

                            {/* Route Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Route</label>
                                <div className="relative">
                                    <select
                                        value={formData.routeId}
                                        onChange={handleRouteChange}
                                        required
                                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none"
                                    >
                                        <option value="">-- Choose Route --</option>
                                        {routes.map(route => (
                                            <option key={route._id} value={route._id}>
                                                {route.routeName} ({route.routeNumber})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>

                            {selectedRoute && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">

                                    {/* Stop Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Stop</label>
                                        <div className="relative">
                                            <select
                                                value={formData.selectedStop}
                                                onChange={(e) => setFormData({ ...formData, selectedStop: e.target.value })}
                                                required
                                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none"
                                            >
                                                <option value="">-- Choose Stop --</option>
                                                {selectedRoute.shifts?.[0]?.stops?.map((stop, index) => (
                                                    <option key={index} value={stop.name}>
                                                        {stop.name} {stop.arrivalTime && `(${stop.arrivalTime})`}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </div>

                                    {/* Shift Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`cursor-pointer p-3 rounded-xl border-2 transition-all text-center ${formData.shift === 'morning' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                            <input type="radio" name="shift" value="morning" checked={formData.shift === 'morning'} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="hidden" />
                                            <span className="font-bold block">Morning</span>
                                        </label>
                                        <label className={`cursor-pointer p-3 rounded-xl border-2 transition-all text-center ${formData.shift === 'afternoon' ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                            <input type="radio" name="shift" value="afternoon" checked={formData.shift === 'afternoon'} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="hidden" />
                                            <span className="font-bold block">Afternoon</span>
                                        </label>
                                    </div>

                                    {/* Ticket Type */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.ticketType === 'single' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}>
                                            <input type="radio" name="ticketType" value="single" checked={formData.ticketType === 'single'} onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })} className="hidden" />
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">Single Trip</span>
                                                <span className="font-bold text-indigo-600">₹{selectedRoute.ticketPrices?.single}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">One-way journey only.</p>
                                        </label>

                                        <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.ticketType === 'round' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'}`}>
                                            <input type="radio" name="ticketType" value="round" checked={formData.ticketType === 'round'} onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })} className="hidden" />
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">Round Trip</span>
                                                <span className="font-bold text-indigo-600">₹{selectedRoute.ticketPrices?.round}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Includes return journey.</p>
                                        </label>
                                    </div>

                                    {/* Total */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Total Payable</p>
                                            <p className="text-xs text-slate-400">Includes all taxes</p>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-800">₹{getTicketPrice()}</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || !profileData?.isProfileComplete || !selectedRoute}
                                        className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${submitting || !profileData?.isProfileComplete || !selectedRoute
                                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1'
                                            }`}
                                    >
                                        {submitting
                                            ? 'Processing...'
                                            : `Pay ₹${getTicketPrice()} & Get Ticket`
                                        }
                                    </button>
                                </motion.div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
