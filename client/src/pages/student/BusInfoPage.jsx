import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bus, MapPin, Phone, User, ShieldCheck, Clock, X } from 'lucide-react';
import { students } from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';

const BusInfoPage = () => {
    const [busDetails, setBusDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    useEffect(() => {
        fetchBusDetails();
    }, []);

    const fetchBusDetails = async () => {
        try {
            setLoading(true);
            const response = await students.getBusDetails();
            setBusDetails(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch bus details:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </StudentLayout>
        );
    }

    if (!busDetails?.assigned) {
        return (
            <StudentLayout>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 px-4"
                >
                    <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bus className="w-12 h-12 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">No Bus Assigned Yet</h2>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Your route/shift doesn't have an assigned bus and driver at the moment.
                    </p>
                </motion.div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-6"
            >
                {/* Bus Card */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 transform transition-all hover:scale-[1.01] duration-300">
                    <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Bus className="w-48 h-48 transform translate-x-12 -translate-y-12" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Assigned Vehicle</p>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{busDetails.busNumber}</h2>
                            <div className="inline-flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                    <span className="font-mono text-lg tracking-wide font-bold">{busDetails.registrationNumber}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wide">
                                    <ShieldCheck className="w-4 h-4" />
                                    Verified
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Driver Card */}
                <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 transform transition-all hover:scale-[1.01] duration-300 delay-75">
                    <div className="p-8">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Authorized Driver</p>

                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full bg-slate-50 p-1 border-4 border-white shadow-lg ring-1 ring-slate-100">
                                    {busDetails.driver.photo ? (
                                        <img
                                            src={busDetails.driver.photo}
                                            alt={busDetails.driver.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center">
                                            <User className="w-10 h-10 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" title="Active"></div>
                            </div>

                            <div className="flex-1 text-center sm:text-left space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{busDetails.driver.name}</h3>
                                    <p className="text-slate-500 font-medium text-sm mt-1">Licensed University Driver</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start pt-2">
                                    <a
                                        href={`tel:${busDetails.driver.mobile}`}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call Driver
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Tracking Card */}
                <div onClick={() => setShowTrackingModal(true)} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 transform transition-all hover:scale-[1.01] hover:shadow-2xl duration-300 cursor-pointer group">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Tracking</p>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold animate-pulse">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                LIVE
                            </div>
                        </div>

                        <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden mb-6 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                            {/* Dummy Map Placeholder */}
                            <div className="absolute inset-0 bg-[#e5e7eb] flex items-center justify-center">
                                <MapPin className="w-12 h-12 text-slate-300" />
                            </div>
                            <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-indigo-900/5 transition-colors"></div>

                            {/* Bus Marker */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-indigo-500/30 rounded-full animate-ping"></div>
                                    <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-white z-10 relative">
                                        <Bus className="w-6 h-6" />
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-[10px] font-bold whitespace-nowrap">
                                        {busDetails.busNumber}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-900">ETA: <span className="text-green-600">5 mins</span></p>
                                <p className="text-xs text-slate-500 mt-1">Next Stop: Central Plaza</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Capacity</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[70%] rounded-full"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">35/50</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Screen Tracking Modal */}
                {showTrackingModal && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Live Bus Tracking</h3>
                                        <p className="text-xs text-slate-500">Bus {busDetails.busNumber} • Route 4B</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowTrackingModal(false); }}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 bg-slate-100 relative">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-[#f1f5f9]">
                                    {/* Placeholder for real map integration */}
                                    <div className="text-center">
                                        <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium text-slate-500">Full Map View</p>
                                        <p className="text-sm mt-2 opacity-60">(Integration coming soon)</p>
                                    </div>
                                </div>

                                {/* Overlay Stats */}
                                <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Speed</p>
                                            <p className="text-lg font-bold text-slate-900">45 <span className="text-xs font-normal text-slate-400">km/h</span></p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Next Stop</p>
                                            <p className="text-lg font-bold text-slate-900">Central Plaza</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase">ETA</p>
                                            <p className="text-lg font-bold text-green-600">5 min</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-bold text-center w-full shadow-lg shadow-slate-900/20">
                                        Status: On Time
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </StudentLayout>
    );
};

export default BusInfoPage;
