import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RouteDetails.css";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RouteDetails() {
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth(); // to check assigned shift

    useEffect(() => {
        fetchRouteDetails();
    }, []);

    const fetchRouteDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/driver/route-details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoute(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch route error:", err);
            setError(err.response?.data?.message || "Failed to load route details");
            setLoading(false);
        }
    };

    if (loading) return <div className="route-details-page loading">Loading route info...</div>;
    if (error) return <div className="route-details-page error">Error: {error} <button onClick={() => navigate(-1)}>Go Back</button></div>;
    if (!route) return <div className="route-details-page">No route details found.</div>;

    // Filter shifts based on driver's assigned shift if available, or just show all
    const assignedShift = user?.shift || 'morning';
    // Just show all shifts but maybe highlight the active one

    return (
        <div className="route-details-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate('/driver')}>← Back</button>
                <h2>Route Details</h2>
            </header>

            <div className="route-info-card">
                <div className="route-header">
                    <div className="route-number">{route.routeNumber}</div>
                    <div className="route-name">
                        <h3>{route.routeName}</h3>
                        <p>{route.startPoint} ➝ {route.endPoint}</p>
                    </div>
                </div>
            </div>

            <div className="shifts-container">
                {route.shifts.map((shift, index) => (
                    <div key={index} className={`shift-card ${shift.shiftType === assignedShift ? 'active' : ''}`}>
                        <h3 className="capitalized">{shift.shiftType} Shift</h3>

                        <div className="timeline">
                            {shift.stops.map((stop, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="time-badge">{stop.arrivalTime}</div>
                                    <div className="stop-content">
                                        <h4>{stop.name}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
