import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin, routes as routeApi } from '../../services/api';
import { ArrowLeft, Plus, X, Map, Trash2, Edit2, Check, ExternalLink } from 'lucide-react';
import './RouteManagement.css';

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
            const res = await routeApi.getAll();
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
            const payload = {
                ...formData,
                stops: formData.stops.filter(s => s.trim() !== '')
            };

            if (editingRoute) {
                await admin.updateRoute(editingRoute._id, payload);
                setSuccess('Route updated successfully');
            } else {
                await admin.createRoute(payload);
                setSuccess('Route created successfully');
            }

            // Small delay to show success before hiding
            setTimeout(() => {
                resetForm();
                fetchRoutes();
                setSuccess('');
            }, 1500);
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
            shifts: route.shifts?.map(s => typeof s === 'string' ? s : s.shiftType) || [],
            ticketPrices: route.ticketPrices || { single: 50, round: 100 },
            bookingRules: route.bookingRules || { allowedDays: [1, 2, 3, 4, 5, 6] }
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this route? This cannot be undone.')) return;

        try {
            await admin.deleteRoute(id);
            setSuccess('Route deleted successfully');
            fetchRoutes();
            setTimeout(() => setSuccess(''), 3000);
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

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <header className="page-header-premium">
                <div className="header-hero-box">

                    <button
                        className="back-hero-btn"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div>
                        <h1>Route Management</h1>
                    </div>

                </div>
            </header>
            <div className="flex items-end justify-end gap-2 mb-2 mt-3">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`admin-btn ${showForm ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'Add New Route'}
                </button>
            </div>

            {error && <div className="admin-alert admin-alert-danger mb-6">{error}</div>}
            {success && <div className="admin-alert admin-alert-success mb-6">{success}</div>}

            {
                showForm && (
                    <div className="admin-card mb-8">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">
                                {editingRoute ? 'Edit Route Details' : 'Create New Transportation Route'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="admin-input-group">
                                    <label>Route Name</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.routeName}
                                        onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                                        required
                                        placeholder="e.g. Ahmedabad City Express"
                                    />
                                </div>
                                <div className="admin-input-group">
                                    <label>Route Code / Number</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.routeNumber}
                                        onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
                                        required
                                        placeholder="e.g. AMD-01"
                                    />
                                </div>
                                <div className="admin-input-group">
                                    <label>Starts From</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.startPoint}
                                        onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
                                        required
                                        placeholder="Source location"
                                    />
                                </div>
                                <div className="admin-input-group">
                                    <label>Ends At</label>
                                    <input
                                        type="text"
                                        className="admin-input"
                                        value={formData.endPoint}
                                        onChange={(e) => setFormData({ ...formData, endPoint: e.target.value })}
                                        required
                                        placeholder="GUNI Campus"
                                    />
                                </div>
                            </div>

                            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Intermediate Stops</label>
                                <div className="space-y-3">
                                    {formData.stops.map((stop, index) => (
                                        <div key={index} className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    className="admin-input pl-10 w-full"
                                                    value={stop}
                                                    onChange={(e) => handleStopChange(index, e.target.value)}
                                                    placeholder={`Stop #${index + 1} Name`}
                                                />
                                            </div>
                                            {formData.stops.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStop(index)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddStop}
                                    className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700"
                                >
                                    <Plus size={14} /> Add Another Stop
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Pricing Configuration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="admin-input-group">
                                            <label>Single Trip (₹)</label>
                                            <input
                                                type="number"
                                                className="admin-input"
                                                value={formData.ticketPrices.single}
                                                onChange={(e) => setFormData({ ...formData, ticketPrices: { ...formData.ticketPrices, single: Number(e.target.value) } })}
                                            />
                                        </div>
                                        <div className="admin-input-group">
                                            <label>Round Trip (₹)</label>
                                            <input
                                                type="number"
                                                className="admin-input"
                                                value={formData.ticketPrices.round}
                                                onChange={(e) => setFormData({ ...formData, ticketPrices: { ...formData.ticketPrices, round: Number(e.target.value) } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Active Shifts</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.shifts.includes('morning') ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.shifts.includes('morning')} onChange={() => handleShiftToggle('morning')} />
                                            <span className="font-bold">Morning</span>
                                            {formData.shifts.includes('morning') && <Check size={16} />}
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.shifts.includes('afternoon') ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.shifts.includes('afternoon')} onChange={() => handleShiftToggle('afternoon')} />
                                            <span className="font-bold">Afternoon</span>
                                            {formData.shifts.includes('afternoon') && <Check size={16} />}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Operating Days</label>
                                <div className="flex gap-2 flex-wrap">
                                    {dayNames.map((day, index) => (
                                        <label key={index} className={`flex-1 min-w-[70px] text-center p-2 rounded-lg border-2 cursor-pointer transition-all text-xs font-bold ${formData.bookingRules.allowedDays.includes(index) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.bookingRules.allowedDays.includes(index)} onChange={() => handleDayToggle(index)} />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end border-t border-slate-100 pt-6">
                                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn admin-btn-primary"
                                    disabled={formData.shifts.length === 0}
                                >
                                    {editingRoute ? 'Update Route' : 'Create Route'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }

            <div className="admin-table-container">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">All Active Routes ({routes.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Route Detail</th>
                                <th>Path Sequence</th>
                                <th>Shifts</th>
                                <th>Fare (S/R)</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.map(route => (
                                <tr key={route._id}>
                                    <td>
                                        <div className="font-bold text-slate-900">{route.routeName}</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-400">ID: {route.routeNumber}</div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                            <span className="font-semibold text-slate-700 truncate">
                                                {route.startPoint}
                                            </span>

                                            <span className="text-slate-300">→</span>

                                            <span className="font-semibold text-slate-700 truncate">
                                                {route.endPoint}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-400 mt-1">
                                            {route.stops?.length || 0} intermediate stops
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-1">
                                            {route.shifts?.map((s, idx) => (
                                                <span key={idx} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase text-slate-600">
                                                    {typeof s === 'string' ? s : s.shiftType}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="font-bold text-indigo-600">
                                        ₹{route.ticketPrices?.single} / ₹{route.ticketPrices?.round}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(route)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit Route"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(route._id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Route"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
