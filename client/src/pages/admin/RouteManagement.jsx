import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RouteManagement() {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);

    const [formData, setFormData] = useState({
        routeName: '',
        routeNumber: '',
        startPoint: '',
        endPoint: '',
        stops: [''],
        shifts: [],
        ticketPrices: { single: 50, round: 100 },
        bookingRules: { allowedDays: [1, 2, 3, 4, 5, 6] }
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await axios.get(`${API_URL}/routes`);
            setRoutes(res.data);
        } catch (err) {
            setError('Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStop = () => {
        setFormData({ ...formData, stops: [...formData.stops, ''] });
    };

    const handleRemoveStop = (index) => {
        const newStops = formData.stops.filter((_, i) => i !== index);
        setFormData({ ...formData, stops: newStops });
    };

    const handleStopChange = (index, value) => {
        const newStops = [...formData.stops];
        newStops[index] = value;
        setFormData({ ...formData, stops: newStops });
    };

    const handleShiftToggle = (shift) => {
        const newShifts = formData.shifts.includes(shift)
            ? formData.shifts.filter(s => s !== shift)
            : [...formData.shifts, shift];
        setFormData({ ...formData, shifts: newShifts });
    };

    const handleDayToggle = (day) => {
        const newDays = formData.bookingRules.allowedDays.includes(day)
            ? formData.bookingRules.allowedDays.filter(d => d !== day)
            : [...formData.bookingRules.allowedDays, day];
        setFormData({ ...formData, bookingRules: { allowedDays: newDays } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                stops: formData.stops.filter(s => s.trim() !== '')
            };

            if (editingRoute) {
                await axios.put(`${API_URL}/routes/${editingRoute._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Route updated successfully');
            } else {
                await axios.post(`${API_URL}/routes`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccess('Route created successfully');
            }

            resetForm();
            fetchRoutes();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (route) => {
        setEditingRoute(route);
        setFormData({
            routeName: route.routeName,
            routeNumber: route.routeNumber,
            startPoint: route.startPoint,
            endPoint: route.endPoint,
            stops: route.stops || [''],
            shifts: route.shifts || [],
            ticketPrices: route.ticketPrices || { single: 50, round: 100 },
            bookingRules: route.bookingRules || { allowedDays: [1, 2, 3, 4, 5, 6] }
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this route? This cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/routes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Route deleted successfully');
            fetchRoutes();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete route');
        }
    };

    const resetForm = () => {
        setFormData({
            routeName: '',
            routeNumber: '',
            startPoint: '',
            endPoint: '',
            stops: [''],
            shifts: [],
            ticketPrices: { single: 50, round: 100 },
            bookingRules: { allowedDays: [1, 2, 3, 4, 5, 6] }
        });
        setEditingRoute(null);
        setShowForm(false);
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (loading) return <div>Loading...</div>;

    return (
        <div className="dashboard">
            <header className="modern-header">
                <div className="header-content">
                    <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                    <h1>Route Management</h1>
                </div>
            </header>

            <div className="dashboard-content">
                {error && <div style={{ padding: '10px', background: '#fee', color: '#c00', marginBottom: '10px' }}>{error}</div>}
                {success && <div style={{ padding: '10px', background: '#efe', color: '#060', marginBottom: '10px' }}>{success}</div>}

                <button onClick={() => setShowForm(!showForm)} className="primary-btn" style={{ marginBottom: '20px' }}>
                    {showForm ? 'Cancel' : '+ Create New Route'}
                </button>

                {showForm && (
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <h3>{editingRoute ? 'Edit Route' : 'Create New Route'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label>Route Name *</label>
                                    <input
                                        type="text"
                                        value={formData.routeName}
                                        onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                                <div>
                                    <label>Route Number *</label>
                                    <input
                                        type="text"
                                        value={formData.routeNumber}
                                        onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                                <div>
                                    <label>Start Point *</label>
                                    <input
                                        type="text"
                                        value={formData.startPoint}
                                        onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                                <div>
                                    <label>End Point *</label>
                                    <input
                                        type="text"
                                        value={formData.endPoint}
                                        onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>Stops</label>
                                {formData.stops.map((stop, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                        <input
                                            type="text"
                                            value={stop}
                                            onChange={(e) => handleStopChange(index, e.target.value)}
                                            placeholder={`Stop ${index + 1}`}
                                            style={{ flex: 1, padding: '8px' }}
                                        />
                                        {formData.stops.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveStop(index)} className="secondary-btn">Remove</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddStop} className="secondary-btn" style={{ marginTop: '10px' }}>+ Add Stop</button>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>Shifts *</label>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                    <label><input type="checkbox" checked={formData.shifts.includes('morning')} onChange={() => handleShiftToggle('morning')} /> Morning</label>
                                    <label><input type="checkbox" checked={formData.shifts.includes('afternoon')} onChange={() => handleShiftToggle('afternoon')} /> Afternoon</label>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label>Single Ticket Price</label>
                                    <input
                                        type="number"
                                        value={formData.ticketPrices.single}
                                        onChange={(e) => setFormData({ ...formData, ticketPrices: { ...formData.ticketPrices, single: Number(e.target.value) } })}
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                                <div>
                                    <label>Round Ticket Price</label>
                                    <input
                                        type="number"
                                        value={formData.ticketPrices.round}
                                        onChange={(e) => setFormData({ ...formData, ticketPrices: { ...formData.ticketPrices, round: Number(e.target.value) } })}
                                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label>Allowed Booking Days</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                                    {dayNames.map((day, index) => (
                                        <label key={index}>
                                            <input type="checkbox" checked={formData.bookingRules.allowedDays.includes(index)} onChange={() => handleDayToggle(index)} />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="primary-btn" disabled={formData.shifts.length === 0}>
                                {editingRoute ? 'Update Route' : 'Create Route'}
                            </button>
                            {showForm && <button type="button" onClick={resetForm} className="secondary-btn" style={{ marginLeft: '10px' }}>Cancel</button>}
                        </form>
                    </div>
                )}

                <div className="card">
                    <h3>All Routes ({routes.length})</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Route</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Number</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Path</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Shifts</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Prices</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map(route => (
                                <tr key={route._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}><strong>{route.routeName}</strong></td>
                                    <td style={{ padding: '10px' }}>{route.routeNumber}</td>
                                    <td style={{ padding: '10px' }}>{route.startPoint} → {route.endPoint}</td>
                                    <td style={{ padding: '10px' }}>{route.shifts?.join(', ')}</td>
                                    <td style={{ padding: '10px' }}>₹{route.ticketPrices?.single} / ₹{route.ticketPrices?.round}</td>
                                    <td style={{ padding: '10px' }}>
                                        <button onClick={() => handleEdit(route)} className="secondary-btn" style={{ marginRight: '5px' }}>Edit</button>
                                        <button onClick={() => handleDelete(route._id)} className="secondary-btn">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
