import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passes, profile, routes as routesAPI, payment } from '../services/api';

// Razorpay script loader
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

            // Check if profile is complete
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
            // Load Razorpay script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setError('Failed to load payment gateway');
                return;
            }

            // Create Razorpay order
            const orderResponse = await payment.createOrder({ passApplicationId: applicationId });
            const { orderId, amount: orderAmount, currency } = orderResponse.data;

            // Razorpay options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderAmount * 100,
                currency: currency,
                name: 'GUNI Bus Pass',
                description: 'Semester Bus Pass Payment',
                order_id: orderId,
                handler: async function (response) {
                    // Payment successful
                    try {
                        const verifyResponse = await payment.verifyPayment({
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
                        // Payment cancelled
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
            // Create pass application
            const response = await passes.apply(formData);

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

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="page-container modern-page">
            <div className="page-header modern">
                <button onClick={() => navigate('/student')} className="back-btn">← Back</button>
                <div className="page-title">
                    <h1>🎫 Apply for Semester Bus Pass</h1>
                    <p>Valid for 6 months</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
                <div className="alert alert-success">
                    <h3>✅ {success}</h3>
                    <p>Redirecting to dashboard...</p>
                </div>
            )}

            {/* Student Profile Card */}
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
                    <label>Select Route *</label>
                    <select
                        value={formData.routeId}
                        onChange={handleRouteChange}
                        required
                    >
                        <option value="">-- Select Route --</option>
                        {routes.map(route => (
                            <option key={route._id} value={route._id}>
                                {route.routeName} ({route.routeNumber}) - ₹{route.semesterCharge?.toLocaleString()}
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

                        {/* Price Display */}
                        <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#047857' }}>Semester Charge</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Valid for 6 months</p>
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#047857' }}>
                                    ₹{selectedRoute.semesterCharge?.toLocaleString()}
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
                    {submitting ? 'Processing...' : selectedRoute ? `Pay ₹${selectedRoute.semesterCharge?.toLocaleString()} & Get Pass` : 'Select Route to Continue'}
                </button>
            </form>
        </div>
    );
}
