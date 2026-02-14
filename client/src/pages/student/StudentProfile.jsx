import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profile } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import { Camera, User, Calendar, Phone, Mail, BookOpen, AlertCircle, CheckCircle, PenLine, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentProfile() {
    const navigate = useNavigate();
    const { updateUser, logout } = useAuth();

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

        setError('');
        setSuccess('');

        if (file.size > 2 * 1024 * 1024) {
            setError('❌ Image size is too large. Max 2MB.');
            return;
        }

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

    if (loading || !profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <StudentLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Photo & Action */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
                        <div className="relative inline-block mb-6">
                            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner mx-auto bg-slate-50 flex items-center justify-center group">
                                {profileData.profilePhoto ? (
                                    <img
                                        src={profileData.profilePhoto}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-16 h-16 text-slate-300" />
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>

                            <label className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                <Camera className="w-5 h-5" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg, image/jpg, image/png"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800">{profileData.name}</h2>
                        <p className="text-slate-500 font-medium mb-6">{profileData.enrollmentNumber}</p>

                        {!profileData.isProfileComplete ? (
                            <button
                                onClick={handleCompleteProfile}
                                disabled={!profileData.profilePhoto}
                                className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-lg ${profileData.profilePhoto
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {profileData.profilePhoto ? 'Save & Go to Dashboard' : 'Upload Photo to Continue'}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/student')}
                                className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Back to Dashboard
                            </button>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg flex items-center gap-2 text-left animate-fade-in">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mt-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2 text-left animate-fade-in">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                {success}
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                        <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Instructions
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-700 list-disc list-inside">
                            <li>Verify your details carefully.</li>
                            <li>Profile photo must be clear and recent.</li>
                            <li>Incorrect details? Raise a request.</li>
                        </ul>
                    </div>
                </div>

                {/* Right Col: Details Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-800">Personal Information</h3>
                            <button
                                onClick={() => setShowChangeModal(true)}
                                className="text-indigo-600 text-sm font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                                <PenLine className="w-4 h-4" />
                                Request Change
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileField icon={User} label="Full Name" value={profileData.name} />
                            <ProfileField icon={Calendar} label="Date of Birth" value={formatDate(profileData.dateOfBirth)} />
                            <ProfileField icon={Phone} label="Mobile Number" value={profileData.mobile} />
                            <ProfileField icon={Mail} label="Email Address" value={profileData.email} />
                            <ProfileField icon={BookOpen} label="Department" value={profileData.department} />
                            <ProfileField icon={Calendar} label="Academic Year" value={`${profileData.year || ''} Year`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Request Modal */}
            {showChangeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowChangeModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                    >
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">Request Profile Correction</h2>
                            <p className="text-sm text-slate-500">Select fields to correct and provide valid reason.</p>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                {['name', 'dateOfBirth', 'mobile', 'email', 'department', 'year'].map(field => (
                                    <div key={field} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors bg-white">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-200 transition-all checked:bg-indigo-600 checked:border-indigo-600"
                                                    checked={changeRequest[field]}
                                                    onChange={(e) => setChangeRequest({ ...changeRequest, [field]: e.target.checked })}
                                                />
                                            </div>
                                            <span className="font-semibold text-slate-700 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </label>

                                        {changeRequest[field] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 pl-8"
                                            >
                                                <input
                                                    type={field === 'dateOfBirth' ? 'date' : 'text'}
                                                    placeholder={`Enter correct ${field}`}
                                                    value={changedValues[field] || ''}
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none text-sm"
                                                    onChange={(e) => setChangedValues({ ...changedValues, [field]: e.target.value })}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Correction (Required)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none h-24"
                                    placeholder="Briefly explain why these changes are needed..."
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowChangeModal(false)}
                                className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestChange}
                                className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
                            >
                                Submit Request
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </StudentLayout>
    );
}

const ProfileField = ({ icon: Icon, label, value }) => (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3 mb-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className="font-semibold text-slate-900 border-l-2 border-indigo-200 pl-3">{value || 'N/A'}</p>
    </div>
);
