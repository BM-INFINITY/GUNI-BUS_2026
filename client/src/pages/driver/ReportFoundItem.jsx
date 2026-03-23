import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lostFound } from '../../services/api';

const CATEGORIES = [
    { value: 'id_card', label: 'ID Card', icon: '🪪' },
    { value: 'bag', label: 'Bag', icon: '🎒' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'documents', label: 'Documents', icon: '📄' },
    { value: 'water_bottle', label: 'Water Bottle', icon: '🍶' },
    { value: 'other', label: 'Other', icon: '📦' }
];

export default function ReportFoundItem() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        itemName: '',
        category: '',
        description: '',
        foundDate: today,
        imageBase64: '',
        storageLocation: { location: '', rack: '', box: '' }
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be less than 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(f => ({ ...f, imageBase64: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.itemName || !form.category || !form.description || !form.foundDate) {
            setError('Please fill all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            await lostFound.reportFoundItem({
                itemName: form.itemName,
                category: form.category,
                description: form.description,
                foundDate: form.foundDate,
                imageBase64: form.imageBase64 || null,
                storageLocation: form.storageLocation
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col h-full bg-slate-50 w-full max-w-lg mx-auto pb-8 p-4">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center mt-6">
                    <div className="text-6xl mb-4 bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center">
                        ✅
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Item Logged Successfully</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        The found item has been recorded and will be visible to students. Thank you!
                    </p>
                    <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        onClick={() => navigate('/driver')}
                    >
                        <span>🏠</span> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 w-full max-w-lg mx-auto pb-8">
            {/* Header */}
            <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">Report Found Item</h1>
                    </div>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {/* Bus/Route info banner */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-700 flex items-start gap-2 shadow-sm">
                    <span className="font-medium pt-0.5">Bus &amp; Route will be auto-linked from your assignment.</span>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-start gap-2 shadow-sm animate-pulse">
                        <span className="text-lg">⚠️</span>
                        <span className="font-bold pt-0.5">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">

                    {/* Item Name */}
                    <div>
                        <label className="block font-bold text-slate-700 text-sm mb-1.5 uppercase tracking-wide">
                            Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Blue Water Bottle"
                            value={form.itemName}
                            onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block font-bold text-slate-700 text-sm mb-1.5 uppercase tracking-wide">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${form.category === cat.value
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{cat.icon}</div>
                                    <span className={`text-[10px] sm:text-xs text-center leading-tight ${form.category === cat.value ? 'font-bold' : 'font-medium'}`}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-bold text-slate-700 text-sm mb-1.5 uppercase tracking-wide">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Colour, brand, condition, where it was found on the bus..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                        />
                    </div>

                    {/* Date Found */}
                    <div>
                        <label className="block font-bold text-slate-700 text-sm mb-1.5 uppercase tracking-wide">
                            Date Found <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            max={today}
                            value={form.foundDate}
                            onChange={e => setForm(f => ({ ...f, foundDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                        />
                    </div>

                    {/* Storage Location */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="block font-bold text-slate-700 text-sm mb-3 uppercase tracking-wide">
                            Storage Location <span className="text-slate-400 font-medium normal-case">(Optional)</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { key: 'location', placeholder: 'Place (Depot)' },
                                { key: 'rack', placeholder: 'Rack (A)' },
                                { key: 'box', placeholder: 'Box (3)' }
                            ].map(field => (
                                <input
                                    key={field.key}
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={form.storageLocation[field.key]}
                                    onChange={e => setForm(f => ({
                                        ...f,
                                        storageLocation: { ...f.storageLocation, [field.key]: e.target.value }
                                    }))}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium placeholder-slate-400"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block font-bold text-slate-700 text-sm mb-1.5 uppercase tracking-wide">
                            Photo of Item <span className="text-slate-400 font-medium normal-case">(Recommended)</span>
                        </label>
                        <label className={`flex items-center gap-4 border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors ${form.imageBase64 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                            }`}>
                            <div className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100">
                                {form.imageBase64 ? '🖼️' : '📸'}
                            </div>
                            <div>
                                <div className={`font-bold ${form.imageBase64 ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {form.imageBase64 ? 'Photo selected' : 'Tap to take photo'}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">Max 2 MB (Optional)</div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        {form.imageBase64 && (
                            <div className="mt-3 relative inline-block w-full">
                                <img
                                    src={form.imageBase64}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setForm(f => ({ ...f, imageBase64: '' }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-95"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-2 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {submitting ? '⏳ Submitting...' : '✅ Report This Item'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/driver')}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 w-full py-3.5 rounded-xl font-bold transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
