import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profile } from '../services/api';

export default function StudentProfile() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        year: 1,
        profilePhoto: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profile.get();
            const userData = response.data;
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                department: userData.department || '',
                year: userData.year || 1,
                profilePhoto: userData.profilePhoto || ''
            });
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Photo size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePhoto: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate
        if (!formData.name || !formData.email || !formData.phone || !formData.department) {
            setError('All fields are required');
            return;
        }

        setSaving(true);

        try {
            const response = await profile.update(formData);
            setSuccess('Profile updated successfully!');

            // Update user in context
            login(response.data.user, localStorage.getItem('token'));

            setTimeout(() => {
                navigate('/student');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate('/student')} className="back-button">← Back</button>
                <h1>Complete Your Profile</h1>
            </div>

            <div className="profile-info-banner">
                <p>⚠️ Complete your profile to apply for bus pass</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form className="profile-form" onSubmit={handleSubmit}>
                {/* Photo Upload */}
                <div className="photo-upload-section">
                    <label>Profile Photo *</label>
                    <div className="photo-preview">
                        {formData.profilePhoto ? (
                            <img src={formData.profilePhoto} alt="Profile" />
                        ) : (
                            <div className="photo-placeholder">
                                <span>📷</span>
                                <p>No photo uploaded</p>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="file-input"
                    />
                    <p className="file-hint">Max size: 2MB (JPG, PNG)</p>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email ID *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your.email@university.edu"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Mobile Number *</label>
                        <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div className="form-group">
                        <label>Department *</label>
                        <input
                            type="text"
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="e.g., Computer Science"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Year of Study *</label>
                    <select
                        required
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </div>

                <button type="submit" disabled={saving} className="submit-button">
                    {saving ? 'Saving...' : 'Save Profile & Continue'}
                </button>
            </form>
        </div>
    );
}
