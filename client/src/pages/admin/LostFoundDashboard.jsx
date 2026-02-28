import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PackageSearch, Package, CheckCircle, FileSearch,
    MapPin, Calendar, Clock, BarChart3, AlertCircle
} from 'lucide-react';
import { lostFound } from '../../services/api';
import '../../styles/admin.css';

const CATEGORY_ICONS = {
    id_card: '🪪', bag: '🎒', electronics: '📱',
    clothing: '👕', documents: '📄', water_bottle: '🍶', other: '📦'
};
const CATEGORY_LABELS = {
    id_card: 'ID Card', bag: 'Bag', electronics: 'Electronics',
    clothing: 'Clothing', documents: 'Documents', water_bottle: 'Water Bottle', other: 'Other'
};

const STATUS_STYLES = {
    ACTIVE: 'admin-badge admin-badge-primary',
    ADMIN_FOUND: 'admin-badge admin-badge-warning',
    RESOLVED: 'admin-badge admin-badge-success',
};

export default function LostFoundDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('found');
    const [items, setItems] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [toast, setToast] = useState('');
    const [actionModal, setActionModal] = useState(null);
    // Types: 'resolve_item', 'mark_report_found', 'resolve_report'

    // Action Modal state
    const [handoverTo, setHandoverTo] = useState('');
    const [foundBy, setFoundBy] = useState('');
    const [location, setLocation] = useState('');
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Report Found Item Modal state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        itemName: '', category: 'other', description: '',
        foundDate: new Date().toISOString().split('T')[0],
        storageLocation: { location: 'Depot', rack: '', box: '' }
    });
    const [imageFile, setImageFile] = useState(null);
    const [reportProcessing, setReportProcessing] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [itemsRes, reportsRes] = await Promise.all([
                lostFound.getAllItemsList(),
                lostFound.getAllReportsList()
            ]);
            setItems(itemsRes.data || []);
            setReports(reportsRes.data || []);
        } catch (err) {
            console.error('LostFound dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const resetModal = () => {
        setActionModal(null);
        setHandoverTo('');
        setFoundBy('');
        setLocation('');
        setNote('');
    };

    const handleConfirmAction = async () => {
        if (!actionModal) return;
        setProcessing(true);
        try {
            if (actionModal.type === 'resolve_item') {
                if (!handoverTo.trim()) {
                    showToast('❌ Please specify who the item is handed over to');
                    return;
                }
                await lostFound.resolveItem(actionModal.id, { handoverTo, note });
                showToast('✅ Found Item marked as resolved (handed over)');
            }
            else if (actionModal.type === 'mark_report_found') {
                if (!foundBy.trim()) {
                    showToast('❌ Please specify who found the item');
                    return;
                }
                await lostFound.markReportFound(actionModal.id, { foundBy, location, note });
                showToast('✅ Lost Report marked as found at depot');
            }
            else if (actionModal.type === 'resolve_report') {
                if (!handoverTo.trim()) {
                    showToast('❌ Please specify who collected the item');
                    return;
                }
                await lostFound.resolveReport(actionModal.id, { handoverTo, note });
                showToast('✅ Lost Report marked as resolved (handed over)');
            }
            fetchAll();
            resetModal();
        } catch (error) {
            showToast('❌ Failed to process action');
        } finally {
            setProcessing(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ Image size must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setImageFile(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleReportFoundSubmit = async (e) => {
        e.preventDefault();
        setReportProcessing(true);
        try {
            const finalData = { ...reportForm, imageBase64: imageFile };
            await lostFound.reportFoundItem(finalData);
            showToast('✅ Item reported and added to board');
            setShowReportModal(false);
            setReportForm({
                itemName: '', category: 'other', description: '',
                foundDate: new Date().toISOString().split('T')[0],
                storageLocation: { location: 'Depot', rack: '', box: '' }
            });
            setImageFile(null);
            fetchAll();
        } catch (err) {
            showToast('❌ Failed to report item');
            console.error('Report error', err);
        } finally {
            setReportProcessing(false);
        }
    };

    const filteredItems = filterStatus ? items.filter(i => i.status === filterStatus) : items;
    const filteredReports = filterStatus ? reports.filter(r => r.status === filterStatus) : reports;

    const activeItemsCount = items.filter(i => i.status === 'ACTIVE').length;
    const activeReportsCount = reports.filter(r => r.status === 'ACTIVE' || r.status === 'ADMIN_FOUND').length;

    const kpiCards = [
        { label: 'Active Found Items', value: activeItemsCount, icon: Package, border: 'border-blue', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Lost Reports', value: activeReportsCount, icon: FileSearch, border: 'border-orange', color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Total Resolved (All)', value: items.filter(i => i.status === 'RESOLVED').length + reports.filter(r => r.status === 'RESOLVED').length, icon: CheckCircle, border: 'border-green', color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="admin-dashboard-wrapper">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: '#1e293b', color: 'white', padding: '12px 20px',
                    borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: '320px'
                }}>
                    {toast}
                </div>
            )}

            {/* Action Modal */}
            {actionModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '12px' }}>
                            {actionModal.type === 'resolve_item' ? '🤝 Handover Found Item' :
                                actionModal.type === 'mark_report_found' ? '📦 Mark Lost Item as Secured' :
                                    '🤝 Handover Lost Item'}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                            {actionModal.type === 'resolve_item' ? 'Record the details of the person collecting this item. It will be removed from the public board.' :
                                actionModal.type === 'mark_report_found' ? 'Record how this item was secured. The student will be notified it is safe at the depot.' :
                                    'Record the details of the person collecting this item. It will be marked resolved and removed from the public board.'}
                        </p>

                        {(actionModal.type === 'resolve_item' || actionModal.type === 'resolve_report') && (
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                    Handed Over To (Name/ID) *
                                </label>
                                <input
                                    type="text"
                                    value={handoverTo}
                                    onChange={e => setHandoverTo(e.target.value)}
                                    placeholder="e.g. John Doe (Enrollment 123456)"
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}

                        {actionModal.type === 'mark_report_found' && (
                            <>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                        Found By (Name/Role) *
                                    </label>
                                    <input
                                        type="text"
                                        value={foundBy}
                                        onChange={e => setFoundBy(e.target.value)}
                                        placeholder="e.g. Driver Ramesh"
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                        Current Location *
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="e.g. Depot Admin Office Rack A"
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
                                Admin Note (optional)
                            </label>
                            <textarea
                                rows={3}
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Add any additional remarks..."
                                className="admin-input"
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={resetModal}
                                className="admin-btn admin-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={processing}
                                onClick={handleConfirmAction}
                                className="admin-btn admin-btn-primary"
                            >
                                {processing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <header className="page-header-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-hero-box" style={{ flex: 1 }}>
                    <div>
                        <h1>Community Noticeboard Admin</h1>
                        <p className="text-amber-400">Manage found items at the depot and monitor student lost reports</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="admin-btn admin-btn-primary"
                    style={{ marginLeft: '1rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                    <PackageSearch size={18} />
                    Report Found Item
                </button>
            </header>

            {/* Report Found Item Modal */}
            {showReportModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '16px' }}>
                            Report a Found Item
                        </h3>
                        <form onSubmit={handleReportFoundSubmit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label className="admin-label">Item Name *</label>
                                <input
                                    required type="text" className="admin-input"
                                    value={reportForm.itemName}
                                    onChange={e => setReportForm({ ...reportForm, itemName: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <div>
                                    <label className="admin-label">Category *</label>
                                    <select
                                        className="admin-input"
                                        value={reportForm.category}
                                        onChange={e => setReportForm({ ...reportForm, category: e.target.value })}
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{CATEGORY_ICONS[val]} {label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="admin-label">Date Found *</label>
                                    <input
                                        required type="date" className="admin-input"
                                        value={reportForm.foundDate} max={new Date().toISOString().split('T')[0]}
                                        onChange={e => setReportForm({ ...reportForm, foundDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label className="admin-label">Description / Identifying Details *</label>
                                <textarea
                                    required rows="3" className="admin-input" style={{ resize: 'vertical' }}
                                    value={reportForm.description}
                                    onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <label className="admin-label">Photo Evidence (Optional)</label>
                                <input
                                    type="file" accept="image/*" className="admin-input"
                                    onChange={handleImageChange} style={{ padding: '8px' }}
                                />
                                {imageFile && <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#059669' }}>Image attached successfully</div>}
                            </div>

                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px' }}>
                                <label className="admin-label" style={{ marginBottom: '12px' }}>Storage Location at Depot</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <input type="text" placeholder="Location (e.g. Main Office)" className="admin-input" value={reportForm.storageLocation.location} onChange={e => setReportForm({ ...reportForm, storageLocation: { ...reportForm.storageLocation, location: e.target.value } })} />
                                    <input type="text" placeholder="Rack" className="admin-input" value={reportForm.storageLocation.rack} onChange={e => setReportForm({ ...reportForm, storageLocation: { ...reportForm.storageLocation, rack: e.target.value } })} />
                                    <input type="text" placeholder="Box" className="admin-input" value={reportForm.storageLocation.box} onChange={e => setReportForm({ ...reportForm, storageLocation: { ...reportForm.storageLocation, box: e.target.value } })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowReportModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                                <button type="submit" disabled={reportProcessing} className="admin-btn admin-btn-primary">
                                    {reportProcessing ? 'Processing...' : 'Post to Noticeboard'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="admin-grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {kpiCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className={`admin-stat-card ${card.border}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="admin-stat-title">{card.label}</span>
                                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                    <Icon size={18} />
                                </div>
                            </div>
                            <div className="admin-stat-value">{card.value}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs + Filter */}
            <div className="admin-filter-bar" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {['found', 'reports'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setFilterStatus(''); }}
                            style={{
                                padding: '8px 18px', borderRadius: '8px', fontWeight: 600,
                                fontSize: '0.875rem', border: 'none', cursor: 'pointer',
                                background: activeTab === tab ? '#4f46e5' : '#f1f5f9',
                                color: activeTab === tab ? 'white' : '#64748b',
                                transition: 'all 0.15s'
                            }}
                        >
                            {tab === 'found' ? `📦 Found at Depot (${items.length})` : `📄 Student Lost Reports (${reports.length})`}
                        </button>
                    ))}
                </div>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="admin-select"
                >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">ACTIVE (On Board)</option>
                    {activeTab === 'reports' && <option value="ADMIN_FOUND">ADMIN FOUND (At Depot)</option>}
                    <option value="RESOLVED">RESOLVED (Hidden)</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : activeTab === 'found' ? (
                /* FOUND ITEMS TABLE */
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
                                <th>Date / Location</th>
                                <th>Storage / Finder</th>
                                <th>Tracking Info</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '2.5rem' }}>
                                        No items found
                                    </td>
                                </tr>
                            ) : filteredItems.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '38px', height: '38px', borderRadius: '8px',
                                                background: '#f1f5f9', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', overflow: 'hidden', flexShrink: 0
                                            }}>
                                                {item.imageBase64
                                                    ? <img src={item.imageBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <span style={{ fontSize: '1.25rem' }}>{CATEGORY_ICONS[item.category]}</span>
                                                }
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{item.itemName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="bg-slate-100 rounded px-1.5 py-0.5">{CATEGORY_LABELS[item.category] || 'Other'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                            Found: {new Date(item.foundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        {(item.busId || item.routeId) && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                                {item.busId && <span>🚌 {item.busId.busNumber}</span>}
                                                {item.busId && item.routeId && <span> | </span>}
                                                {item.routeId && <span>📍 {item.routeId.routeName}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>
                                            Box: {item.storageLocation?.location || ''} {item.storageLocation?.rack || ''} {item.storageLocation?.box || 'Not stored'}
                                        </div>
                                        {item.foundBy && (
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                                                Finder: {item.foundBy.name} ({item.foundBy.employeeId || 'Student'})
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        {item.status === 'RESOLVED' && item.handoverDetails ? (
                                            <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                                                <div style={{ fontWeight: 600 }}>🤝 Given to: {item.handoverDetails.handoverTo}</div>
                                                {item.handoverDetails.note && <div style={{ color: '#6b7280', marginTop: '2px' }}>Note: {item.handoverDetails.note}</div>}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Awaiting Handover</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={STATUS_STYLES[item.status] || 'admin-badge'}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <button
                                                onClick={() => navigate(`/admin/lost-found/item/found/${item._id}`)}
                                                className="admin-btn admin-btn-secondary"
                                                style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                            >
                                                Chat Thread
                                            </button>
                                            {item.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => setActionModal({ type: 'resolve_item', id: item._id })}
                                                    className="admin-btn admin-btn-success"
                                                    style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                                >
                                                    Handover & Resolve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* LOST REPORTS TABLE */
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Student Poster</th>
                                <th>What They Lost</th>
                                <th>Date / Location</th>
                                <th>Tracking Info</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '2.5rem' }}>
                                        No active reports
                                    </td>
                                </tr>
                            ) : filteredReports.map(report => (
                                <tr key={report._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{report.reportedBy?.name || 'Unknown Student'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Enrollment: {report.reportedBy?.enrollmentNumber || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phone: {report.reportedBy?.mobile || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{CATEGORY_ICONS[report.category] || '📦'}</span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{report.itemName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {report.identifyingDetails?.slice(0, 30) || 'No details'}{report.identifyingDetails?.length > 30 ? '…' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                            Lost: {new Date(report.lostDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        {report.busRouteId && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                                📍 Route: {report.busRouteId.routeName}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ maxWidth: '200px' }}>
                                        {report.status === 'ADMIN_FOUND' && report.adminFoundDetails ? (
                                            <div style={{ fontSize: '0.75rem', color: '#d97706' }}>
                                                <div style={{ fontWeight: 600 }}>Secured By: {report.adminFoundDetails.foundBy}</div>
                                                <div>At: {report.adminFoundDetails.location}</div>
                                                {report.adminFoundDetails.note && <div style={{ color: '#6b7280', marginTop: '2px' }}>Note: {report.adminFoundDetails.note}</div>}
                                            </div>
                                        ) : report.status === 'RESOLVED' && report.handoverDetails ? (
                                            <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                                                <div style={{ fontWeight: 600 }}>🤝 Given to: {report.handoverDetails.handoverTo}</div>
                                                {report.handoverDetails.note && <div style={{ color: '#6b7280', marginTop: '2px' }}>Note: {report.handoverDetails.note}</div>}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No tracking yet</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={STATUS_STYLES[report.status] || 'admin-badge'}>
                                            {report.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <button
                                                onClick={() => navigate(`/admin/lost-found/item/report/${report._id}`)}
                                                className="admin-btn admin-btn-secondary"
                                                style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                            >
                                                Chat Thread
                                            </button>

                                            {report.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => setActionModal({ type: 'mark_report_found', id: report._id })}
                                                    className="admin-btn admin-btn-warning"
                                                    style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                                >
                                                    Mark as Secured
                                                </button>
                                            )}

                                            {(report.status === 'ACTIVE' || report.status === 'ADMIN_FOUND') && (
                                                <button
                                                    onClick={() => setActionModal({ type: 'resolve_report', id: report._id })}
                                                    className="admin-btn admin-btn-success"
                                                    style={{ padding: '6px 10px', fontSize: '0.7rem' }}
                                                >
                                                    Handover & Resolve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
