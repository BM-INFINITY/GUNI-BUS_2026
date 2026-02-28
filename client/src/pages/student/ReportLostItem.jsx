import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileSearch, Calendar, MapPin, CheckCircle,
    AlertCircle, Loader2, Tag
} from 'lucide-react';
import { admin, lostFound } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';

const CATEGORIES = [
    { value: 'id_card', label: 'ID Card', icon: '🪪' },
    { value: 'bag', label: 'Bag', icon: '🎒' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'documents', label: 'Documents', icon: '📄' },
    { value: 'water_bottle', label: 'Water Bottle', icon: '🍶' },
    { value: 'other', label: 'Other', icon: '📦' }
];

export default function ReportLostItem() {
    const navigate = useNavigate();
    const [routesList, setRoutesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        itemName: '',
        category: '',
        description: '',
        lostDate: '',
        busRouteId: '',
        identifyingDetails: '',
        ownershipProof: ''
    });

    useEffect(() => {
        admin.getRoutes()
            .then(r => setRoutesList(r.data || []))
            .catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.itemName || !form.category || !form.lostDate || !form.identifyingDetails || !form.description) {
            setError('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            await lostFound.reportLostItem({
                itemName: form.itemName,
                category: form.category,
                description: form.description,
                lostDate: form.lostDate,
                busRouteId: form.busRouteId || undefined,
                identifyingDetails: form.identifyingDetails
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <StudentLayout>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto text-center py-16"
                >
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Registered!</h2>
                    <p className="text-slate-500 mb-6">
                        Your lost item report has been noted. If a matching found item is logged by a driver, it will appear in <span className="font-semibold text-indigo-600">Browse Found Items</span>. Check back regularly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/student/lost-and-found')}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
                        >
                            Browse Found Items
                        </button>
                        <button
                            onClick={() => { setSubmitted(false); setForm({ itemName: '', category: '', description: '', lostDate: '', busRouteId: '', identifyingDetails: '', ownershipProof: '' }); }}
                            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition-colors"
                        >
                            Report Another
                        </button>
                    </div>
                </motion.div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <button
                onClick={() => navigate('/student/lost-and-found')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Lost &amp; Found
            </button>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="mb-6">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileSearch className="w-5 h-5 text-indigo-600" />
                            Report a Lost Item
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Register your loss so admins can match it with found items reported by drivers.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Blue Water Bottle"
                                    value={form.itemName}
                                    onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                                >
                                    <option value="">Select category</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Colour, brand, size, notable features..."
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none"
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar className="inline w-4 h-4 mr-1 text-indigo-400" />
                                    Date Lost <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    value={form.lostDate}
                                    onChange={e => setForm(f => ({ ...f, lostDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    <MapPin className="inline w-4 h-4 mr-1 text-indigo-400" />
                                    Route <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <select
                                    value={form.busRouteId}
                                    onChange={e => setForm(f => ({ ...f, busRouteId: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                                >
                                    <option value="">Select route</option>
                                    {routesList.map(r => (
                                        <option key={r._id} value={r._id}>{r.routeNumber} – {r.routeName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                <Tag className="inline w-4 h-4 mr-1 text-indigo-400" />
                                Unique identifying details <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. my name is written inside, sticker on the cover, model number..."
                                value={form.identifyingDetails}
                                onChange={e => setForm(f => ({ ...f, identifyingDetails: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                            {loading ? 'Submitting...' : 'Submit Lost Report'}
                        </button>
                    </form>
                </div>
            </div>
        </StudentLayout>
    );
}
