import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { passes, profile } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import {
    MapPin,
    Calendar,
    Bus,
    QrCode,
    Clock,
    User,
    CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userPasses, setUserPasses] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPassModal, setShowPassModal] = useState(false);

    useEffect(() => {
        if (user && !user.isProfileComplete) {
            navigate('/student/profile');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [profileRes, passesRes] = await Promise.all([
                profile.get(),
                passes.getMyPasses()
            ]);
            setProfileData(profileRes.data);
            setUserPasses(passesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const activePass = userPasses.find(p => p.status === 'approved');

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">

                {!activePass ? (
                    <div className="text-center max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bus className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">No Active Pass</h2>
                        <p className="text-slate-500 mb-8 text-lg">
                            You don't have an active bus pass yet. Apply now to get your digital pass.
                        </p>
                        <button
                            onClick={() => navigate('/student/apply-pass')}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform hover:-translate-y-1 block"
                        >
                            Apply for Pass
                        </button>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                    >
                        {/* Digital Pass Card */}
                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 relative">
                            {/* Decorative Top Gradient */}
                            <div className="h-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                                <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                                    <div className="p-1 bg-white rounded-full">
                                        <img
                                            src={profileData?.profilePhoto || "https://uia-avatars.com/api/?name=" + user.name}
                                            alt={user.name}
                                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 pb-6 px-6 text-center">
                                <h2 className="text-xl font-bold text-slate-900 mb-0.5">{profileData?.name}</h2>
                                <p className="text-slate-500 font-medium tracking-wide uppercase text-xs mb-4">{user.enrollmentNumber}</p>

                                {/* Verification Badge */}
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mb-6">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Verified Student</span>
                                </div>

                                {/* QR Code Section */}
                                <div className="bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100 shadow-inner inline-block">
                                    <img src={activePass.qrCode} alt="Pass QR" className="w-56 h-56 object-contain mix-blend-multiply" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mb-4 uppercase tracking-widest">Scan at Bus Entrance</p>

                                {/* View Full Pass Button */}
                                <button
                                    onClick={() => setShowPassModal(true)}
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <MapPin className="w-4 h-4" />
                                    View Details
                                </button>
                            </div>

                            {/* Bottom Status Bar */}
                            <div className="bg-slate-900 text-white py-3 text-center text-xs font-medium tracking-wide">
                                UNIVERSAL BUS PASS
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Full Pass Modal */}
            {showPassModal && activePass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPassModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full"
                    >
                        <div className="bg-indigo-600 p-6 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                            <h2 className="text-2xl font-bold mb-1">University Bus Pass</h2>
                            <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">Official Digital ID</p>
                        </div>

                        <div className="p-6">
                            {/* Student Profile Section */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative mb-4">
                                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
                                    <img
                                        src={profileData?.profilePhoto || "https://uia-avatars.com/api/?name=" + user.name}
                                        alt="Student"
                                        className="w-32 h-32 rounded-full object-cover shadow-xl border-4 border-white relative z-10"
                                    />
                                    <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white z-20">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 text-center">{activePass.studentName || user.name}</h3>
                                <p className="text-slate-500 font-medium text-center">{activePass.enrollmentNumber || user.enrollmentNumber}</p>
                            </div>

                            {/* Pass Details Grid */}
                            <div className="space-y-4">
                                {/* Academic Info */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Department</p>
                                            <p className="font-semibold text-slate-800 text-sm">{activePass.department || user.department || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Year/Sem</p>
                                            <p className="font-semibold text-slate-800 text-sm">Year {activePass.year || user.year}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Mobile</p>
                                            <p className="font-semibold text-slate-800 text-sm font-mono tracking-wide">{activePass.mobile || user.mobile}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pass Metadata */}
                                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                        <div className="col-span-2 pb-3 border-b border-indigo-100">
                                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Pass Reference</p>
                                            <p className="font-bold text-indigo-900 font-mono tracking-wider">{activePass.referenceNumber}</p>
                                        </div>

                                        <div className="pt-1">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Route</p>
                                            <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                                <Bus className="w-3 h-3 text-indigo-500" />
                                                {activePass.route?.routeName}
                                            </p>
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Stop</p>
                                            <p className="font-bold text-slate-900 text-sm">{activePass.selectedStop}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Shift</p>
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold capitalize border ${activePass.shift === 'morning'
                                                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                }`}>
                                                {activePass.shift}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Valid Until</p>
                                            <p className="font-bold text-slate-900 text-sm text-red-600">
                                                {new Date(activePass.validUntil).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPassModal(false)}
                                className="w-full mt-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                            >
                                Close Pass
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </StudentLayout>
    );
}

function BookOpen(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    )
}
