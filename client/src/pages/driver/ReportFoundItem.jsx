import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lostFound } from '../../services/api';
import './DriverDashboard.css';

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
            <div className="driver-dashboard-container">
                <header className="driver-app-header">
                    <div className="header-brand">
                        <div className="brand-logo">🎒</div>
                        <div>
                            <h1>Found Item Reported</h1>
                            <p className="subtitle">University Bus System</p>
                        </div>
                    </div>
                </header>
                <main className="dashboard-content">
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '64px', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                            Item Logged Successfully
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                            The found item has been recorded and will be visible to students. Thank you!
                        </p>
                        <button
                            className="action-card primary"
                            style={{ display: 'inline-flex', maxWidth: '220px', margin: '0 auto' }}
                            onClick={() => navigate('/driver')}
                        >
                            <div className="icon-wrapper">🏠</div>
                            <div className="action-text">
                                <h3>Back to Dashboard</h3>
                            </div>
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="driver-dashboard-container">
            {/* Header */}
            <header className="driver-app-header">
                <div className="header-brand">
                    <div className="brand-logo">🎒</div>
                    <div>
                        <h1>Report Found Item</h1>
                        <p className="subtitle">Log an item found on your bus</p>
                    </div>
                </div>
                <div className="header-profile">
                    <div className="profile-info">
                        <span className="profile-name">{user?.name}</span>
                        <span className="profile-role">Driver</span>
                    </div>
                </div>
            </header>

            <main className="dashboard-content">
                {/* Bus/Route info banner */}
                <div style={{
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>🚌</span>
                    <span>Bus &amp; Route will be auto-linked from your assignment.</span>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: '12px', padding: '12px 16px',
                        marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Item Name */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Item Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Blue Water Bottle"
                            value={form.itemName}
                            onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: '1px solid #d1d5db', borderRadius: '10px',
                                fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Category <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                                    style={{
                                        padding: '10px 8px',
                                        borderRadius: '10px',
                                        border: form.category === cat.value ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                                        background: form.category === cat.value ? '#eef2ff' : '#fff',
                                        color: form.category === cat.value ? '#4338ca' : '#6b7280',
                                        fontWeight: form.category === cat.value ? 700 : 500,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{cat.icon}</div>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Description <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Colour, brand, condition, where it was found on the bus..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: '1px solid #d1d5db', borderRadius: '10px',
                                fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Date Found */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Date Found <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="date"
                            required
                            max={today}
                            value={form.foundDate}
                            onChange={e => setForm(f => ({ ...f, foundDate: e.target.value }))}
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: '1px solid #d1d5db', borderRadius: '10px',
                                fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Storage Location */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Storage Location <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            {[
                                { key: 'location', placeholder: 'Place (e.g. Depot)' },
                                { key: 'rack', placeholder: 'Rack (e.g. A)' },
                                { key: 'box', placeholder: 'Box (e.g. 3)' }
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
                                    style={{
                                        padding: '10px', border: '1px solid #d1d5db',
                                        borderRadius: '8px', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '6px' }}>
                            Photo of Item <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Recommended)</span>
                        </label>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            border: '2px dashed #d1d5db', borderRadius: '12px',
                            padding: '16px', cursor: 'pointer',
                            background: form.imageBase64 ? '#f0fdf4' : '#fafafa'
                        }}>
                            <span style={{ fontSize: '2rem' }}>📸</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
                                    {form.imageBase64 ? '✅ Photo selected' : 'Tap to take / upload photo'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Max 2 MB</div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                        {form.imageBase64 && (
                            <img
                                src={form.imageBase64}
                                alt="Preview"
                                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }}
                            />
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            background: submitting ? '#a5b4fc' : '#4f46e5',
                            color: 'white', border: 'none',
                            padding: '14px', borderRadius: '12px',
                            fontSize: '1rem', fontWeight: 700,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        {submitting ? '⏳ Submitting...' : '✅ Report This Item'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/driver')}
                        style={{
                            background: 'transparent', border: '1px solid #e5e7eb',
                            padding: '12px', borderRadius: '12px',
                            fontSize: '0.9rem', color: '#6b7280', cursor: 'pointer'
                        }}
                    >
                        Cancel — Back to Dashboard
                    </button>
                </form>
            </main>
        </div>
    );
}
