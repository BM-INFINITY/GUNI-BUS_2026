import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { passes, profile } from '../../services/api';
import JourneyLogs from './JourneyLogs';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userPasses, setUserPasses] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [busDetails, setBusDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPassModal, setShowPassModal] = useState(false);

    useEffect(() => {
        if (user && !user.isProfileComplete) {
            navigate('/student/profile');
            return;
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [profileRes, passesRes] = await Promise.all([
                profile.get(),
                passes.getMyPasses()
            ]);

            setProfileData(profileRes.data);
            setUserPasses(passesRes.data);

            // Fetch Bus Details
            try {
                const token = localStorage.getItem('token');
                console.log("Fetching bus details...");
                const busRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/students/bus-details`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const busData = await busRes.json();
                console.log("Bus Details API Response:", busData);

                if (busData.assigned) {
                    setBusDetails(busData);
                } else {
                    console.log("Bus not assigned:", busData.message);
                }
            } catch (err) {
                console.error("Failed to fetch bus details:", err);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const activePass = userPasses.find(p => p.status === 'approved');
    const pendingPass = userPasses.find(p => p.status === 'pending' && p.paymentStatus === 'pending');
    const failedPass = userPasses.find(p => p.paymentStatus === 'failed');

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard modern-dashboard">

            {/* Header */}
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>🚌 University Bus System</h1>
                        <span className="user-badge">Student Portal</span>
                    </div>
                    <div className="header-right">
                        <div className="profile-avatar">
                            {profileData?.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span>👤</span>
                            )}
                        </div>
                        <span style={{ marginRight: '15px' }}>{profileData?.name || user?.name}</span>
                        <button className="secondary-btn" onClick={() => navigate('/student/profile')}>
                            Profile
                        </button>
                        <button className="secondary-btn" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content modern-content">

                {/* Welcome Card */}
                <div className="card modern-card">
                    <h2>Welcome back, {profileData?.name}!</h2>
                    <p>
                        Enrollment: {user?.enrollmentNumber} | Department: {profileData?.department} | Year: {profileData?.year}
                    </p>
                </div>

                {/* Active Pass */}
                {activePass ? (
                    <>
                        {/* Pass Preview Card */}
                        <div className="card modern-card" style={{ background: '#ecfeff', borderLeft: '4px solid #06b6d4' }}>
                            <h2>🎫 Active Bus Pass</h2>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                <div>
                                    <p><strong>Name:</strong> {profileData.name}</p>
                                    <p><strong>Enrollment:</strong> {user.enrollmentNumber}</p>
                                    <p><strong>Route:</strong> {activePass.route?.routeName}</p>
                                    <p><strong>Stop:</strong> {activePass.selectedStop}</p>
                                    <p><strong>Shift:</strong> {activePass.shift === 'morning' ? 'Morning' : 'Afternoon'}</p>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <img src={activePass.qrCode} width="120" alt="QR" />
                                    <p style={{ fontSize: '0.8rem' }}>Scan for verification</p>
                                </div>
                            </div>

                            <button
                                className="primary-btn"
                                style={{ marginTop: '15px' }}
                                onClick={() => setShowPassModal(true)}
                            >
                                View Full Pass
                            </button>
                        </div>

                        {/* Assigned Bus Details Card */}
                        {busDetails && (
                            <div className="card modern-card" style={{ marginTop: '20px', background: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                                <h2>🚌 Assigned Bus & Driver</h2>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>

                                    {/* Bus Info */}
                                    <div style={{ flex: 1 }}>
                                        <h3>Bus Info</h3>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#15803d' }}>{busDetails.busNumber}</p>
                                        <p style={{ color: '#666' }}>{busDetails.registrationNumber}</p>
                                    </div>

                                    {/* Driver Info */}
                                    {busDetails.driver && (
                                        <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '20px' }}>
                                            <h3>Driver</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {busDetails.driver.photo ? (
                                                    <img
                                                        src={busDetails.driver.photo}
                                                        alt="Driver"
                                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        👨‍✈️
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ fontWeight: 'bold' }}>{busDetails.driver.name}</p>
                                                    <a href={`tel:${busDetails.driver.mobile}`} style={{ color: '#22c55e', textDecoration: 'none' }}>
                                                        📞 {busDetails.driver.mobile}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pass Modal */}
                        {showPassModal && (
                            <div className="modal-overlay" onClick={() => setShowPassModal(false)}>
                                <div
                                    className="modal-box"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ maxWidth: '500px' }}
                                >
                                    <h2 style={{ textAlign: 'center' }}>🚌 University Bus Pass</h2>

                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', marginTop: '20px' }}>
                                        <img
                                            src={profileData.profilePhoto}
                                            alt="Student"
                                            style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }}
                                        />

                                        <div>
                                            <p><strong>Name:</strong> {profileData.name}</p>
                                            <p><strong>Enrollment:</strong> {user.enrollmentNumber}</p>
                                            <p><strong>Department:</strong> {profileData.department}</p>
                                            <p><strong>Year:</strong> {profileData.year}</p>
                                            <p><strong>Mobile:</strong> {profileData.mobile}</p>
                                        </div>
                                    </div>

                                    <hr />

                                    <p><strong>Pass Ref:</strong> {activePass.referenceNumber}</p>
                                    <p><strong>Route:</strong> {activePass.route?.routeName}</p>
                                    <p><strong>Boarding Stop:</strong> {activePass.selectedStop}</p>
                                    <p><strong>Shift:</strong> {activePass.shift}</p>
                                    <p><strong>Valid Till:</strong> {new Date(activePass.validUntil).toLocaleDateString()}</p>

                                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                        <img src={activePass.qrCode} width="250" alt="QR" />
                                        <p>Scan at bus entry</p>
                                    </div>

                                    <button
                                        className="secondary-btn"
                                        style={{ marginTop: '15px', width: '100%' }}
                                        onClick={() => setShowPassModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : failedPass ? (
                    <div className="card modern-card" style={{ background: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
                        <h2>❌ Payment Failed</h2>
                        <p>Your payment was not completed.</p>
                        <p><strong>Reason:</strong> {failedPass.paymentFailureReason || 'Payment was cancelled or failed'}</p>
                        <button className="primary-btn" onClick={() => navigate('/student/apply-pass')}>
                            Retry Payment
                        </button>
                    </div>
                ) : pendingPass ? (
                    <div className="card modern-card" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
                        <h2>⏳ Payment Pending</h2>
                        <p>Your payment is not completed yet. Please complete the payment.</p>
                        <button className="primary-btn" onClick={() => navigate('/student/apply-pass')}>
                            Complete Payment
                        </button>
                    </div>
                ) : (
                    <div className="card modern-card">
                        <h2>🎫 Apply for Bus Pass</h2>
                        <p>Get your semester bus pass for hassle-free daily travel</p>
                        <button className="primary-btn large" onClick={() => navigate('/student/apply-pass')}>
                            Apply Now
                        </button>
                    </div>
                )}

                {/* One Day Ticket Option - Show to ALL, but restrict purchase */}
                <div className="card modern-card" style={{ marginTop: '20px' }}>
                    <h2>🎟️ One Day Ticket</h2>
                    <p>Need to travel for just one day? Buy a single day ticket.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                            className="primary-btn"
                            style={{
                                opacity: activePass ? 0.5 : 1,
                                cursor: activePass ? 'not-allowed' : 'pointer',
                                background: activePass ? '#9ca3af' : ''
                            }}
                            disabled={!!activePass}
                            title={activePass ? "You already have an active pass" : ""}
                            onClick={() => {
                                if (!activePass) {
                                    navigate('/student/apply-day-ticket');
                                }
                            }}
                        >
                            {activePass ? "Unavailable (Pass Active)" : "Purchase New Ticket"}
                        </button>
                        <button className="secondary-btn" onClick={() => navigate('/student/my-day-tickets')}>
                            View My Tickets
                        </button>
                    </div>
                </div>

                {/* Journey Logs Section - NEW ERP STYLE */}
                <JourneyLogs />

            </div>
        </div>
    );
}
