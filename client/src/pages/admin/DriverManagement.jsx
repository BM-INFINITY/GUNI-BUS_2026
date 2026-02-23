import { useState, useEffect } from 'react';
import { admin, routes } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './DriverManagement.css';

export default function DriverManagement() {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [buses, setBuses] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        licenseNumber: '',
        employeeId: '',
        shift: 'morning',
        assignedRoute: '',
        assignedBus: '',
        password: '' // Only for new drivers
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [driversRes, busesRes, routesRes] = await Promise.all([
                admin.getDrivers(),
                admin.getBuses(),
                routes.getAll()
            ]);
            setDrivers(driversRes.data);
            setBuses(busesRes.data);
            setAllRoutes(routesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch data error:', error);
            setLoading(false);
        }
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            email: driver.email,
            mobile: driver.mobile,
            licenseNumber: driver.licenseNumber || '',
            employeeId: driver.employeeId || '',
            shift: driver.shift || 'morning',
            assignedRoute: driver.assignedRoute?._id || '',
            assignedBus: driver.assignedBus?._id || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingDriver(null);
        setFormData({
            name: '',
            email: '',
            mobile: '',
            licenseNumber: '',
            employeeId: '',
            shift: 'morning',
            assignedRoute: '',
            assignedBus: '',
            password: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDriver) {
                // remove password if empty
                const data = { ...formData };
                if (!data.password) delete data.password;

                await admin.updateDriver(editingDriver._id, data);
            } else {
                await admin.createDriver(formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Save driver error:', error);
            alert(error.response?.data?.message || 'Failed to save driver');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this driver?')) return;
        try {
            await admin.deleteDriver(id);
            fetchData();
        } catch (error) {
            console.error('Delete driver error:', error);
        }
    };

    if (loading) return <div className="loading">Loading drivers...</div>;

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
                            <h1>Driver Management</h1>
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
                            <th>Name</th>
                            <th>Emp ID</th>
                            <th>Mobile</th>
                            <th>Route</th>
                            <th>Vehicle</th>
                            <th>Shift</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(driver => (
                            <tr key={driver._id}>
                                <td>
                                    <div className="driver-info">
                                        <div className="driver-avatar">{driver.name[0]}</div>
                                        <div>
                                            <div className="driver-name">{driver.name}</div>
                                            <div className="driver-license">{driver.licenseNumber}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{driver.employeeId || '-'}</td>
                                <td>{driver.mobile}</td>
                                <td>
                                    {driver.assignedRoute ? (
                                        <span className="route-badge">{driver.assignedRoute.routeNumber}</span>
                                    ) : '-'}
                                </td>
                                <td>
                                    {driver.assignedBus ? (
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <strong>{driver.assignedBus.busNumber}</strong><br />
                                            <span style={{ color: '#666', fontSize: '0.8rem' }}>{driver.assignedBus.registrationNumber}</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="capitalize">{driver.shift || '-'}</td>
                                <td>
                                    <div className="actions">
                                        <button className="icon-btn edit" onClick={() => handleEdit(driver)}>✎</button>
                                        <button className="icon-btn delete" onClick={() => handleDelete(driver._id)}>🗑</button>
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
                        <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Employee ID</label>
                                    <input
                                        required
                                        value={formData.employeeId}
                                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile</label>
                                    <input
                                        required
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>License Number</label>
                                    <input
                                        required
                                        value={formData.licenseNumber}
                                        onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        required={!editingDriver}
                                        placeholder={editingDriver ? "Leave empty to keep current" : ""}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h4 style={{ margin: '20px 0 10px', color: '#666' }}>Assignment</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Shift</label>
                                    <select
                                        value={formData.shift}
                                        onChange={e => setFormData({ ...formData, shift: e.target.value })}
                                    >
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Route</label>
                                    <select
                                        value={formData.assignedRoute}
                                        onChange={e => setFormData({ ...formData, assignedRoute: e.target.value })}
                                    >
                                        <option value="">Select Route</option>
                                        {allRoutes.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.routeNumber} - {r.routeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bus</label>
                                    <select
                                        value={formData.assignedBus}
                                        onChange={e => setFormData({ ...formData, assignedBus: e.target.value })}
                                    >
                                        <option value="">Select Bus</option>
                                        {buses
                                            .filter(b => b.status === 'active' && (!b.assignedDriver || b.assignedDriver._id === editingDriver?._id))
                                            .map(b => (
                                                <option key={b._id} value={b._id}>
                                                    {b.busNumber} ({b.registrationNumber})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Save Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
