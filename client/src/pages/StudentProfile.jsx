import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profile } from '../services/api';

export default function StudentProfile() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profileData, setProfileData] = useState(null);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [changeRequest, setChangeRequest] = useState({
        name: false,
        dateOfBirth: false,
        mobile: false,
        email: false,
        department: false,
        year: false
    });
    const [changedValues, setChangedValues] = useState({});
    const [changeReason, setChangeReason] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profile.get();
            setProfileData(response.data);
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('Photo size should be less than 2MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const profilePhoto = reader.result;
                const response = await profile.updatePhoto({ profilePhoto });
                setProfileData(response.data.user);
                updateUser(response.data.user);
                setSuccess('Profile photo uploaded successfully!');
                setTimeout(() => setSuccess(''), 3000);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleRequestChange = async () => {
        const requestedChanges = {};
        Object.keys(changeRequest).forEach(field => {
            if (changeRequest[field] && changedValues[field]) {
                requestedChanges[field] = changedValues[field];
            }
        });

        if (Object.keys(requestedChanges).length === 0) {
            setError('Please select at least one field to change');
            return;
        }

        if (!changeReason.trim()) {
            setError('Please provide a reason for the change');
            return;
        }

        try {
            const response = await profile.requestChange({ requestedChanges, reason: changeReason });
            setProfileData(response.data.user);
            updateUser(response.data.user);
            setShowChangeModal(false);
            setSuccess('Change request submitted successfully! Waiting for admin approval.');
            setChangeRequest({});
            setChangedValues({});
            setChangeReason('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit change request');
        }
    };

    const handleCompleteProfile = async () => {
        if (!profileData.isProfileComplete) {
            setError('Please upload your profile photo first');
            return;
        }

        try {
            const response = await profile.markComplete();
            updateUser(response.data.user);
            setSuccess('Profile completed! Redirecting to dashboard...');
            setTimeout(() => navigate('/student'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete profile');
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    const hasPendingRequest = profileData?.profileChangeRequest?.status === 'pending';
    const hasRejectedRequest = profileData?.profileChangeRequest?.status === 'rejected';

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/student')} className="back-button">← Back</button>
                <h1>Your Profile</h1>
            </div>

            {/* Status Messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Profile Status Banner */}
            {!profileData?.isProfileComplete && (
                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                    <h3>⚠️ Profile Incomplete</h3>
                    <p>Please upload your profile photo to complete your profile.</p>
                </div>
            )}

            {hasPendingRequest && (
                <div className="alert" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', marginBottom: '20px' }}>
                    <h3>⏳ Change Request Pending</h3>
                    <p>Your profile change request is being reviewed by the admin.</p>
                </div>
            )}

            {hasRejectedRequest && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                    <h3>❌ Change Request Rejected</h3>
                    <p><strong>Reason:</strong> {profileData.profileChangeRequest.rejectionReason}</p>
                </div>
            )}

            {/* Profile Photo Section */}
            <div className="info-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3>Profile Photo</h3>
                <div style={{ margin: '20px 0' }}>
                    {profileData?.profilePhoto ? (
                        <img
                            src={profileData.profilePhoto}
                            alt="Profile"
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid #4f46e5'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            background: '#f3f4f6',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '4rem',
                            border: '4px solid #e5e7eb'
                        }}>
                            📷
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    style={{ margin: '10px 0' }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666' }}>
                    {uploading ? 'Uploading...' : 'Max size: 2MB (JPG, PNG)'}
                </p>
            </div>

            {/* Profile Information */}
            <div className="info-card">
                <div className="info-header">
                    <h3>📋 Personal Information</h3>
                    <button
                        className="secondary-btn"
                        onClick={() => setShowChangeModal(true)}
                        disabled={hasPendingRequest}
                    >
                        {hasPendingRequest ? 'Request Pending' : 'Request Change'}
                    </button>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <p style={{ background: '#e8f4fd', padding: '12px', borderRadius: '6px', marginBottom: '20px', color: '#1565c0' }}>
                        ℹ️ <strong>Note:</strong> These details are from university records and cannot be directly edited.
                        If you find any errors, please click "Request Change" to submit a correction request.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={profileData?.name || ''} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" value={formatDate(profileData?.dateOfBirth)} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input type="text" value={profileData?.mobile || ''} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label>Email ID</label>
                            <input type="email" value={profileData?.email || ''} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input type="text" value={profileData?.department || ''} disabled readOnly />
                        </div>
                        <div className="form-group">
                            <label>Year of Study</label>
                            <input type="text" value={profileData?.year ? `${profileData.year} Year` : ''} disabled readOnly />
                        </div>
                    </div>
                </div>
            </div>

            {/* Complete Profile Button */}
            {profileData?.isProfileComplete && !profileData?.hasCompletedProfileOnce && (
                <button
                    className="primary-btn"
                    onClick={handleCompleteProfile}
                    style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '1.1rem' }}
                >
                    ✓ Continue to Dashboard
                </button>
            )}

            {/* Change Request Modal */}
            {showChangeModal && (
                <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                        <h2>Request Profile Change</h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Select the fields you want to change and provide correct values
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            {['name', 'dateOfBirth', 'mobile', 'email', 'department', 'year'].map(field => (
                                <div key={field} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={changeRequest[field] || false}
                                            onChange={(e) => setChangeRequest({ ...changeRequest, [field]: e.target.checked })}
                                            style={{ marginRight: '10px', width: 'auto' }}
                                        />
                                        <strong>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</strong>
                                    </label>
                                    {changeRequest[field] && (
                                        <input
                                            type={field === 'dateOfBirth' ? 'date' : field === 'year' ? 'number' : 'text'}
                                            placeholder={`Enter correct ${field}`}
                                            value={changedValues[field] || ''}
                                            onChange={(e) => setChangedValues({ ...changedValues, [field]: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="form-group">
                            <label>Reason for Change *</label>
                            <textarea
                                value={changeReason}
                                onChange={(e) => setChangeReason(e.target.value)}
                                placeholder="Explain why this information needs to be corrected..."
                                rows="4"
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="primary-btn" onClick={handleRequestChange}>
                                Submit Request
                            </button>
                            <button className="secondary-btn" onClick={() => setShowChangeModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
