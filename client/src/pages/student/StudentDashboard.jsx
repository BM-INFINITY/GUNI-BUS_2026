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
    CheckCircle,
    X
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

    // ... (fetchData and loading state remain same, not replacing them to keep context short if possible, but replace_file_content needs contiguous block. 
    // Actually, I can just inject the state at top and logic in render.
    // Wait, I need to replace the component body to add state.

    // Let's use a smaller replacement for the state definition first.


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
                                    className="w-auto px-6 py-2.5 mx-auto bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                                >
                                    <MapPin className="w-4 h-4" />
                                    View Details
                                </button>
                            </div>

                            {/* Bottom Status Bar */}
                            <div className="bg-slate-900 text-white py-3 text-center text-xs font-medium tracking-wide">
                                 BUS PASS
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Full Pass Modal */}
            {showPassModal && activePass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPassModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full"
                    >
                        {/* Compact Header */}
                        <div className="bg-indigo-600 px-4 py-3 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">University Bus Pass</h2>
                                <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-medium">Official Digital ID</p>
                            </div>
                            <button
                                onClick={() => setShowPassModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            {/* Compact Profile Section - Row Layout */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
                                    <img
                                        src={profileData?.profilePhoto || "https://uia-avatars.com/api/?name=" + user.name}
                                        alt="Student"
                                        className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white relative z-10"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white z-20">
                                        <CheckCircle className="w-3 h-3" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <h3 className="text-lg font-bold text-slate-900 truncate">{activePass.studentName || user.name}</h3>
                                    <p className="text-slate-500 text-sm mb-1">{activePass.enrollmentNumber || user.enrollmentNumber}</p>

                                    <div className="inline-flex flex-col items-start">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pass Reference</span>
                                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                            {activePass.referenceNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dense Details Grid */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                {/* Row 1: Dept & Year */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Department</p>
                                        <p className="font-semibold text-slate-900 text-sm truncate">{activePass.department || user.department || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Year</p>
                                        <p className="font-semibold text-slate-900 text-sm">Year {activePass.year || user.year}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200"></div>

                                {/* Row 2: Route & Stop */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Route</p>
                                        <p className="font-semibold text-slate-900 text-sm truncate flex items-center gap-1">
                                            <Bus className="w-3 h-3 text-indigo-500 shrink-0" />
                                            {activePass.route?.routeName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Stop</p>
                                        <p className="font-semibold text-slate-900 text-sm truncate">{activePass.selectedStop}</p>
                                    </div>
                                </div>

                                {/* Row 3: Shift & Validity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Shift</p>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${activePass.shift === 'morning'
                                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}>
                                            {activePass.shift}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Valid Until</p>
                                        <p className="font-bold text-red-600 text-sm">
                                            {new Date(activePass.validUntil).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200"></div>

                                {/* Row 4: Mobile */}
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile</p>
                                    <p className="font-mono font-medium text-slate-700 text-sm">{activePass.mobile || user.mobile}</p>
                                </div>
                            </div>
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
