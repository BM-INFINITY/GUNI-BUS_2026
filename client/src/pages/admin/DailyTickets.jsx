import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { routes as routesAPI } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function DailyTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    // QR Modal
    const [qrModal, setQrModal] = useState({ show: false, ticket: null });

    // Report stats
    const [reportStats, setReportStats] = useState({
        today: { count: 0, revenue: 0 },
        thisWeek: { count: 0, revenue: 0 },
        thisMonth: { count: 0, revenue: 0 },
        allTime: { count: 0, revenue: 0 }
    });

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        route: '',
        shift: 'all',
        status: 'all',
        search: ''
    });

    useEffect(() => {
        fetchRoutes();
        fetchAllTicketsForReports();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [filters.date, filters.route, filters.status]);

    useEffect(() => {
        applyClientFilters();
    }, [tickets, filters.shift, filters.search]);

    const fetchRoutes = async () => {
        try {
            const res = await routesAPI.getAll();
            setRoutes(res.data);
        } catch (error) {
            console.error("Fetch routes error", error);
        }
    };

    const fetchAllTicketsForReports = async () => {
        try {
            // Fetch all tickets without date filter for reports
            const res = await axios.get(`${API_URL}/tickets/admin/all`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const allTickets = res.data;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Calculate week start (Monday)
            const weekStart = new Date(today);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);

            // Calculate month start
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            // Filter and calculate stats
            const todayTickets = allTickets.filter(t => {
                const travelDate = new Date(t.travelDate);
                return travelDate >= today && travelDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });

            const weekTickets = allTickets.filter(t => {
                const travelDate = new Date(t.travelDate);
                return travelDate >= weekStart;
            });

            const monthTickets = allTickets.filter(t => {
                const travelDate = new Date(t.travelDate);
                return travelDate >= monthStart;
            });

            const paidTickets = (tickets) => tickets.filter(t => t.paymentStatus === 'completed');

            setReportStats({
                today: {
                    count: todayTickets.length,
                    revenue: paidTickets(todayTickets).reduce((sum, t) => sum + (t.amount || 0), 0)
                },
                thisWeek: {
                    count: weekTickets.length,
                    revenue: paidTickets(weekTickets).reduce((sum, t) => sum + (t.amount || 0), 0)
                },
                thisMonth: {
                    count: monthTickets.length,
                    revenue: paidTickets(monthTickets).reduce((sum, t) => sum + (t.amount || 0), 0)
                },
                allTime: {
                    count: allTickets.length,
                    revenue: paidTickets(allTickets).reduce((sum, t) => sum + (t.amount || 0), 0)
                }
            });
        } catch (error) {
            console.error("Fetch all tickets error", error);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.date) params.date = filters.date;
            if (filters.route) params.routeId = filters.route;
            if (filters.status !== 'all') params.status = filters.status;

            const res = await axios.get(`${API_URL}/tickets/admin/all`, {
                params,
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTickets(res.data);
        } catch (error) {
            console.error("Fetch tickets error", error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const applyClientFilters = () => {
        let filtered = [...tickets];

        // Shift filter
        if (filters.shift !== 'all') {
            filtered = filtered.filter(t => t.shift === filters.shift);
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.studentName?.toLowerCase().includes(searchLower) ||
                t.enrollmentNumber?.toLowerCase().includes(searchLower) ||
                t.referenceNumber?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredTickets(filtered);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            date: new Date().toISOString().split('T')[0],
            route: '',
            shift: 'all',
            status: 'all',
            search: ''
        });
    };

    const totalRevenue = filteredTickets
        .filter(t => t.paymentStatus === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const stats = {
        total: filteredTickets.length,
        active: filteredTickets.filter(t => t.status === 'active').length,
        pending: filteredTickets.filter(t => t.status === 'pending').length,
        completed: filteredTickets.filter(t => t.paymentStatus === 'completed').length
    };

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/admin')} className="back-button">
                            ← Back
                        </button>
                        <h1>🎫 One-Day Tickets</h1>
                    </div>
                    <div className="header-right">
                        <button onClick={() => navigate('/admin/create-day-ticket')} className="create-button">
                            Create New Ticket
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Reports Section */}
                <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>📊 Reports & Analytics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>📅 Today</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{reportStats.today.count}</div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>₹{reportStats.today.revenue}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>📆 This Week</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{reportStats.thisWeek.count}</div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>₹{reportStats.thisWeek.revenue}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>📊 This Month</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{reportStats.thisMonth.count}</div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>₹{reportStats.thisMonth.revenue}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>🌐 All Time</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{reportStats.allTime.count}</div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>₹{reportStats.allTime.revenue}</div>
                        </div>
                    </div>
                </div>

                {/* Current View Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Filtered Total</h3>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.total}</p>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Active</h3>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.active}</p>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Paid</h3>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.completed}</p>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Revenue</h3>
                        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>₹{totalRevenue}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3>🔍 Filters</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>📅 Travel Date</label>
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>🚌 Route</label>
                            <select
                                value={filters.route}
                                onChange={(e) => handleFilterChange('route', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">All Routes</option>
                                {routes.map(r => (
                                    <option key={r._id} value={r._id}>{r.routeName} ({r.routeNumber})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>🌅 Shift</label>
                            <select
                                value={filters.shift}
                                onChange={(e) => handleFilterChange('shift', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Shifts</option>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>📊 Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="expired">Expired</option>
                                <option value="used">Used</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>🔎 Search</label>
                            <input
                                type="text"
                                placeholder="Name, Enrollment, Ref..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={resetFilters}
                                className="secondary-btn"
                                style={{ width: '100%' }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '4px', textAlign: 'center' }}>
                        <strong>Showing {filteredTickets.length} of {tickets.length} tickets</strong>
                    </div>
                </div>

                {/* Tickets Table */}
                {loading ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="loading">Loading tickets...</div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ fontSize: '18px', color: '#666' }}>
                            {tickets.length === 0 ? 'No tickets found for this date' : 'No tickets match your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Photo</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Student</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Enrollment</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Stop</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Shift</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Travel Date</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Override</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Payment</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>QR Code</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Ref #</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket) => (
                                        <tr key={ticket._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>
                                                {ticket.studentPhoto ? (
                                                    <img
                                                        src={ticket.studentPhoto}
                                                        alt={ticket.studentName}
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        👤
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>{ticket.studentName}</td>
                                            <td style={{ padding: '12px' }}>{ticket.enrollmentNumber}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div>
                                                    <strong>{ticket.routeName}</strong>
                                                    <br />
                                                    <small style={{ color: '#666' }}>{ticket.routeNumber}</small>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>{ticket.selectedStop}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: ticket.shift === 'morning' ? '#fff3cd' : '#d1ecf1',
                                                    color: ticket.shift === 'morning' ? '#856404' : '#0c5460',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {ticket.shift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {ticket.travelDate ? new Date(ticket.travelDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{ticket.amount}</td>
                                            <td style={{ padding: '12px' }}>
                                                {ticket.priceOverride !== null && ticket.priceOverride !== undefined ? (
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>
                                                            Overridden
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                                            {ticket.overrideReason || 'No reason'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: ticket.paymentStatus === 'completed' ? '#dcfce7' : '#fee2e2',
                                                    color: ticket.paymentStatus === 'completed' ? '#166534' : '#991b1b',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {ticket.paymentStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: ticket.status === 'active' ? '#dbeafe' : '#f3f4f6',
                                                    color: ticket.status === 'active' ? '#1e40af' : '#6b7280',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {ticket.qrCode ? (
                                                    <img
                                                        src={ticket.qrCode}
                                                        alt="QR"
                                                        style={{ width: '50px', height: '50px', cursor: 'pointer', border: '1px solid #ddd' }}
                                                        onClick={() => setQrModal({ show: true, ticket })}
                                                        title="Click to enlarge"
                                                    />
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '12px' }}>No QR</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>
                                                    {ticket.referenceNumber}
                                                </code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Modal */}
            {qrModal.show && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setQrModal({ show: false, ticket: null })}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            maxWidth: '400px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0 }}>{qrModal.ticket?.studentName}</h3>
                        <p style={{ color: '#666', margin: '5px 0' }}>{qrModal.ticket?.enrollmentNumber}</p>
                        <p style={{ color: '#666', margin: '5px 0', fontSize: '14px' }}>
                            {qrModal.ticket?.routeName} - {qrModal.ticket?.shift}
                        </p>
                        <p style={{ color: '#666', margin: '5px 0', fontSize: '14px' }}>
                            Travel: {qrModal.ticket?.travelDate ? new Date(qrModal.ticket.travelDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <img
                            src={qrModal.ticket?.qrCode}
                            alt="QR Code"
                            style={{ width: '250px', height: '250px', margin: '20px 0', border: '2px solid #ddd' }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                            Ref: {qrModal.ticket?.referenceNumber}
                        </p>
                        <button
                            onClick={() => setQrModal({ show: false, ticket: null })}
                            className="primary-btn"
                            style={{ marginTop: '10px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
