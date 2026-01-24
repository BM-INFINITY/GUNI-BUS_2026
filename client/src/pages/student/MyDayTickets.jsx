import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MyDayTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [todayTicket, setTodayTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTickets();
        fetchTodayTicket();
    }, []);

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/day-tickets/my-tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayTicket = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/day-tickets/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTodayTicket(res.data);
        } catch (error) {
            console.error('Error fetching today ticket:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'used': return '#6b7280';
            case 'expired': return '#ef4444';
            case 'pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return '✅';
            case 'used': return '✓';
            case 'expired': return '⏰';
            case 'pending': return '⏳';
            default: return '•';
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard modern-dashboard">
            {/* Header */}
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="secondary-btn" onClick={() => navigate('/student')}>
                            ← Back
                        </button>
                        <h1>🎟️ My Day Tickets</h1>
                    </div>

                </div>
            </header>

            <div className="dashboard-content modern-content">
                {/* Today's Active Ticket */}
                {todayTicket ? (
                    <div className="card modern-card" style={{ background: '#ecfeff', borderLeft: '4px solid #06b6d4' }}>
                        <h2>🎫 Today's Active Ticket</h2>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <p><strong>Route:</strong> {todayTicket.route?.routeName}</p>
                                <p><strong>Stop:</strong> {todayTicket.selectedStop}</p>
                                <p><strong>Shift:</strong> {todayTicket.shift === 'morning' ? 'Morning' : 'Afternoon'}</p>
                                <p><strong>Type:</strong> {todayTicket.ticketType === 'single' ? 'Single Trip' : 'Round Trip'}</p>
                                <p><strong>Scans Used:</strong> {todayTicket.scanCount} / {todayTicket.maxScans}</p>
                                <p><strong>Reference:</strong> {todayTicket.referenceNumber}</p>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <img src={todayTicket.qrCode} width="200" alt="QR" style={{ borderRadius: '8px' }} />
                                <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Scan at bus entry</p>
                                {todayTicket.scanCount < todayTicket.maxScans ? (
                                    <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                                        {todayTicket.maxScans - todayTicket.scanCount} scan(s) remaining
                                    </p>
                                ) : (
                                    <p style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                        All scans used
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            className="primary-btn"
                            style={{ marginTop: '15px' }}
                            onClick={() => {
                                setSelectedTicket(todayTicket);
                                setShowTicketModal(true);
                            }}
                        >
                            View Full Ticket
                        </button>
                    </div>
                ) : (
                    <div className="card modern-card">
                        <h2>No Active Ticket for Today</h2>
                        <p>Purchase a day ticket to travel today</p>
                        <button className="primary-btn large" onClick={() => navigate('/student/apply-day-ticket')}>
                            Purchase Day Ticket
                        </button>
                    </div>
                )}

                {/* Pending Tickets (Admin Created - Awaiting Payment) */}
                {tickets.filter(t => t.paymentStatus === 'pending').length > 0 && (
                    <div className="card modern-card" style={{ marginTop: '20px', background: '#fff7ed', borderLeft: '4px solid #f59e0b' }}>
                        <h2>⏳ Pending Payment</h2>
                        <p style={{ color: '#92400e', marginBottom: '15px' }}>
                            These tickets were created by admin. Please complete payment to activate.
                        </p>

                        {tickets.filter(t => t.paymentStatus === 'pending').map(ticket => (
                            <div
                                key={ticket._id}
                                style={{
                                    padding: '15px',
                                    border: '2px solid #fed7aa',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                    background: 'white'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <div>
                                        <strong style={{ fontSize: '1.1rem' }}>{new Date(ticket.travelDate).toLocaleDateString()}</strong>
                                        <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
                                            {ticket.route?.routeName} • {ticket.shift} • {ticket.ticketType === 'single' ? 'Single' : 'Round'} Trip
                                        </p>
                                        <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
                                            Stop: {ticket.selectedStop}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                            ₹{ticket.amount}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
                                            Ref: {ticket.referenceNumber}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="primary-btn"
                                    style={{ width: '100%', background: '#f59e0b', borderColor: '#f59e0b' }}
                                    onClick={() => {
                                        // Navigate to payment page with ticket ID
                                        navigate(`/student/apply-day-ticket?payTicket=${ticket._id}`);
                                    }}
                                >
                                    💳 Pay Now - ₹{ticket.amount}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Ticket History */}
                <div className="card modern-card" style={{ marginTop: '20px' }}>
                    <h2>📋 Ticket History</h2>

                    {tickets.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No tickets purchased yet</p>
                    ) : (
                        <div style={{ marginTop: '15px' }}>
                            {tickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    style={{
                                        padding: '15px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        marginBottom: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        setShowTicketModal(true);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>
                                                    {getStatusIcon(ticket.status)}
                                                </span>
                                                <div>
                                                    <strong>{new Date(ticket.travelDate).toLocaleDateString()}</strong>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                                                        {ticket.route?.routeName} • {ticket.ticketType === 'single' ? 'Single' : 'Round'} Trip
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    background: getStatusColor(ticket.status) + '20',
                                                    color: getStatusColor(ticket.status)
                                                }}
                                            >
                                                {ticket.status.toUpperCase()}
                                            </span>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
                                                {ticket.scanCount}/{ticket.maxScans} scans
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Modal */}
            {showTicketModal && selectedTicket && (
                <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
                    <div
                        className="modal-box"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '500px' }}
                    >
                        <h2 style={{ textAlign: 'center' }}>🎟️ Day Ticket Details</h2>

                        <div style={{ marginTop: '20px' }}>
                            <p><strong>Reference Number:</strong> {selectedTicket.referenceNumber}</p>
                            <p><strong>Travel Date:</strong> {new Date(selectedTicket.travelDate).toLocaleDateString()}</p>
                            <p><strong>Route:</strong> {selectedTicket.route?.routeName}</p>
                            <p><strong>Boarding Stop:</strong> {selectedTicket.selectedStop}</p>
                            <p><strong>Shift:</strong> {selectedTicket.shift}</p>
                            <p><strong>Ticket Type:</strong> {selectedTicket.ticketType === 'single' ? 'Single Trip' : 'Round Trip'}</p>
                            <p><strong>Amount Paid:</strong> ₹{selectedTicket.amount}</p>
                            <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedTicket.status), fontWeight: 'bold' }}>
                                {selectedTicket.status.toUpperCase()}
                            </span></p>
                            <p><strong>Scans Used:</strong> {selectedTicket.scanCount} / {selectedTicket.maxScans}</p>
                        </div>

                        {selectedTicket.qrCode && selectedTicket.status === 'active' && (
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <img src={selectedTicket.qrCode} width="250" alt="QR" />
                                <p>Scan at bus entry</p>
                            </div>
                        )}

                        {selectedTicket.scans && selectedTicket.scans.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h3>Scan History</h3>
                                {selectedTicket.scans.map((scan, index) => (
                                    <div key={index} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                            <strong>Scan {index + 1}:</strong> {scan.tripType === 'pickup' ? 'Going to College' : 'Going Home'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                                            {new Date(scan.scannedAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="secondary-btn"
                            style={{ marginTop: '15px', width: '100%' }}
                            onClick={() => setShowTicketModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
