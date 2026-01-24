import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Razorpay script loader (SAME AS BUS PASS)
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

            const [profileRes, routesRes] = await Promise.all([
                axios.get(`${API_URL}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/routes`)
            ]);

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

            // Create Razorpay order
            const orderResponse = await axios.post(
                `${API_URL}/day-ticket-payment/create-order`,
                { ticketApplicationId: applicationId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { orderId, amount: orderAmount, currency } = orderResponse.data;

            // Razorpay options (SAME AS BUS PASS)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderAmount * 100,
                currency: currency,
                name: 'GUNI Day Ticket',
                description: `One Day Bus Ticket - ${formData.travelDate}`,
                order_id: orderId,
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

                        setSuccess('Payment successful! Your day ticket is now active.');
                        setTimeout(() => navigate('/student/day-tickets'), 2000);
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

            // Create ticket application
            const response = await axios.post(
                `${API_URL}/day-tickets/apply`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Initiate payment
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
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="page-container modern-page">
            <div className="page-header modern">
                <button onClick={() => navigate('/student')} className="back-btn">← Back</button>
                <div className="page-title">
                    <h1>🎟️ Purchase One-Day Ticket</h1>
                    <p>Valid for one calendar day only</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
                <div className="alert alert-success">
                    <h3>✅ {success}</h3>
                    <p>Redirecting to your tickets...</p>
                </div>
            )}

            {/* Student Profile Card (SAME AS BUS PASS) */}
            {profileData && (
                <div className="info-card" style={{ marginBottom: '20px' }}>
                    <h3>👤 Your Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', marginTop: '15px' }}>
                        <div>
                            {profileData.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' }}
                                />
                            ) : (
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                                    📷
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Name</strong>
                                <span>{profileData.name}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Enrollment</strong>
                                <span>{user.enrollmentNumber}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Mobile</strong>
                                <span>{profileData.mobile}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Email</strong>
                                <span>{profileData.email}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Department</strong>
                                <span>{profileData.department}</span>
                            </div>
                            <div>
                                <strong style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem' }}>Year</strong>
                                <span>{profileData.year} Year</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="modern-form">
                <div className="form-group">
                    <label>Travel Date *</label>
                    <input
                        type="date"
                        value={formData.travelDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Select Route *</label>
                    <select
                        value={formData.routeId}
                        onChange={handleRouteChange}
                        required
                    >
                        <option value="">-- Select Route --</option>
                        {routes.map(route => (
                            <option key={route._id} value={route._id}>
                                {route.routeName} ({route.routeNumber})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedRoute && (
                    <>
                        <div className="form-group">
                            <label>Select Boarding Point *</label>
                            <select
                                value={formData.selectedStop}
                                onChange={(e) => setFormData({ ...formData, selectedStop: e.target.value })}
                                required
                            >
                                <option value="">-- Select Stop --</option>
                                {selectedRoute.shifts?.[0]?.stops?.map((stop, index) => (
                                    <option key={index} value={stop.name}>
                                        {stop.name} {stop.arrivalTime && `(${stop.arrivalTime})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Shift *</label>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', flex: 1 }}>
                                    <input
                                        type="radio"
                                        value="morning"
                                        checked={formData.shift === 'morning'}
                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <div>
                                        <strong>🌅 Morning Shift</strong>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>8:30 AM - 2:10 PM</p>
                                    </div>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', flex: 1 }}>
                                    <input
                                        type="radio"
                                        value="afternoon"
                                        checked={formData.shift === 'afternoon'}
                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <div>
                                        <strong>🌆 Afternoon Shift</strong>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>11:40 AM - 5:20 PM</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Ticket Type *</label>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', flex: 1 }}>
                                    <input
                                        type="radio"
                                        value="single"
                                        checked={formData.ticketType === 'single'}
                                        onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <div>
                                        <strong>➡️ Single Trip</strong>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>One scan only</p>
                                        {selectedRoute.ticketPrices?.single && (
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#4f46e5' }}>
                                                ₹{selectedRoute.ticketPrices.single}
                                            </p>
                                        )}
                                    </div>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '8px', flex: 1 }}>
                                    <input
                                        type="radio"
                                        value="round"
                                        checked={formData.ticketType === 'round'}
                                        onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <div>
                                        <strong>🔄 Round Trip</strong>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Two scans (pickup + drop)</p>
                                        {selectedRoute.ticketPrices?.round && (
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#4f46e5' }}>
                                                ₹{selectedRoute.ticketPrices.round}
                                            </p>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Price Display */}
                        <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#047857' }}>Ticket Price</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                                        Valid for {formData.travelDate}
                                    </p>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#047857' }}>
                                    ₹{getTicketPrice()}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={submitting || !profileData?.isProfileComplete || !selectedRoute}
                    className="primary-btn large"
                    style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '1.1rem' }}
                >
                    {submitting ? 'Processing...' : selectedRoute ? `Pay ₹${getTicketPrice()} & Get Ticket` : 'Select Route to Continue'}
                </button>
            </form>
        </div>
    );
}
