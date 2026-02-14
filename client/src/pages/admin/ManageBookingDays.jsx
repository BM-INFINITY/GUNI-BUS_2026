import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Plus, Trash2, AlertCircle, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ManageBookingDays() {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        routeId: '',
        date: '',
        mode: 'enable', // 'enable' or 'disable'
        allowedShifts: [],
        reason: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [routesRes, exceptionsRes] = await Promise.all([
                axios.get(`${API_URL}/routes`),
                axios.get(`${API_URL}/admin/allowed-booking-days?upcoming=true`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setRoutes(routesRes.data);
            setExceptions(exceptionsRes.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleShiftToggle = (shift) => {
        setFormData(prev => ({
            ...prev,
            allowedShifts: prev.allowedShifts.includes(shift)
                ? prev.allowedShifts.filter(s => s !== shift)
                : [...prev.allowedShifts, shift]
        }));
    };

    const validateForm = () => {
        const selectedDate = new Date(formData.date);
        const dayOfWeek = selectedDate.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // If enabling a weekday (Mon-Sat) that's already allowed by default
        if (formData.mode === 'enable' && dayOfWeek >= 1 && dayOfWeek <= 6) {
            setError(`⚠️ ${dayNames[dayOfWeek]} is already enabled by default. Use "Disable Booking" mode to block this date instead.`);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                routeId: formData.routeId === 'all' ? 'all' : formData.routeId
            };

            await axios.post(
                `${API_URL}/admin/allowed-booking-days`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(`Booking rule created successfully! ${formData.mode === 'enable' ? 'Enabled' : 'Blocked'} booking for selected date.`);
            setFormData({ routeId: '', date: '', mode: 'enable', allowedShifts: [], reason: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create rule');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this booking rule?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/allowed-booking-days/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Rule removed successfully');
            fetchData();
        } catch (err) {
            setError('Failed to remove rule');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-left">
                        <button onClick={() => navigate('/admin')} className="back-button">
                            ← Back
                        </button>
                        <h1>📅 Manage Booking Days</h1>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Info Box */}
                <div className="card" style={{ marginBottom: '20px', background: '#e0f2fe', borderLeft: '4px solid #0284c7' }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <Info className="text-sky-700" size={20} style={{ marginTop: '2px' }} />
                        <div>
                            <p style={{ margin: 0, color: '#075985', fontWeight: '500' }}>How it works:</p>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#0c4a6e', fontSize: '14px' }}>
                                <li><strong>Enable Booking:</strong> Allow booking on restricted days (e.g., Sundays)</li>
                                <li><strong>Disable Booking:</strong> Block booking on normally allowed days (e.g., holidays on weekdays)</li>
                                <li><strong>All Routes:</strong> Apply rule to all routes at once</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {(error || success) && (
                    <div className={`card ${error ? 'border-l-4 border-red-500 bg-red-50' : 'border-l-4 border-green-500 bg-green-50'}`} style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle className={error ? 'text-red-600' : 'text-green-600'} size={20} />
                            <p className={error ? 'text-red-800' : 'text-green-800'} style={{ margin: 0 }}>
                                {error || success}
                            </p>
                        </div>
                    </div>
                )}

                {/* Create Rule Form */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                        <Plus size={20} />
                        Create Booking Rule
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Action</label>
                                <select
                                    value={formData.mode}
                                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="enable">✅ Enable Booking</option>
                                    <option value="disable">🚫 Disable Booking</option>
                                </select>
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    {formData.mode === 'enable' ? 'Allow booking on restricted days (Sundays)' : 'Block booking on allowed days (holidays)'}
                                </small>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Route</label>
                                <select
                                    value={formData.routeId}
                                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">-- Select Route --</option>
                                    <option value="all">🌐 All Routes</option>
                                    {routes.map(route => (
                                        <option key={route._id} value={route._id}>
                                            {route.routeName} ({route.routeNumber})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Shifts</label>
                                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allowedShifts.includes('morning')}
                                            onChange={() => handleShiftToggle('morning')}
                                        />
                                        Morning
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.allowedShifts.includes('afternoon')}
                                            onChange={() => handleShiftToggle('afternoon')}
                                        />
                                        Afternoon
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reason (Optional)</label>
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder={formData.mode === 'enable' ? 'e.g., Special event, University function' : 'e.g., National holiday, Maintenance day'}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || formData.allowedShifts.length === 0}
                            className="primary-btn"
                            style={{ opacity: (submitting || formData.allowedShifts.length === 0) ? 0.5 : 1 }}
                        >
                            {submitting ? 'Creating...' : (formData.mode === 'enable' ? '✅ Enable Booking' : '🚫 Block Booking')}
                        </button>
                    </form>
                </div>

                {/* Existing Rules */}
                <div className="card">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                        <Calendar size={20} />
                        Active Booking Rules ({exceptions.length})
                    </h3>

                    {exceptions.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
                            No booking rules created yet
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Mode</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Day</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Route</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Shifts</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Reason</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exceptions.map((exception) => {
                                        const date = new Date(exception.date);
                                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                                        return (
                                            <tr key={exception._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: exception.mode === 'enable' ? '#d1fae5' : '#fee2e2',
                                                        color: exception.mode === 'enable' ? '#065f46' : '#991b1b',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {exception.mode === 'enable' ? '✅ Enable' : '🚫 Block'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>{date.toLocaleDateString()}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background: date.getDay() === 0 ? '#fef3c7' : '#e0e7ff',
                                                        color: date.getDay() === 0 ? '#92400e' : '#3730a3',
                                                        fontSize: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        {dayNames[date.getDay()]}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {exception.route ? (
                                                        <>
                                                            <strong>{exception.route.routeName}</strong>
                                                            <br />
                                                            <small style={{ color: '#666' }}>{exception.route.routeNumber}</small>
                                                        </>
                                                    ) : (
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            background: '#dbeafe',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            color: '#1e40af'
                                                        }}>
                                                            🌐 All Routes
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {exception.allowedShifts.map(shift => (
                                                        <span
                                                            key={shift}
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '2px 6px',
                                                                margin: '2px',
                                                                borderRadius: '3px',
                                                                background: shift === 'morning' ? '#fef3c7' : '#dbeafe',
                                                                color: shift === 'morning' ? '#92400e' : '#1e40af',
                                                                fontSize: '11px'
                                                            }}
                                                        >
                                                            {shift}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <small style={{ color: '#666' }}>{exception.reason || '-'}</small>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <button
                                                        onClick={() => handleDelete(exception._id)}
                                                        className="secondary-btn"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
                                                    >
                                                        <Trash2 size={14} />
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
