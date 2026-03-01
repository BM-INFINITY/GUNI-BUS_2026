import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaints } from '../../services/api';
import {
    AlertTriangle, ArrowLeft, Send, Bus, RefreshCw,
    Calendar, Sun, Sunset, Camera, ChevronDown
} from 'lucide-react';

const CATEGORIES = [
    { value: 'bus_late_no_show', label: '🚌 Bus Late / No-Show', desc: 'Bus arrived late or didn\'t come at all' },
    { value: 'driver_behaviour', label: '👤 Driver Behaviour', desc: 'Rude attitude, rash driving, refused to stop' },
    { value: 'bus_condition', label: '🪑 Bus Condition', desc: 'Broken seats, no AC, dirty, overcrowded' },
    { value: 'route_deviation', label: '🗺️ Route Deviation', desc: 'Bus skipped a stop or took wrong route' },
    { value: 'qr_pass_issue', label: '📱 QR / Pass Issue', desc: 'Pass not scanning, QR rejected wrongly' },
    { value: 'overcharging', label: '💰 Overcharging', desc: 'Charged higher than official fare' },
    { value: 'safety_concern', label: '🚨 Safety Concern', desc: 'Unsafe driving, harassment, emergency' },
    { value: 'stop_issue', label: '📍 Stop Issue', desc: 'Bus didn\'t stop at designated pickup point' },
    { value: 'other', label: '📝 Other', desc: 'Anything not covered above' },
];

export default function RaiseComplaint() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        category: '', title: '', description: '',
        incidentDate: '', shift: '', photo: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { setError('Photo must be under 2 MB'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => set('photo', ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.title.trim() || !form.description.trim()) {
            setError('Please fill category, title and description.'); return;
        }
        setSubmitting(true); setError('');
        try {
            const res = await complaints.submit(form);
            setSuccess(res.data.complaint);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally { setSubmitting(false); }
    };

    if (success) return (
        <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">✅</div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Complaint Submitted!</h2>
                <p className="text-slate-500 mb-4">Your reference number is:</p>
                <div className="font-mono text-indigo-700 font-extrabold text-xl bg-indigo-50 rounded-xl px-6 py-3 mb-6 inline-block">
                    {success.referenceNumber}
                </div>
                <p className="text-sm text-slate-400 mb-8">Save this for tracking. We'll review it within 48 hours.</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate('/student/my-complaints')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        Track My Complaints
                    </button>
                    <button onClick={() => { setSuccess(null); setForm({ category: '', title: '', description: '', incidentDate: '', shift: '', photo: '' }); }}
                        className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        Raise Another
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/student')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Raise a Complaint</h1>
                    <p className="text-sm text-slate-400">We'll respond within 48 hours</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Complaint Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CATEGORIES.map(c => (
                            <button key={c.value} type="button"
                                onClick={() => set('category', c.value)}
                                className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm
                                    ${form.category === c.value
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                <div className="font-bold text-slate-800">{c.label}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">{c.desc}</div>
                            </button>
                        ))}
                    </div>
                    {form.category === 'safety_concern' && (
                        <div className="mt-3 flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-2 rounded-xl">
                            <AlertTriangle size={16} /> Safety complaints are marked URGENT and escalated immediately.
                        </div>
                    )}
                </div>

                {/* Title & Description */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Brief Title <span className="text-rose-500">*</span>
                        </label>
                        <input type="text" value={form.title} maxLength={120}
                            onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Bus didn't arrive at Stop 3 on 28 Feb"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Detailed Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            rows={5} maxLength={2000}
                            placeholder="Describe exactly what happened, time, location, driver name if known..."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                        <div className="text-right text-[10px] text-slate-400 mt-1">{form.description.length}/2000</div>
                    </div>
                </div>

                {/* Optional context */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Incident Details (optional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input type="date" value={form.incidentDate} max={new Date().toISOString().split('T')[0]}
                                onChange={e => set('incidentDate', e.target.value)}
                                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <select value={form.shift} onChange={e => set('shift', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                            <option value="">Select Shift</option>
                            <option value="morning">☀️ Morning</option>
                            <option value="afternoon">🌅 Afternoon / Evening</option>
                        </select>
                    </div>

                    {/* Photo upload */}
                    <div className="mt-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Attach Photo (optional, max 2 MB)
                        </label>
                        {form.photo ? (
                            <div className="relative inline-block">
                                <img src={form.photo} alt="Preview" className="h-28 rounded-xl object-cover border border-slate-200" />
                                <button type="button" onClick={() => set('photo', '')}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full text-xs font-bold flex items-center justify-center">✕</button>
                            </div>
                        ) : (
                            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm font-medium">
                                <Camera size={16} /> Upload Photo
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors text-base">
                    {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting…' : 'Submit Complaint'}
                </button>
            </form>
        </div>
    );
}
