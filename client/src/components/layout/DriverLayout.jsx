import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Menu,
    X,
    Home,
    ScanLine,
    Map,
    Users,
    MapPin,
    PackagePlus,
    LogOut,
    ArrowLeft,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DriverLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const sidebarRef = useRef(null);
    const profileRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/driver', icon: Home, label: 'Dashboard' },
        { path: '/driver/scan', icon: ScanLine, label: 'Scan' },
        { path: '/driver/route', icon: Map, label: 'Route' },
        { path: '/driver/seats', icon: Users, label: 'Seats' },
        { path: '/driver/checkpoint', icon: MapPin, label: 'Checkpoints' },
        { path: '/driver/report-found', icon: PackagePlus, label: 'Report Item' },
    ];

    const isActive = (path) => {
        if (path === '/driver') {
            return location.pathname === '/driver';
        }
        return location.pathname.startsWith(path);
    };

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Close sidebar on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutsideDropdown = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutsideDropdown);
        } else {
            document.removeEventListener('mousedown', handleClickOutsideDropdown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideDropdown);
        };
    }, [isDropdownOpen]);

    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen]);

    return (
        <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
            {/* Top App Bar */}
            <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 border-b border-slate-200 h-16 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    {location.pathname !== '/driver' ? (
                        <button
                            onClick={() => navigate('/driver')}
                            className="p-2 -ml-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                        </div>
                        <h1 className="font-bold text-slate-800 text-lg leading-tight">Driver App</h1>
                    </div>
                </div>

                <div className="relative flex items-center" ref={profileRef}>
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 p-1.5 -mr-1.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                    >
                        <div className="hidden sm:block text-right mr-1">
                            <p className="text-sm font-semibold text-slate-800">{user?.name || 'Driver'}</p>
                            <p className="text-xs text-slate-500">Active</p>
                        </div>
                        {/* User Avatar */}
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm cursor-pointer">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-50 sm:hidden">
                                    <p className="font-bold text-slate-800 truncate">{user?.name || 'Driver Name'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email || 'driver@gunibus.com'}</p>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-[14px] font-semibold"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Sidebar / Drawer overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                            aria-hidden="true"
                        />
                        
                        <motion.aside
                            ref={sidebarRef}
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col"
                        >
                            {/* Sidebar Header */}
                            <div className="h-36 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 flex flex-col justify-end relative overflow-hidden">
                                {/* Decorative circle */}
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full opacity-50"></div>
                                
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none"
                                >
                                    <X size={20} />
                                </button>
                                
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl shadow-md border-2 border-white/20">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                                    </div>
                                    <div className="text-white">
                                        <h2 className="font-semibold text-lg leading-tight truncate">{user?.name || 'Driver Name'}</h2>
                                        <p className="text-indigo-100 text-sm opacity-90 truncate max-w-[150px]">{user?.email || 'Driver'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sidebar Navigation */}
                            <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 scrollbar-hide">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                                                active 
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                            }`}
                                        >
                                            <div className={`${active ? 'bg-white p-1.5 rounded-lg shadow-sm text-indigo-600' : 'text-slate-400'}`}>
                                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                            </div>
                                            <span className="text-[15px]">{item.label}</span>
                                            {active && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm"></div>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                            
                            {/* Sidebar Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl transition-colors font-semibold text-[15px] shadow-sm"
                                >
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 pt-16 w-full max-w-lg mx-auto md:max-w-3xl lg:max-w-5xl flex flex-col h-[100dvh]">
                <div className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 sm:p-6 pb-20 sm:pb-6">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="h-full min-h-max"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default DriverLayout;
