import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../services/api';

export default function PendingPasses() {
    const navigate = useNavigate();
    const [passesByRoute, setPassesByRoute] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedRoutes, setExpandedRoutes] = useState({});

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        try {
            const response = await admin.getPendingPassesByRoute();
            setPassesByRoute(response.data);
            // Expand all routes by default
            const expanded = {};
            response.data.forEach((_, index) => { expanded[index] = true; });
            setExpandedRoutes(expanded);
        } catch (err) {
            setError('Failed to load pending passes');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (passId) => {
        try {
            await admin.approvePass(passId);
            setSuccess('Pass approved successfully!');
            fetchPasses();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve pass');
        }
    };

    const handleReject = async (passId) => {
        const reason = prompt('Enter reason for rejection:');
        if (!reason) return;

        try {
            await admin.rejectPass(passId, { rejectionReason: reason });
            setSuccess('Pass rejected');
            fetchPasses();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject pass');
        }
    };

    const toggleRoute = (index) => {
        setExpandedRoutes({ ...expandedRoutes, [index]: !expandedRoutes[index] });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                <h1>Pending Pass Applications</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {loading ? (
                <div className="loading">Loading pending passes...</div>
            ) : passesByRoute.length === 0 ? (
                <div className="card modern-card">
                    <p>No pending pass applications</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {passesByRoute.map((routeData, index) => (
                        <div key={index} className="card modern-card">
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => toggleRoute(index)}
                            >
                                <div>
                                    <h3>🚌 {routeData.route.routeName} ({routeData.route.routeNumber})</h3>
                                    <p style={{ color: '#666' }}>{routeData.route.startPoint} → {routeData.route.endPoint}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ padding: '8px 16px', background: '#fff3cd', borderRadius: '20px', fontWeight: '600', color: '#856404' }}>
                                        {routeData.pendingCount} Pending
                                    </span>
                                    <span style={{ fontSize: '1.5rem' }}>{expandedRoutes[index] ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {expandedRoutes[index] && (
                                <div style={{ marginTop: '20px' }}>
                                    {routeData.applications.map(pass => (
                                        <div key={pass._id} style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '15px', alignItems: 'center' }}>
                                                <div>
                                                    {pass.studentPhoto ? (
                                                        <img src={pass.studentPhoto} alt="Student" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{pass.studentName}</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>
                                                        {pass.enrollmentNumber} | {pass.department} | Year {pass.year}
                                                    </p>
                                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                                        📱 {pass.mobile} | 📧 {pass.email}
                                                    </p>
                                                    <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                                                        <strong>Stop:</strong> {pass.selectedStop} | <strong>Shift:</strong> {pass.shift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                                                    </p>
                                                    <p style={{ fontSize: '0.85rem', color: '#999' }}>
                                                        Applied: {new Date(pass.applicationDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <button className="primary-btn" onClick={() => handleApprove(pass._id)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                                        ✓ Approve
                                                    </button>
                                                    <button className="secondary-btn" onClick={() => handleReject(pass._id)} style={{ padding: '8px 16px', fontSize: '0.9rem', background: '#dc3545', color: 'white' }}>
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
