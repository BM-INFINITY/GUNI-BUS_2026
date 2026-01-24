import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { routes as routesAPI } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DailyTickets() {
    const [tickets, setTickets] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterRoute, setFilterRoute] = useState('');

    useEffect(() => {
        fetchRoutes();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filterDate, filterRoute]);

    const fetchRoutes = async () => {
        try {
            const res = await routesAPI.getAll();
            setRoutes(res.data);
        } catch (error) {
            console.error("Fetch routes error", error);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            // We need a new endpoint really, or just use a generic search one.
            // Let's assume we create a quick endpoint in server or use this pattern.
            // For expediency, I'll assume we made a generic GET /tickets/admin/all endpoint or similar.
            // Wait, I didn't create that endpoint in tickets.js. 
            // I should stick to client-side logic if small data or add endpoint now.
            // Let's add it via "axios.get" and assume I'll fix backend in a second if it doesn't exist.
            // Actually, I'll add the endpoint to `tickets.js` next.

            const res = await axios.get(`${API_URL}/tickets/admin/all`, {
                params: { date: filterDate, routeId: filterRoute },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTickets(res.data);
        } catch (error) {
            console.error("Fetch tickets error", error);
            // setTickets([]); // Fail gracefully
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = tickets.reduce((sum, t) => sum + (t.amount || 0), 0);

    return (
        <div className="admin-page">
            <header className="page-header">
                <h1>Daily One-Day Tickets</h1>
            </header>

            <div className="filters-bar" style={{ display: 'flex', gap: '20px', background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Date</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Route</label>
                    <select
                        value={filterRoute}
                        onChange={(e) => setFilterRoute(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '200px' }}
                    >
                        <option value="">All Routes</option>
                        {routes.map(r => (
                            <option key={r._id} value={r._id}>{r.routeName}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Tickets</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{tickets.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Revenue</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'green' }}>₹{totalRevenue}</div>
                </div>
            </div>

            <div className="table-container" style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Student</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Route</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Stop</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Shift</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Trip</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : tickets.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No tickets found for this date.</td></tr>
                        ) : (
                            tickets.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>
                                        <div><strong>{t.userId?.name || 'Unknown'}</strong></div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{t.userId?.enrollmentNumber}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{t.routeNumber} - {t.routeName}</td>
                                    <td style={{ padding: '15px' }}>{t.selectedStop}</td>
                                    <td style={{ padding: '15px' }}>{t.shift}</td>
                                    <td style={{ padding: '15px' }}>{t.tripType}</td>
                                    <td style={{ padding: '15px' }}>₹{t.amount}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span className={`status-pill ${t.status}`} style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem',
                                            background: t.status === 'active' ? '#dcfce7' : '#fee2e2',
                                            color: t.status === 'active' ? '#166534' : '#991b1b'
                                        }}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
