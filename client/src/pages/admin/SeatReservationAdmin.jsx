import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { ArrowLeft, Filter, Bus, Calendar, User, Armchair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function dirLabel(dir) {
    return dir === 'home_to_uni' ? 'Home → Uni' : 'Uni → Home';
}

const STATUS_OPTIONS = ['', 'active', 'cancelled'];

export default function SeatReservationAdmin() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ status: '', date: '', page: 1 });

    useEffect(() => {
        fetchReservations();
    }, [filters]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.date) params.date = filters.date;
            params.page = filters.page;
            params.limit = 25;

            const res = await admin.getSeatReservations(params);
            setReservations(res.data.reservations || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error('Failed to fetch seat reservations', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">
                    <div className="flex items-center gap-4">
                        <button className="back-hero-btn" onClick={() => navigate('/admin')}>
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1>Seat Reservations</h1>
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 2 }}>
                                {total} total reservation{total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, margin: '16px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={15} style={{ color: '#6366f1' }} />
                    <input
                        type="date"
                        value={filters.date}
                        onChange={e => handleFilter('date', e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={e => handleFilter('status', e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                {(filters.date || filters.status) && (
                    <button
                        onClick={() => setFilters({ status: '', date: '', page: 1 })}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {loading ? (
                <div className="loading">Loading reservations...</div>
            ) : (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Bus</th>
                                    <th>Route</th>
                                    <th>Seat</th>
                                    <th>Date</th>
                                    <th>Direction</th>
                                    <th>Trip Type</th>
                                    <th>Points</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                                            No reservations found.
                                        </td>
                                    </tr>
                                ) : reservations.map(r => (
                                    <tr key={r._id} style={{ opacity: r.status === 'cancelled' ? 0.6 : 1 }}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{r.studentId?.name || '-'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.studentId?.enrollmentNumber}</div>
                                        </td>
                                        <td><span className="bus-badge">{r.busId?.busNumber || '-'}</span></td>
                                        <td>{r.routeId?.routeNumber || '-'}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, padding: '2px 8px', background: '#eef2ff', color: '#4338ca', borderRadius: 8 }}>
                                                #{r.seatNumber}
                                            </span>
                                        </td>
                                        <td>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{dirLabel(r.direction)}</td>
                                        <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{r.tripType.replace('_', ' ')}</td>
                                        <td style={{ fontWeight: 600, color: '#6366f1' }}>{r.pointsSpent} pts</td>
                                        <td>
                                            <span className={`status-badge ${r.status === 'active' ? 'active' : 'inactive'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                            <button
                                disabled={filters.page <= 1}
                                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', disabled: filters.page <= 1 }}
                            >
                                Prev
                            </button>
                            <span style={{ padding: '6px 14px', fontWeight: 600 }}>
                                Page {filters.page} / {totalPages}
                            </span>
                            <button
                                disabled={filters.page >= totalPages}
                                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
