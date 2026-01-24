import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../../services/api';

export default function ProfileChanges() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingId, setRejectingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await admin.getProfileChangeRequests();
            setRequests(response.data);
        } catch (err) {
            setError('Failed to load change requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (studentId) => {
        try {
            await admin.approveProfileChange(studentId);
            setSuccess('Profile change approved successfully!');
            fetchRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve change');
        }
    };

    const handleReject = async (studentId) => {
        if (!rejectionReason.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        try {
            await admin.rejectProfileChange(studentId, { rejectionReason });
            setSuccess('Profile change rejected');
            setRejectingId(null);
            setRejectionReason('');
            fetchRequests();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject change');
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/admin')} className="back-button">← Back</button>
                <h1>Profile Change Requests</h1>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {loading ? (
                <div className="loading">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="card modern-card">
                    <p>No pending profile change requests</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {requests.map(request => (
                        <div key={request.studentId} className="card modern-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <div>
                                    <h3>{request.studentName}</h3>
                                    <p style={{ color: '#666' }}>Enrollment: {request.enrollmentNumber}</p>
                                </div>
                                <span style={{ padding: '8px 16px', background: '#fff3cd', borderRadius: '20px', fontWeight: '600', color: '#856404' }}>
                                    Pending Review
                                </span>
                            </div>

                            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                <strong>Reason for Change:</strong>
                                <p style={{ marginTop: '8px', color: '#374151' }}>{request.reason}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                {Object.keys(request.requestedChanges).map(field => (
                                    <div key={field} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', textTransform: 'capitalize' }}>
                                            {field.replace(/([A-Z])/g, ' $1')}
                                        </strong>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <span style={{ color: '#dc3545', textDecoration: 'line-through' }}>
                                                {request.currentData[field] || 'N/A'}
                                            </span>
                                            <span style={{ margin: '0 8px' }}>→</span>
                                            <span style={{ color: '#28a745', fontWeight: '600' }}>
                                                {request.requestedChanges[field]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {rejectingId === request.studentId ? (
                                <div>
                                    <textarea
                                        placeholder="Enter reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows="3"
                                        style={{ width: '100%', marginBottom: '10px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="primary-btn" style={{ background: '#dc3545' }} onClick={() => handleReject(request.studentId)}>
                                            Confirm Rejection
                                        </button>
                                        <button className="secondary-btn" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="primary-btn" onClick={() => handleApprove(request.studentId)}>
                                        ✓ Approve Changes
                                    </button>
                                    <button className="secondary-btn" style={{ background: '#dc3545', color: 'white' }} onClick={() => setRejectingId(request.studentId)}>
                                        ✗ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
