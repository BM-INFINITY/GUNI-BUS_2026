import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    Ticket,
    Bus,
    LogOut,
    Menu,
    X,
    CreditCard,
    QrCode,
    Phone,
    History,
    Search,
    Gift,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { students } from '../../services/api';

const StudentLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [busDetails, setBusDetails] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'student') {
            fetchBusDetails();
        }
    }, [user]);

    const fetchBusDetails = async () => {
        try {
            const response = await students.getBusDetails();
            setBusDetails(response.data);
        } catch (error) {
            console.error('Failed to fetch bus details:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
        { icon: User, label: 'My Profile', path: '/student/profile' },
        { icon: CreditCard, label: 'Apply for Pass', path: '/student/apply-pass' },
        { icon: Bus, label: 'Bus Info', path: '/student/bus-info' },
        { icon: History, label: 'Journey History', path: '/student/journey-history' },
        { icon: Ticket, label: 'Buy Day Ticket', path: '/student/apply-day-ticket' },
        { icon: QrCode, label: 'My Day Tickets', path: '/student/my-day-tickets' },
        { icon: Search, label: 'Lost & Found', path: '/student/lost-and-found' },
        { icon: Gift, label: 'Rewards', path: '#', comingSoon: true },
        { icon: AlertTriangle, label: 'Report Issue', path: '#', comingSoon: true },
    ];

    const SidebarContent = ({ isMobile }) => (
        <div className="flex flex-col h-full bg-white/0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-center relative">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-600 p-2 rounded-lg">
                        <Bus className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">GuniBus</h1>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.comingSoon ? '#' : item.path}
                            onClick={(e) => {
                                if (item.comingSoon) e.preventDefault();
                                setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100/50'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                } ${item.comingSoon ? 'opacity-60 cursor-not-allowed hover:bg-transparent' : ''}`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.comingSoon && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">SOON</span>
                            )}
                        </Link>
                    );
                })}
            </nav>



            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 !w-full px-4 py-3 !bg-transparent !text-red-600 hover:!bg-red-50 rounded-xl transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 h-full z-30 bg-white border-r border-slate-200">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-16 flex items-center gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="!w-auto !p-2 !bg-transparent !text-slate-600 hover:!bg-slate-100 rounded-lg active:scale-95 transition-transform"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="bg-primary-600 p-1.5 rounded-lg">
                        <Bus className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-slate-800">GuniBus</span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white/80 backdrop-blur-xl z-50 lg:hidden shadow-2xl border-r border-white/20"
                        >
                            <SidebarContent isMobile={true} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen transition-all duration-300">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <header className="mb-8 hidden lg:flex items-center justify-between">
                        <div>
                            <nav className="flex text-sm text-slate-500 mb-1">
                                <span>Student</span>
                                <span className="mx-2">/</span>
                                <span className="font-medium text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer">
                                    {location.pathname.split('/').pop().split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                            </nav>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-md">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </header>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default StudentLayout;
