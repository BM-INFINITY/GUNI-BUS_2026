import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import './BusManagement.css';

export default function BusManagement() {
    const [buses, setBuses] = useState([]);
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
        fitnessExpiryDate: ''
    });

    useEffect(() => {
        fetchBuses();
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
            fitnessExpiryDate: bus.fitnessExpiryDate.split('T')[0]
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
            fitnessExpiryDate: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBus) {
                await admin.updateBus(editingBus._id, formData);
            } else {
                await admin.createBus(formData);
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
        <div className="bus-management">
            <header className="page-header">
                <h2>🚌 Bus Management</h2>
                <button className="primary-btn" onClick={handleCreate}>+ Add New Bus</button>
            </header>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Bus No</th>
                            <th>Registration</th>
                            <th>Make/Model</th>
                            <th>Capacity</th>
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
