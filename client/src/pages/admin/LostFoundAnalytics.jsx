import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Package, TrendingUp, MapPin } from 'lucide-react';
import { lostFound } from '../../services/api';
import '../../styles/admin.css';

const CATEGORY_LABELS = {
    id_card: 'ID Card', bag: 'Bag', electronics: 'Electronics',
    clothing: 'Clothing', documents: 'Documents', water_bottle: 'Water Bottle', other: 'Other'
};
const CATEGORY_ICONS = {
    id_card: '🪪', bag: '🎒', electronics: '📱',
    clothing: '👕', documents: '📄', water_bottle: '🍶', other: '📦'
};
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LostFoundAnalytics() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        lostFound.getAnalytics()
            .then(r => setData(r.data))
            .catch(err => console.error('Analytics error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ padding: '5rem' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const summary = data?.summary || {};
    const categories = data?.categoryBreakdown || [];
    const routes = data?.routeBreakdown || [];
    const monthly = data?.monthlyTrend || [];

    const maxCatCount = Math.max(...categories.map(c => c.count), 1);
    const maxMonthCount = Math.max(...monthly.map(m => m.found), 1);

    const kpis = [
        { label: 'Total Found', value: summary.totalFound || 0, color: '#4f46e5', bg: '#eef2ff', icon: '📦' },
        { label: 'Returned', value: summary.totalHandedOver || 0, color: '#16a34a', bg: '#dcfce7', icon: '✅' },
        { label: 'Pending Claims', value: summary.totalPendingClaims || 0, color: '#d97706', bg: '#fef3c7', icon: '⏳' },
        { label: 'Recovery Rate', value: `${summary.recoveryRate || 0}%`, color: '#7c3aed', bg: '#f5f3ff', icon: '📈' },
    ];

    return (
        <div className="admin-dashboard-wrapper">
            {/* Back */}
            <button
                onClick={() => navigate('/admin/lost-found')}
                className="admin-back-btn"
                style={{ marginBottom: '1rem' }}
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <header className="page-header-premium">
                <div className="header-hero-box">
                    <div>
                        <h1>Lost &amp; Found Analytics</h1>
                        <p className="text-amber-400">Recovery trends and item statistics</p>
                    </div>
                </div>
            </header>

            {/* KPI Row */}
            <div className="admin-grid-stats">
                {kpis.map((k, i) => (
                    <div key={i} className="admin-stat-card" style={{ borderBottom: `4px solid ${k.color}` }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="admin-stat-title">{k.label}</span>
                            <div style={{ background: k.bg, borderRadius: '8px', padding: '6px 10px', fontSize: '1.25rem' }}>
                                {k.icon}
                            </div>
                        </div>
                        <div className="admin-stat-value">{k.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0' }}>

                {/* Category Breakdown */}
                <div className="admin-table-container" style={{ gridColumn: categories.length === 0 ? '1 / -1' : 'auto' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} style={{ color: '#4f46e5' }} />
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Items by Category</h3>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {categories.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No data yet</p>
                        ) : categories.map((cat, i) => (
                            <div key={i} style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
                                        {CATEGORY_ICONS[cat._id] || '📦'} {CATEGORY_LABELS[cat._id] || cat._id}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>{cat.count}</span>
                                </div>
                                <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(cat.count / maxCatCount) * 100}%`,
                                        background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
                                        height: '100%', borderRadius: '999px',
                                        transition: 'width 0.6s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Route Breakdown */}
                <div className="admin-table-container">
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} style={{ color: '#4f46e5' }} />
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Top Routes (Most Lost Items)</h3>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {routes.length === 0 ? (
                            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No route data yet</p>
                        ) : routes.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px 0', borderBottom: i < routes.length - 1 ? '1px solid #f1f5f9' : 'none'
                            }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: '#eef2ff', color: '#4f46e5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                                        {r.routeNumber ? `${r.routeNumber} –` : ''} {r.routeName || 'Unknown Route'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.count} items found</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Trend */}
                {monthly.length > 0 && (
                    <div className="admin-table-container" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} style={{ color: '#4f46e5' }} />
                            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Monthly Trend — Found vs Returned</h3>
                        </div>
                        <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', minWidth: `${monthly.length * 80}px`, height: '160px' }}>
                                {monthly.map((m, i) => {
                                    const foundH = Math.round((m.found / maxMonthCount) * 130);
                                    const handedH = Math.round(((m.handedOver || 0) / maxMonthCount) * 130);
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '130px' }}>
                                                <div title={`Found: ${m.found}`} style={{
                                                    width: '20px', height: `${foundH}px`, minHeight: '4px',
                                                    background: '#4f46e5', borderRadius: '4px 4px 0 0'
                                                }} />
                                                <div title={`Returned: ${m.handedOver}`} style={{
                                                    width: '20px', height: `${handedH}px`, minHeight: '4px',
                                                    background: '#16a34a', borderRadius: '4px 4px 0 0'
                                                }} />
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {MONTH_NAMES[(m._id?.month || 1) - 1]}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{m._id?.year}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#374151' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#4f46e5', borderRadius: '2px' }} />
                                    Found
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#374151' }}>
                                    <div style={{ width: '12px', height: '12px', background: '#16a34a', borderRadius: '2px' }} />
                                    Returned
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
