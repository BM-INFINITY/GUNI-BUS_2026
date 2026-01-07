import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passes, profile } from '../services/api';

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [userPasses, setUserPasses] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [profileRes, passesRes] = await Promise.all([
                profile.get(),
                passes.getUserPasses(user.id)
            ]);

            setProfileData(profileRes.data);
            setUserPasses(passesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const activePass = userPasses.find(p => p.status === 'approved');
    const pendingPass = userPasses.find(p => p.status === 'pending');
    const rejectedPass = userPasses.find(p => p.status === 'rejected');

    return (
        <div className="dashboard modern-dashboard">
            {/* Enhanced Header */}
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>🚌 GUNI Bus Pass</h1>
                        <span className="user-badge">Student Portal</span>
                    </div>
                    <div className="header-right">
                        <div className="profile-section">
                            <button
                                className="profile-button"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <div className="profile-avatar">
                                    {profileData?.profilePhoto ? (
                                        <img src={profileData.profilePhoto} alt="Profile" />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                </div>
                                <div className="profile-info">
                                    <span className="profile-name">{profileData?.name || user?.name}</span>
                                    <span className="profile-status">
                                        {profileData?.isProfileComplete ? '✓ Complete' : '⏳ Incomplete'}
                                    </span>
                                </div>
                                <span className="dropdown-arrow">▼</span>
                            </button>

                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <button onClick={() => { navigate('/student/profile'); setShowProfileMenu(false); }}>
                                        <span>👤</span> My Profile
                                    </button>
                                    <button onClick={() => { navigate('/student/history'); setShowProfileMenu(false); }}>
                                        <span>📋</span> Boarding History
                                    </button>
                                    <button onClick={logout} className="logout-btn">
                                        <span>🚪</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-content modern-content">
                {/* Quick Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🎫</div>
                        <div className="stat-info">
                            <h3>{activePass ? 'Active' : pendingPass ? 'Pending' : 'No Pass'}</h3>
                            <p>Pass Status</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📍</div>
                        <div className="stat-info">
                            <h3>{activePass?.selectedStop || '—'}</h3>
                            <p>Boarding Stop</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏰</div>
                        <div className="stat-info">
                            <h3>{activePass?.shift === 'morning' ? 'Morning' : activePass?.shift === 'afternoon' ? 'Afternoon' : '—'}</h3>
                            <p>Shift</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👤</div>
                        <div className="stat-info">
                            <h3>{profileData?.isProfileComplete ? 'Complete' : 'Incomplete'}</h3>
                            <p>Profile</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-grid">
                    {/* Active/Pending Pass */}
                    {loading ? (
                        <div className="card modern-card">
                            <div className="loading-spinner">Loading...</div>
                        </div>
                    ) : activePass ? (
                        <div className="card modern-card active-pass-card">
                            <div className="card-header">
                                <h2>✅ Active Bus Pass</h2>
                                <div className="reference-badge-large">{activePass.referenceNumber}</div>
                            </div>
                            <div className="pass-details-grid">
                                <div className="detail-item">
                                    <span className="detail-icon">🚌</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Route</span>
                                        <span className="detail-value">{activePass.route?.routeName}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Stop</span>
                                        <span className="detail-value">{activePass.selectedStop}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">⏰</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Shift</span>
                                        <span className="detail-value">
                                            {activePass.shift === 'morning' ? '🌅 Morning (8:30-2:10)' : '🌆 Afternoon (11:40-5:20)'}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">📅</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Valid Until</span>
                                        <span className="detail-value">{new Date(activePass.validUntil).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="detail-item charge-item">
                                    <span className="detail-icon">💰</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Semester Charge</span>
                                        <span className="detail-value price">₹{activePass.semesterCharge?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="primary-btn" onClick={() => navigate('/student/view-pass')}>
                                <span>📱</span> View QR Code
                            </button>
                        </div>
                    ) : pendingPass ? (
                        <div className="card modern-card pending-card">
                            <div className="card-header">
                                <h2>⏳ Application Pending</h2>
                                <div className="reference-badge-large">{pendingPass.referenceNumber}</div>
                            </div>
                            <p className="pending-message">Your application is awaiting admin approval</p>
                            <div className="pass-details-grid">
                                <div className="detail-item">
                                    <span className="detail-icon">🚌</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Route</span>
                                        <span className="detail-value">{pendingPass.route?.routeName}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Stop</span>
                                        <span className="detail-value">{pendingPass.selectedStop}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">📅</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Applied</span>
                                        <span className="detail-value">{new Date(pendingPass.applicationDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="detail-item charge-item">
                                    <span className="detail-icon">💰</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Charge</span>
                                        <span className="detail-value price">₹{pendingPass.semesterCharge?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card modern-card apply-card">
                            <div className="card-header">
                                <h2>🎫 Apply for Bus Pass</h2>
                            </div>
                            <p>Get your semester bus pass and travel hassle-free!</p>
                            <ul className="benefits-list">
                                <li>✓ Valid for 6 months</li>
                                <li>✓ Daily unlimited travel</li>
                                <li>✓ Choose your route & stop</li>
                                <li>✓ Digital QR code pass</li>
                            </ul>
                            <button className="primary-btn large" onClick={() => navigate('/student/apply-pass')}>
                                <span>📝</span> Apply Now
                            </button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="card modern-card">
                        <h3>Quick Actions</h3>
                        <div className="actions-grid">
                            <button className="action-btn" onClick={() => navigate('/student/buy-ticket')}>
                                <span className="action-icon">🎟️</span>
                                <span className="action-text">Buy Day Ticket</span>
                                <span className="action-price">₹50</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/student/history')}>
                                <span className="action-icon">📋</span>
                                <span className="action-text">View History</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/student/profile')}>
                                <span className="action-icon">👤</span>
                                <span className="action-text">Edit Profile</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
