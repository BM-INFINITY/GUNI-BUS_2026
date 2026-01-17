import { useEffect, useState } from "react";
import axios from "axios";
import "./DriverDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DriverDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [driver, setDriver] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/driver/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDriver(res.data.driver);
      setAnalytics(res.data.analytics);
      setPassengers(res.data.passengers || []);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard error:", err);
      // alert("Failed to load dashboard");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const assignedBus = driver?.assignedBus;
  const assignedRoute = driver?.assignedRoute;

  return (
    <div className="driver-dashboard-container">
      {/* Header Section */}
      <header className="driver-app-header">
        <div className="header-brand">
          <div className="brand-logo">🚍</div>
          <div>
            <h1>Driver Portal</h1>
            <p className="subtitle">University Bus System</p>
          </div>
        </div>
        <div className="header-profile">
          <div className="profile-info">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role">Driver</span>
          </div>
          <button className="logout-button" onClick={logout} title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Top Assignment Card */}
        <section className="assignment-section">
          {!assignedRoute ? (
            <div className="no-assignment-card">
              <div className="icon">🛑</div>
              <h2>No Assignment Today</h2>
              <p>You have not been assigned a route for today yet.</p>
            </div>
          ) : (
            <div className="assignment-card-modern">
              <div className="card-header-badge">Today's Assignment</div>
              <div className="route-main-info">
                <div className="route-number">{assignedRoute.routeNumber}</div>
                <div className="route-name">{assignedRoute.routeName}</div>
              </div>

              <div className="assignment-details-grid">
                <div className="detail-pill">
                  <span className="icon">🚌</span>
                  <div className="detail-text">
                    <span className="label">Bus Number</span>
                    <span className="value">{assignedBus ? assignedBus.busNumber : 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-pill">
                  <span className="icon">🔢</span>
                  <div className="detail-text">
                    <span className="label">Reg. Number</span>
                    <span className="value">{assignedBus ? assignedBus.registrationNumber : 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-pill">
                  <span className="icon">🕒</span>
                  <div className="detail-text">
                    <span className="label">Shift</span>
                    <span className="value capitalize">{driver?.shift || 'Flexible'}</span>
                  </div>
                </div>
                <div className="detail-pill">
                  <span className="icon">📍</span>
                  <div className="detail-text">
                    <span className="label">Start Point</span>
                    <span className="value">{assignedRoute.startPoint}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section className="quick-actions-bar">
          <button className="action-card primary" onClick={() => navigate("/driver/scan?mode=check-in")}>
            <div className="icon-wrapper">📲</div>
            <div className="action-text">
              <h3>Check-In</h3>
              <p>Scan Student Pass</p>
            </div>
          </button>

          <button className="action-card secondary" onClick={() => navigate("/driver/scan?mode=check-out")}>
            <div className="icon-wrapper">🏁</div>
            <div className="action-text">
              <h3>Check-Out</h3>
              <p>End Trip for Student</p>
            </div>
          </button>

          <button className="action-card tertiary" onClick={() => navigate("/driver/route")}>
            <div className="icon-wrapper">🗺️</div>
            <div className="action-text">
              <h3>Route Map</h3>
              <p>View Stops & Path</p>
            </div>
          </button>
        </section>

        {/* Live Stats */}
        <section className="stats-overview">
          <div className="stat-box">
            <div className="stat-value">{analytics?.totalPassengers || 0}</div>
            <div className="stat-label">Expected</div>
          </div>
          <div className="stat-box success">
            <div className="stat-value">{analytics?.checkedIn || 0}</div>
            <div className="stat-label">On Board</div>
          </div>
          <div className="stat-box info">
            <div className="stat-value">{analytics?.checkedOut || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </section>

        {/* Passenger Manifest */}
        <section className="manifest-section">
          <div className="section-header">
            <h3>👥 Passenger Manifest</h3>
            <span className="passenger-count">{passengers.length} Students</span>
          </div>

          <div className="manifest-container">
            {passengers.length === 0 ? (
              <div className="empty-manifest">
                <p>No passengers scheduled for this route yet.</p>
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>ID No.</th>
                      <th>Status</th>
                      <th>Time Log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((p) => {
                      const status = p.checkOutTime ? 'completed' : p.checkInTime ? 'onboard' : 'pending';
                      return (
                        <tr key={p._id} className={`row-${status}`}>
                          <td>
                            <div className="student-info-cell">
                              <div className="avatar-placeholder">
                                {p.userId?.profilePhoto ? (
                                  <img src={p.userId.profilePhoto} alt="profile" />
                                ) : (
                                  (p.userId?.name || 'S').charAt(0)
                                )}
                              </div>
                              <div className="student-details">
                                <span className="student-name">{p.userId?.name}</span>
                                <span className="student-dept">{p.userId?.department || 'Student'}</span>
                              </div>
                            </div>
                          </td>
                          <td><code className="enrollment-code">{p.userId?.enrollmentNumber}</code></td>
                          <td>
                            <span className={`status-pill ${status}`}>
                              {status === 'completed' && 'Completed'}
                              {status === 'onboard' && 'On Board'}
                              {status === 'pending' && 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="time-log">
                              {p.checkInTime && (
                                <div className="time-entry in">
                                  <span className="icon">🟢</span>
                                  {new Date(p.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                              {p.checkOutTime && (
                                <div className="time-entry out">
                                  <span className="icon">🔴</span>
                                  {new Date(p.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                              {!p.checkInTime && <span className="no-activity">-</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
