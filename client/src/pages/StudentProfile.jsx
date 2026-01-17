import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profile } from '../services/api';

export default function StudentProfile() {
    const navigate = useNavigate();
    const { updateUser,logout } = useAuth();

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

    // Upload photo
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        setSuccess('');

        // Size validation
        if (file.size > 2 * 1024 * 1024) {
            setError('❌ Image size is too large. Please upload image smaller than 2MB.');
            return;
        }

        // Type validation
        if (!file.type.startsWith('image/')) {
            setError('❌ Please upload a valid image file (JPG, PNG, JPEG).');
            return;
        }

        setUploading(true);

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const response = await profile.updatePhoto({ profilePhoto: reader.result });
                setProfileData(response.data.user);
                updateUser(response.data.user);
                setSuccess('✅ Profile photo uploaded successfully!');
            } catch (err) {
                setError(err.response?.data?.message || '❌ Failed to upload photo');
            } finally {
                setUploading(false);
            }
        };

        reader.readAsDataURL(file);
    };


    // Submit change request
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
            setError('Please provide a reason for correction');
            return;
        }

        try {
            const response = await profile.requestChange({
                requestedChanges,
                reason: changeReason
            });

            setProfileData(response.data.user);
            updateUser(response.data.user);

            setShowChangeModal(false);
            setSuccess('Correction request submitted successfully');
            setChangedValues({});
            setChangeReason('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        }
    };

    // Complete profile
    const handleCompleteProfile = async () => {
        if (!profileData.profilePhoto) {
            setError('Please upload profile photo first');
            return;
        }

        try {
            const response = await profile.markComplete();
            updateUser(response.data.user);
            setSuccess('Profile completed successfully!');
            setTimeout(() => navigate('/student'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to continue');
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    if (loading || !profileData) return <div className="loading">Loading profile...</div>;



    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/student')} className="back-button">← Back</button>
                <h1>Student Profile</h1>
                <button className="secondary-btn" onClick={logout}>Logout</button>
            </div>

            {/* Instructions */}
            <div className="info-card" style={{ background: '#eef6ff', borderLeft: '4px solid #2563eb' }}>
                <h3>📌 Instructions</h3>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    <li>Please verify your university details carefully</li>
                    <li>Upload your profile photo</li>
                    <li>If any detail is incorrect, raise a correction request</li>
                    <li>After verification, continue to dashboard</li>
                </ul>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* University Details Card */}
            <div className="info-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '30px' }}>

                    {/* Left Side - Details */}
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>🎓 University Details</h3>

                        <div className="details-grid">
                            <div>
                                <label>Name</label>
                                <input value={profileData?.name || ''} disabled />
                            </div>

                            <div>
                                <label>Date of Birth</label>
                                <input type="date" value={formatDate(profileData?.dateOfBirth)} disabled />
                            </div>

                            <div>
                                <label>Mobile</label>
                                <input value={profileData?.mobile || ''} disabled />
                            </div>

                            <div>
                                <label>Email</label>
                                <input value={profileData?.email || ''} disabled />
                            </div>

                            <div>
                                <label>Department</label>
                                <input value={profileData?.department || ''} disabled />
                            </div>

                            <div>
                                <label>Year</label>
                                <input value={profileData?.year ? `${profileData.year} Year` : ''} disabled />
                            </div>
                        </div>

                        {/* Correction Note */}
                        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#444' }}>
                            ⚠ If any detail is incorrect,&nbsp;
                            <span
                                style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}
                                onClick={() => setShowChangeModal(true)}
                            >
                                click here to raise a correction request
                            </span>
                        </p>
                    </div>

                    {/* Right Side - Photo */}
                    <div style={{ textAlign: 'center' }}>
                        <h4>Profile Photo</h4>

                        <div style={{ margin: '15px 0' }}>
                            {profileData.profilePhoto ? (
                                <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid #2563eb'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem'
                                }}>
                                    📷
                                </div>
                            )}
                        </div>

                        <input type="file" accept="image/jpeg, image/jpg, image/png" onChange={handlePhotoUpload} disabled={uploading} />
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Only JPG, JPEG, and PNG images are allowed.Max 2MB</p>
                    </div>
                </div>
            </div>

            {/* Continue Button */}
            <button
                className="primary-btn"
                onClick={handleCompleteProfile}
                disabled={!profileData.profilePhoto}
                style={{ width: '100%', marginTop: '25px', padding: '14px' }}
            >
                {profileData.profilePhoto ? '✓ Continue to Dashboard' : 'Upload Photo to Continue'}
            </button>

            {!profileData.profilePhoto && (
                <p className="warning-text">⚠ Please upload profile photo to proceed</p>
            )}

            {/* Change Request Modal */}
            {showChangeModal && (
                <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h2>Raise Correction Request</h2>

                        {['name', 'dateOfBirth', 'mobile', 'email', 'department', 'year'].map(field => (
                            <div key={field} className="change-row">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={changeRequest[field]}
                                        onChange={(e) =>
                                            setChangeRequest({ ...changeRequest, [field]: e.target.checked })
                                        }
                                    />
                                    {field.toUpperCase()}
                                </label>

                                {changeRequest[field] && (
                                    <input
                                        placeholder={`Enter correct ${field}`}
                                        value={changedValues[field] || ''}
                                        onChange={(e) =>
                                            setChangedValues({ ...changedValues, [field]: e.target.value })
                                        }
                                    />
                                )}
                            </div>
                        ))}

                        <textarea
                            placeholder="Reason for correction"
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button className="primary-btn" onClick={handleRequestChange}>Submit</button>
                            <button className="secondary-btn" onClick={() => setShowChangeModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
