import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    CheckCircle,
    Ticket,
    Activity,
    Bus,
    ShieldCheck,
    Map,
    Calendar,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    ChevronDown,
    Menu,
    X,
    ClipboardList,
    PackageSearch,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Manage Students', path: '/admin/students' },
        { icon: UserCheck, label: 'Profile Change Requests', path: '/admin/profile-changes' },
        { icon: CheckCircle, label: 'Approved Passes', path: '/admin/passes/approved' },
        { icon: Ticket, label: 'Approved Tickets', path: '/admin/one-day-tickets' },
        { icon: Activity, label: 'Live Attendance', path: '/admin/live-attendance' },
        { icon: Bus, label: 'Manage Buses', path: '/admin/buses' },
        { icon: ShieldCheck, label: 'Manage Drivers', path: '/admin/drivers' },
        { icon: Map, label: 'Manage Routes', path: '/admin/routes' },
        { icon: Calendar, label: 'Manage Booking Days', path: '/admin/booking-days' },
        { icon: BarChart3, label: 'Journey Summary', path: '/admin/journey-summary' },
        { icon: PackageSearch, label: 'Lost & Found', path: '/admin/lost-found' },
        { icon: TrendingUp, label: 'Demand Forecast', path: '/admin/demand-forecast' },
    ];

    const SidebarContent = () => (
        <>
            <div className="admin-sidebar-logo">
                <Bus className="w-6 h-6 mr-2" />
                <h1>GuniBus Admin</h1>
            </div>
            <nav className="admin-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-100 mt-auto">
                <button
                    onClick={handleLogout}
                    className="admin-nav-item border-none bg-transparent w-full text-left cursor-pointer hover:text-red-600"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="admin-main">
                {/* Navbar */}
                <header className="admin-navbar">
                    <button
                        className="lg:hidden mr-auto p-2 text-slate-600"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="admin-navbar-actions">

                        <div className="relative">
                            <div
                                className="admin-profile-dropdown"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <div className="admin-avatar">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                                    Admin
                                </span>
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-xs text-slate-500">Signed in as</p>
                                        <p className="text-sm font-semibold truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="admin-page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
