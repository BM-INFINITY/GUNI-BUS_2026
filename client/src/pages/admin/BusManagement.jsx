import { useState, useEffect } from 'react';
import { admin, routes as routesApi } from '../../services/api';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BusManagement.css';

export default function BusManagement() {
    const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [formData, setFormData] = useState({
        busNumber: '',
        registrationNumber: '',
        capacity: 50,
        manufacturer: '',
        model: '',
        yearOfManufacture: new Date().getFullYear(),
        insuranceExpiryDate: '',
        fitnessExpiryDate: '',
        busType: 'standard',
        seatReservationEnabled: false,
        pointCostPerSeat: 50,
        assignedRoute: '',
        allowedRoutes: []
    });

    useEffect(() => {
        fetchBuses();
        fetchRoutes();
    }, []);

    const fetchBuses = async () => {
        try {
            const res = await admin.getBuses();
            setBuses(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch buses error:', error);
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const res = await routesApi.getAll();
            setAllRoutes(res.data || []);
        } catch (error) {
            console.error('Fetch routes error:', error);
        }
    };

    const handleEdit = (bus) => {
        setEditingBus(bus);
        setFormData({
            busNumber: bus.busNumber,
            registrationNumber: bus.registrationNumber,
            capacity: bus.capacity,
            manufacturer: bus.manufacturer,
            model: bus.model,
            yearOfManufacture: bus.yearOfManufacture,
            insuranceExpiryDate: bus.insuranceExpiryDate.split('T')[0],
            fitnessExpiryDate: bus.fitnessExpiryDate.split('T')[0],
            busType: bus.busType || 'standard',
            seatReservationEnabled: bus.seatReservationEnabled || false,
            pointCostPerSeat: bus.pointCostPerSeat || 50,
            assignedRoute: bus.assignedRoute?._id || bus.assignedRoute || '',
            allowedRoutes: (bus.allowedRoutes || []).map(r => r._id || r)
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingBus(null);
        setFormData({
            busNumber: '',
            registrationNumber: '',
            capacity: 50,
            manufacturer: '',
            model: '',
            yearOfManufacture: new Date().getFullYear(),
            insuranceExpiryDate: '',
            fitnessExpiryDate: '',
            busType: 'standard',
            seatReservationEnabled: false,
            pointCostPerSeat: 50,
            assignedRoute: '',
            allowedRoutes: []
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { busType, seatReservationEnabled, pointCostPerSeat, allowedRoutes, ...busData } = formData;
            if (editingBus) {
                await admin.updateBus(editingBus._id, busData);
                // Save seat config separately
                await admin.updateBusSeatConfig(editingBus._id, { busType, seatReservationEnabled, pointCostPerSeat, allowedRoutes });
            } else {
                const res = await admin.createBus({ ...busData, busType });
                // Set seat config on newly created bus
                await admin.updateBusSeatConfig(res.data.bus._id, { seatReservationEnabled, pointCostPerSeat, allowedRoutes });
            }
            setShowModal(false);
            fetchBuses();
        } catch (error) {
            console.error('Save bus error:', error);
            alert(error.response?.data?.message || 'Failed to save bus');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this bus?')) return;
        try {
            await admin.deleteBus(id);
            fetchBuses();
        } catch (error) {
            console.error('Delete bus error:', error);
        }
    };

    if (loading) return <div className="loading">Loading buses...</div>;

    return (
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">

                    {/* Left Section */}
                    <div className="flex items-center gap-4">

                        <button
                            className="back-hero-btn"
                            onClick={() => navigate('/admin')}
                        >
                            <ArrowLeft size={22} />
                        </button>

                        <div>
                            <h1>Bus Management</h1>
                        </div>

                    </div>

                    {/* Right Section */}
                </div>
            </header>
            <div className="flex flex-col items-end">
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleCreate}
                >
                    +
                </button>
            </div>

            <div className="table-container">
                <table>
                        <thead>
                            <tr>
                                <th>Bus No</th>
                                <th>Registration</th>
                                <th>Make/Model</th>
                                <th>Capacity</th>
                                <th>Type</th>
                                <th>Seat Rsv.</th>
                                <th>Status</th>
                                <th>Assigned Driver</th>
                                <th>Route</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                    <tbody>
                            {buses.map(bus => (
                                <tr key={bus._id} className={!bus.isActive ? 'inactive' : ''}>
                                    <td><span className="bus-badge">{bus.busNumber}</span></td>
                                    <td>{bus.registrationNumber}</td>
                                    <td>{bus.manufacturer} {bus.model}</td>
                                    <td>{bus.capacity}</td>
                                    <td style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{bus.busType || 'standard'}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 6,
                                            background: bus.seatReservationEnabled ? '#d1fae5' : '#f1f5f9',
                                            color: bus.seatReservationEnabled ? '#065f46' : '#94a3b8'
                                        }}>
                                            {bus.seatReservationEnabled ? `✓ ${bus.pointCostPerSeat} pts` : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${bus.status}`}>
                                            {bus.status}
                                        </span>
                                    </td>
                                    <td>{bus.assignedDriver?.name || 'Unassigned'}</td>
                                    <td>{bus.assignedRoute?.routeNumber || '-'}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="icon-btn edit" onClick={() => handleEdit(bus)}>✎</button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(bus._id)}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3>{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bus Number</label>
                                    <input
                                        required
                                        value={formData.busNumber}
                                        onChange={e => setFormData({ ...formData, busNumber: e.target.value })}
                                        placeholder="e.g. B-101"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Registration Number</label>
                                    <input
                                        required
                                        value={formData.registrationNumber}
                                        onChange={e => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                                        placeholder="GJ-01-XX-1234"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Manufacturer</label>
                                    <input
                                        required
                                        value={formData.manufacturer}
                                        onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                                        placeholder="e.g. Tata"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Model</label>
                                    <input
                                        required
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="e.g. Starbus"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.capacity}
                                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.yearOfManufacture}
                                        onChange={e => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Insurance Expiry</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.insuranceExpiryDate}
                                        onChange={e => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fitness Expiry</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.fitnessExpiryDate}
                                        onChange={e => setFormData({ ...formData, fitnessExpiryDate: e.target.value })}
                                    />
                                </div>

                                {/* ── Seat Reservation Section ── */}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Bus Type (Standard is used for Seat Reservation)</label>
                                    <select
                                        value={formData.busType}
                                        onChange={e => setFormData({ ...formData, busType: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    >
                                        <option value="standard">Standard</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Primary Assigned Route</label>
                                    <select
                                        required
                                        value={formData.assignedRoute}
                                        onChange={e => setFormData({ ...formData, assignedRoute: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    >
                                        <option value="">Select a Route</option>
                                        {allRoutes.map(route => (
                                            <option key={route._id} value={route._id}>
                                                {route.routeNumber} — {route.routeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.seatReservationEnabled}
                                            onChange={e => setFormData({ ...formData, seatReservationEnabled: e.target.checked })}
                                            style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
                                        />
                                        <span>Enable Seat Reservation on this Bus</span>
                                    </label>
                                </div>

                                {formData.seatReservationEnabled && (
                                    <>
                                        <div className="form-group">
                                            <label>Point Cost per Seat</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={formData.pointCostPerSeat}
                                                onChange={e => setFormData({ ...formData, pointCostPerSeat: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>

                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Allowed Routes (additional routes for seat reservation)</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                                {allRoutes.map(route => {
                                                    const checked = formData.allowedRoutes.includes(route._id);
                                                    return (
                                                        <label key={route._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${checked ? '#6366f1' : '#e2e8f0'}`, background: checked ? '#eef2ff' : '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: checked ? '#4338ca' : '#475569' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={e => {
                                                                    const next = e.target.checked
                                                                        ? [...formData.allowedRoutes, route._id]
                                                                        : formData.allowedRoutes.filter(id => id !== route._id);
                                                                    setFormData({ ...formData, allowedRoutes: next });
                                                                }}
                                                                style={{ accentColor: '#6366f1' }}
                                                            />
                                                            {route.routeNumber} — {route.routeName}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Save Bus</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
