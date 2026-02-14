import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { passes, profile, routes as routesAPI, payment } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import { Bus, MapPin, Clock, CreditCard, AlertCircle, CheckCircle, Ticket, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function ApplyPass() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profileData, setProfileData] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [formData, setFormData] = useState({
        routeId: '',
        selectedStop: '',
        shift: 'morning'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, routesRes] = await Promise.all([
                profile.get(),
                routesAPI.getAll()
            ]);

            setProfileData(profileRes.data);
            setRoutes(routesRes.data);

            if (!profileRes.data.isProfileComplete) {
                setError('Please complete your profile before applying for a pass');
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

            const orderResponse = await payment.createOrder({ passApplicationId: applicationId });
            const { orderId, amount: orderAmount, currency } = orderResponse.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderAmount * 100,
                currency: currency,
                name: 'GUNI Bus Pass',
                description: 'Semester Bus Pass Payment',
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await payment.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            passApplicationId: applicationId
                        });

                        setSuccess('Payment successful! Your bus pass is now active.');
                        setTimeout(() => navigate('/student'), 2000);
                    } catch (err) {
                        setError('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: profileData.name,
                    email: profileData.email,
                    contact: profileData.mobile
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: async function () {
                        await payment.paymentFailed({
                            passApplicationId: applicationId,
                            error: 'Payment cancelled by user'
                        });
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
            const response = await passes.apply(formData);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-indigo-600" />
                        Apply for Semester Bus Pass
                    </h1>
                    <p className="text-slate-500 mt-2 ml-11">Get your digital bus pass valid for 6 months. Safe, secure, and instant.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Bus className="w-5 h-5 text-indigo-500" />
                                Route Selection
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Route</label>
                                    <div className="relative">
                                        <select
                                            value={formData.routeId}
                                            onChange={handleRouteChange}
                                            required
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none"
                                        >
                                            <option value="">-- Choose a Route --</option>
                                            {routes.map(route => (
                                                <option key={route._id} value={route._id}>
                                                    {route.routeName} ({route.routeNumber}) - ₹{route.semesterCharge?.toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {selectedRoute && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Boarding Point</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.selectedStop}
                                                    onChange={(e) => setFormData({ ...formData, selectedStop: e.target.value })}
                                                    required
                                                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none"
                                                >
                                                    <option value="">-- Choose a Stop --</option>
                                                    {selectedRoute.shifts?.[0]?.stops?.map((stop, index) => (
                                                        <option key={index} value={stop.name}>
                                                            {stop.name} {stop.arrivalTime && `(${stop.arrivalTime})`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    ▼
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-3">Select Shift</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.shift === 'morning' ? 'border-amber-400 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name="shift"
                                                        value="morning"
                                                        checked={formData.shift === 'morning'}
                                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.shift === 'morning' ? 'border-amber-500' : 'border-slate-300'}`}>
                                                        {formData.shift === 'morning' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 block">Morning Shift</span>
                                                        <span className="text-xs text-slate-500">8:30 AM - 2:10 PM</span>
                                                    </div>
                                                </label>

                                                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${formData.shift === 'afternoon' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name="shift"
                                                        value="afternoon"
                                                        checked={formData.shift === 'afternoon'}
                                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                        className="hidden"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.shift === 'afternoon' ? 'border-indigo-500' : 'border-slate-300'}`}>
                                                        {formData.shift === 'afternoon' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 block">Afternoon Shift</span>
                                                        <span className="text-xs text-slate-500">11:40 AM - 5:20 PM</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-emerald-800 font-bold">Total Semester Fee</p>
                                                <p className="text-emerald-600 text-sm">Valid for 6 months</p>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-700">₹{selectedRoute.semesterCharge?.toLocaleString()}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || !profileData?.isProfileComplete || !selectedRoute}
                                    className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${submitting || !profileData?.isProfileComplete || !selectedRoute
                                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1'
                                        }`}
                                >
                                    {submitting
                                        ? 'Processing Payment...'
                                        : selectedRoute
                                            ? `Pay ₹${selectedRoute.semesterCharge?.toLocaleString()} & Apply`
                                            : 'Select Route to Continue'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {profileData && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner">
                                    <img
                                        src={profileData.profilePhoto || `https://ui-avatars.com/api/?name=${profileData.name}&background=random`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-bold text-slate-800">{profileData.name}</h3>
                                <p className="text-slate-500 text-sm">{profileData.enrollmentNumber}</p>

                                <div className="mt-6 space-y-3 text-left">
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Mobile</span>
                                        <span className="font-medium">{profileData.mobile}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Dept</span>
                                        <span className="font-medium">{profileData.department}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 text-blue-800">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5" />
                                Instructions
                            </h4>
                            <ul className="text-sm space-y-2 list-disc list-inside opacity-90">
                                <li>Select your bus route and boarding point.</li>
                                <li>Choose your preferred shift.</li>
                                <li>Complete payment securely via Razorpay.</li>
                                <li>Pass activates immediately after payment.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
