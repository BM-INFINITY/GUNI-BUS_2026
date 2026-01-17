import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../services/api';

export default function ApprovedPasses() {
    const navigate = useNavigate();
    const [passesByRoute, setPassesByRoute] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRoutes, setExpandedRoutes] = useState({});
    const [showQR, setShowQR] = useState(null);

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        try {
            const response = await admin.getApprovedPassesByRoute();
            setPassesByRoute(response.data);
            // Expand all routes by default
            const expanded = {};
            response.data.forEach((_, index) => { expanded[index] = true; });
            setExpandedRoutes(expanded);
        } catch (err) {
            setError('Failed to load approved passes');
        } finally {
            setLoading(false);
        }
    };

    const toggleRoute = (index) => {
        setExpandedRoutes({ ...expandedRoutes, [index]: !expandedRoutes[index] });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                <h1>Approved Bus Passes</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading">Loading approved passes...</div>
            ) : passesByRoute.length === 0 ? (
                <div className="card modern-card">
                    <p>No approved passes yet</p>
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
                                    <span style={{ padding: '8px 16px', background: '#d4edda', borderRadius: '20px', fontWeight: '600', color: '#155724' }}>
                                        {routeData.approvedCount} Approved
                                    </span>
                                    <span style={{ fontSize: '1.5rem' }}>{expandedRoutes[index] ? '▼' : '▶'}</span>
                                </div>
                            </div>

                            {expandedRoutes[index] && (
                                <div style={{ marginTop: '20px' }}>
                                    {routeData.passes.map(pass => (
                                        <div key={pass._id} style={{ padding: '15px', border: '1px solid #d4edda', borderRadius: '8px', marginBottom: '10px', background: '#f8fff9' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '15px', alignItems: 'center' }}>
                                                <div>
                                                    {pass.userId?.profilePhoto ? (
                                                        <img src={pass.userId.profilePhoto} alt="Student" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{pass.studentName}</strong>
                                                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>
                                                        Ref: {pass.referenceNumber} | {pass.enrollmentNumber}
                                                    </p>
                                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                                        {pass.department} | Year {pass.year}
                                                    </p>
                                                    <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                                                        <strong>Stop:</strong> {pass.selectedStop} | <strong>Shift:</strong> {pass.shift === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                                                    </p>
                                                    <p style={{ fontSize: '0.85rem', color: '#28a745', marginTop: '5px' }}>
                                                        ✓ Approved on {new Date(pass.approvedAt).toLocaleDateString()} | Valid until {new Date(pass.validUntil).toLocaleDateString()}
                                                    </p>
                                                    <p style={{ fontSize: '0.85rem', color: '#444' }}>
  <strong>Amount:</strong> ₹{pass.amount}
</p>

<p style={{ fontSize: '0.85rem', color: '#444' }}>
  <strong>Payment Status:</strong> {pass.paymentStatus}
</p>

{pass.razorpayOrderId && (
  <p style={{ fontSize: '0.8rem', color: '#666' }}>
    <strong>Order ID:</strong> {pass.razorpayOrderId}
  </p>
)}

{pass.razorpayPaymentId && (
  <p style={{ fontSize: '0.8rem', color: '#666' }}>
    <strong>Payment ID:</strong> {pass.razorpayPaymentId}
  </p>
)}

                                                </div>
                                                <div>
                                                    <button
                                                        className="secondary-btn"
                                                        onClick={() => setShowQR(pass.qrCode)}
                                                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                                    >
                                                        📱 View QR
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

            {/* QR Code Modal */}
            {showQR && (
                <div className="modal-overlay" onClick={() => setShowQR(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h2>Pass QR Code</h2>
                        <img src={showQR} alt="QR Code" style={{ width: '300px', height: '300px', margin: '20px auto' }} />
                        <button className="secondary-btn" onClick={() => setShowQR(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
