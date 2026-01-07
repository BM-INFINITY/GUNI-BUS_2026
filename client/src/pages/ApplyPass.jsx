import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes as routesAPI, passes, profile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ApplyPass() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedStop, setSelectedStop] = useState('');
    const [selectedShift, setSelectedShift] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [profileComplete, setProfileComplete] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        checkProfileAndFetchRoutes();
    }, []);

    const checkProfileAndFetchRoutes = async () => {
        try {
            const profileRes = await profile.get();
            setProfileComplete(profileRes.data.isProfileComplete);

            const routesRes = await routesAPI.getAll();
            setRoutes(routesRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error('Error:', err);
        } finally {
            setChecking(false);
        }
    };

    const handleApplyClick = () => {
        if (!profileComplete) {
            setShowProfileModal(true);
        }
    };

    const handleProfileRedirect = () => {
        setShowProfileModal(false);
        navigate('/student/profile');
    };

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        const route = routes.find(r => r._id === routeId);
        setSelectedRoute(route);
        setSelectedStop('');
        setSelectedShift('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!profileComplete) {
            setShowProfileModal(true);
            return;
        }

        if (!selectedRoute || !selectedStop || !selectedShift) {
            setError('Please fill all required fields');
            return;
        }

        setLoading(true);

        try {
            const response = await passes.apply({
                routeId: selectedRoute._id,
                selectedStop,
                shift: selectedShift,
                paymentMethod
            });

            setReferenceNumber(response.data.referenceNumber);
            setSuccess(`Application submitted successfully!`);

            setTimeout(() => {
                navigate('/student');
            }, 2500);
        } catch (err) {
            if (err.response?.data?.requiresProfile) {
                setShowProfileModal(true);
            } else {
                setError(err.response?.data?.message || 'Failed to submit application');
            }
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page-container modern-page">
            {/* Profile Incomplete Modal */}
            {showProfileModal && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">⚠️</div>
                        <h2>Profile Incomplete</h2>
                        <p>You need to complete your profile before applying for a bus pass.</p>
                        <p className="modal-hint">This includes uploading your photo and filling all required details.</p>
                        <div className="modal-actions">
                            <button className="primary-btn" onClick={handleProfileRedirect}>
                                Complete Profile Now
                            </button>
                            <button className="secondary-btn" onClick={() => setShowProfileModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header modern">
                <button onClick={() => navigate('/student')} className="back-btn">
                    ← Back
                </button>
                <div className="page-title">
                    <h1>🎫 Apply for Semester Bus Pass</h1>
                    <p>Select your route, stop, and shift preferences</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
                <div className="alert alert-success">
                    <h3>✅ {success}</h3>
                    {referenceNumber && (
                        <div className="reference-display">
                            <span>Reference Number:</span>
                            <strong>{referenceNumber}</strong>
                        </div>
                    )}
                    <p>Redirecting to dashboard...</p>
                </div>
            )}

            <form className="modern-form" onSubmit={handleSubmit}>
                {/* Route Selection */}
                <div className="form-section">
                    <label className="form-label">
                        <span className="label-icon">🚌</span>
                        Select Route *
                    </label>
                    <select
                        required
                        value={selectedRoute?._id || ''}
                        onChange={handleRouteChange}
                        className="form-select"
                    >
                        <option value="">Choose your route</option>
                        {routes.map(route => (
                            <option key={route._id} value={route._id}>
                                {route.routeName} ({route.routeNumber}) - ₹{route.semesterCharge?.toLocaleString()}/sem
                            </option>
                        ))}
                    </select>
                </div>

                {selectedRoute && (
                    <>
                        {/* Route Info Card */}
                        <div className="info-card">
                            <div className="info-header">
                                <h3>{selectedRoute.routeName}</h3>
                                <div className="price-badge">₹{selectedRoute.semesterCharge?.toLocaleString()}</div>
                            </div>
                            <div className="info-details">
                                <div className="info-item">
                                    <span>📍</span> {selectedRoute.startPoint} → {selectedRoute.endPoint}
                                </div>
                                <div className="info-item">
                                    <span>⏱️</span> 6 months validity
                                </div>
                            </div>
                        </div>

                        {/* Shift Selection */}
                        <div className="form-section">
                            <label className="form-label">
                                <span className="label-icon">⏰</span>
                                Select Shift *
                            </label>
                            <div className="shift-grid">
                                {selectedRoute.shifts && selectedRoute.shifts.map((shift, index) => (
                                    <div
                                        key={index}
                                        className={`shift-card ${selectedShift === shift.shiftType ? 'selected' : ''}`}
                                        onClick={() => setSelectedShift(shift.shiftType)}
                                    >
                                        <input
                                            type="radio"
                                            name="shift"
                                            value={shift.shiftType}
                                            checked={selectedShift === shift.shiftType}
                                            onChange={(e) => setSelectedShift(e.target.value)}
                                        />
                                        <div className="shift-icon">
                                            {shift.shiftType === 'morning' ? '🌅' : '🌆'}
                                        </div>
                                        <div className="shift-info">
                                            <h4>{shift.shiftType === 'morning' ? 'Morning' : 'Afternoon'}</h4>
                                            <p>{shift.shiftType === 'morning' ? '8:30 AM - 2:10 PM' : '11:40 AM - 5:20 PM'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stop Selection */}
                        {selectedShift && (
                            <div className="form-section">
                                <label className="form-label">
                                    <span className="label-icon">📍</span>
                                    Select Boarding Stop *
                                </label>
                                <select
                                    required
                                    value={selectedStop}
                                    onChange={(e) => setSelectedStop(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">Choose your boarding point</option>
                                    {selectedRoute.shifts
                                        ?.find(s => s.shiftType === selectedShift)
                                        ?.stops.map((stop, index) => (
                                            <option key={index} value={stop.name}>
                                                {stop.name} - {stop.arrivalTime}
                                            </option>
                                        ))}
                                </select>

                                {/* Stops Preview */}
                                <div className="stops-preview">
                                    <h4>All Stops ({selectedShift}):</h4>
                                    <div className="stops-timeline">
                                        {selectedRoute.shifts
                                            ?.find(s => s.shiftType === selectedShift)
                                            ?.stops.map((stop, index) => (
                                                <div
                                                    key={index}
                                                    className={`timeline-item ${stop.name === selectedStop ? 'active' : ''}`}
                                                >
                                                    <div className="timeline-marker">{index + 1}</div>
                                                    <div className="timeline-content">
                                                        <strong>{stop.name}</strong>
                                                        <span>{stop.arrivalTime}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Payment Method */}
                {selectedRoute && selectedShift && selectedStop && (
                    <div className="form-section">
                        <label className="form-label">
                            <span className="label-icon">💳</span>
                            Payment Method *
                        </label>
                        <div className="payment-grid">
                            <div
                                className={`payment-card ${paymentMethod === 'online' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('online')}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value="online"
                                    checked={paymentMethod === 'online'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <div className="payment-icon">💳</div>
                                <div className="payment-info">
                                    <h4>Online Payment</h4>
                                    <p>Pay now via UPI/Card</p>
                                </div>
                            </div>
                            <div
                                className={`payment-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cash"
                                    checked={paymentMethod === 'cash'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                <div className="payment-icon">💵</div>
                                <div className="payment-info">
                                    <h4>Cash Payment</h4>
                                    <p>Pay at office</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                {selectedRoute && (
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading || !selectedRoute || !selectedStop || !selectedShift}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-small"></span> Processing...
                                </>
                            ) : (
                                <>
                                    Submit Application - ₹{selectedRoute.semesterCharge?.toLocaleString()}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
