import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAnalytics } from "../services/adminAnalytics";

export default function AdminTransportDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [todaySummary, setTodaySummary] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [dailyReport, setDailyReport] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaySummary();
    fetchActiveStudents();
  }, []);

  const fetchTodaySummary = async () => {
    try {
      const res = await adminAnalytics.getTodaySummary();
      setTodaySummary(res.data);
    } catch (err) {
      console.error("Summary error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveStudents = async () => {
    try {
      const res = await adminAnalytics.getActiveStudents();
      setActiveStudents(res.data);
    } catch (err) {
      console.error("Active students error", err);
    }
  };

  const fetchDailyReport = async () => {
    if (!selectedDate) return alert("Select date first");

    try {
      const res = await adminAnalytics.getDailyReport(selectedDate);
      setDailyReport(res.data);
    } catch (err) {
      console.error("Daily report error", err);
    }
  };

  return (
    <div className="dashboard modern-dashboard">
      {/* Header */}
      <header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🚌 Transport Analytics</h1>
            <span className="user-badge">Admin Panel</span>
          </div>
          <div className="header-right">
            <span>{user?.name}</span>
            <button className="secondary-btn" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content modern-content">

        {/* ================= TODAY SUMMARY ================= */}
        <div className="card modern-card">
          <h2>📊 Today Route-wise Summary</h2>

          {loading ? (
            <p>Loading summary...</p>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Check-ins</th>
                  <th>Check-outs</th>
                </tr>
              </thead>
              <tbody>
                {todaySummary.map((row, index) => (
                  <tr key={index}>
                    <td>{row._id.routeName} ({row._id.routeNumber})</td>
                    <td>{row.totalCheckIns}</td>
                    <td>{row.totalCheckOuts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= ACTIVE STUDENTS ================= */}
        <div className="card modern-card">
          <h2>🚍 Students Currently Inside Bus</h2>

          <table className="modern-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enrollment</th>
                <th>Route</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              {activeStudents.map((s, index) => (
                <tr key={index}>
                  <td>{s.userId.name}</td>
                  <td>{s.userId.enrollmentNumber}</td>
                  <td>{s.route.routeName}</td>
                  <td>{new Date(s.checkInTime).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= DAILY REPORT ================= */}
        <div className="card modern-card">
          <h2>📅 Daily Attendance Report</h2>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
            <button className="primary-btn" onClick={fetchDailyReport}>
              Load Report
            </button>
          </div>

          {dailyReport.length > 0 && (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Enrollment</th>
                  <th>Route</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.map((r, index) => (
                  <tr key={index}>
                    <td>{r.userId.name}</td>
                    <td>{r.userId.enrollmentNumber}</td>
                    <td>{r.route.routeName}</td>
                    <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "-"}</td>
                    <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
