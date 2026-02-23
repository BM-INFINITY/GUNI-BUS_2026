import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Calendar,
    Plus,
    Trash2,
    AlertCircle,
    Info,
    ShieldCheck,
    Ban,
    MapPin,
    Clock,
    History,
    CheckCircle2,
    XCircle,
    Globe,
    ArrowLeft
} from 'lucide-react';

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
        mode: 'enable',
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
            setError('Failed to load operational data');
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

        if (formData.mode === 'enable' && dayOfWeek >= 1 && dayOfWeek <= 6) {
            setError(`${dayNames[dayOfWeek]} is already an active booking day. Use "Block Booking" to restrict it instead.`);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/admin/allowed-booking-days`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Operational override set: ${formData.mode === 'enable' ? 'Enabled' : 'Blocked'} ${new Date(formData.date).toLocaleDateString()}`);
            setFormData({ routeId: '', date: '', mode: 'enable', allowedShifts: [], reason: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update rules');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to revert this operational override?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/admin/allowed-booking-days/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Override removed successfully');
            fetchData();
        } catch (err) {
            setError('Failed to revert rules');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            {/* Info Notice */}
            <header className="page-header-premium">
                <div className="header-hero-box">

                    <button
                        className="back-hero-btn"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div>
                        <h1>Booking Rules Management</h1>
                    </div>

                </div>
            </header>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-8 flex gap-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg h-fit">
                    <Info size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">Operational Logic</h4>
                    <p className="text-sm text-indigo-700">
                        Default: Booking enabled Mon-Sat. Use overrides to allow Sunday bookings or block holiday dates.
                        Global overrides (All Routes) take precedence.
                    </p>
                </div>
            </div>

            {(error || success) && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error || success}</span>
                </div>
            )}

            {/* Configurator Card - 3 Column Layout */}
            <div className="admin-card mb-10 overflow-hidden">
                <div className="bg-indigo-500 border-b border-indigo-100 px-6 py-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Plus size={16} />
                        New Operational Rule
                    </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Scope */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                                <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                                Target Scope
                            </div>
                            <div className="space-y-4">
                                <div className="admin-form-group">
                                    <label>Select Route</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            className="admin-select w-full pl-9"
                                            value={formData.routeId}
                                            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Select Target --</option>
                                            <option value="all">🌐 All Routes (Global)</option>
                                            {routes.map(r => <option key={r._id} value={r._id}>{r.routeName}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="admin-form-group">
                                    <label>Override Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="date"
                                            className="admin-input w-full pl-9"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                                <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">2</span>
                                Rule Config
                            </div>
                            <div className="space-y-6">
                                <div className="admin-form-group">
                                    <label>Action Type</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mode: 'enable' })}
                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${formData.mode === 'enable' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <CheckCircle2 size={14} />
                                            Enable
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mode: 'disable' })}
                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${formData.mode === 'disable' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <XCircle size={14} />
                                            Block
                                        </button>
                                    </div>
                                </div>
                                <div className="admin-form-group">
                                    <label>Apply to Shifts</label>
                                    <div className="flex gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={formData.allowedShifts.includes('morning')}
                                                onChange={() => handleShiftToggle('morning')}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">Morning</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={formData.allowedShifts.includes('afternoon')}
                                                onChange={() => handleShiftToggle('afternoon')}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">Afternoon</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Documentation */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                                <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">3</span>
                                Confirmation
                            </div>
                            <div className="space-y-4">
                                <div className="admin-form-group">
                                    <label>Reason / Note</label>
                                    <textarea
                                        className="admin-input w-full min-h-[90px] py-3"
                                        placeholder="e.g. National Holiday, Special Convocation Event..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || formData.allowedShifts.length === 0 || !formData.date || !formData.routeId}
                                    className="admin-btn admin-btn-primary w-full justify-center h-[46px] disabled:opacity-50"
                                >
                                    {submitting ? 'Updating System...' : (formData.mode === 'enable' ? 'Set Active Rule' : 'Set Blocking Rule')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Active Rules List */}
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={20} className="text-indigo-600" />
                Active Overrides
            </h3>

            <div className="admin-table-container">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Schedule</th>
                                <th>Route / Scope</th>
                                <th>Shifts</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exceptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400">
                                        No active operational overrides found.
                                    </td>
                                </tr>
                            ) : (
                                exceptions.map((rule) => {
                                    const date = new Date(rule.date);
                                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                                    return (
                                        <tr key={rule._id} className={isPast ? 'opacity-50' : ''}>
                                            <td>
                                                <span className={`admin-badge ${rule.mode === 'enable' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                                                    {rule.mode === 'enable' ? 'Enabled' : 'Blocked'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="font-semibold text-slate-900 text-sm">{date.toLocaleDateString()}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400">{date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                                            </td>
                                            <td>
                                                {rule.route ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-700">{rule.route.routeName}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-2 py-1 rounded w-fit">
                                                        <Globe size={14} />
                                                        <span className="text-[10px] font-bold uppercase">All Routes</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    {rule.allowedShifts.map(s => (
                                                        <span key={s} className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <p className="text-xs text-slate-500 max-w-[200px] truncate" title={rule.reason}>
                                                    {rule.reason || <span className="italic">No reason provided</span>}
                                                </p>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(rule._id)}
                                                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                    title="Remove Rule"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
