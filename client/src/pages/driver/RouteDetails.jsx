import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RouteDetails() {
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user } = useAuth(); // to check assigned shift

    useEffect(() => {
        fetchRouteDetails();
    }, []);

    const fetchRouteDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/driver/route-details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoute(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch route error:", err);
            setError(err.response?.data?.message || "Failed to load route details");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    <p className="font-bold">Error Loading Route</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="p-6 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100 mt-4">
                <p>No route details found.</p>
            </div>
        );
    }

    const assignedShift = user?.shift || 'morning';

    return (
        <div className="pb-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-18 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-s font-bold shadow-inner">
                        {route.routeNumber}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 leading-tight">{route.routeName}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1">
                            <span>📍</span> {route.startPoint} <span className="opacity-50">➝</span> {route.endPoint}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {route.shifts.map((shift, index) => {
                    const isActiveShift = shift.shiftType === assignedShift;
                    return (
                        <div key={index} className={`bg-white rounded-3xl shadow-sm border overflow-hidden ${isActiveShift ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-slate-100'
                            }`}>
                            <div className={`px-5 py-3 border-b flex items-center justify-between ${isActiveShift ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'
                                }`}>
                                <h3 className={`font-bold capitalize flex items-center gap-2 ${isActiveShift ? 'text-indigo-800' : 'text-slate-700'
                                    }`}>
                                    <span className="text-lg">{shift.shiftType === 'morning' ? '🌅' : shift.shiftType === 'afternoon' ? '☀️' : '🌆'}</span>
                                    {shift.shiftType} Shift
                                </h3>
                                {isActiveShift && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                                        Your Shift
                                    </span>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                                    {shift.stops.map((stop, i) => {
                                        const isFirst = i === 0;
                                        const isLast = i === shift.stops.length - 1;
                                        return (
                                            <div key={i} className="relative pl-6">
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isFirst ? 'bg-emerald-500' : isLast ? 'bg-red-500' : 'bg-indigo-400'
                                                    }`}></div>

                                                <div className="flex gap-4 items-start -mt-1">
                                                    <div className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-2 py-1 rounded shadow-sm border border-slate-200 whitespace-nowrap hidden sm:block">
                                                        {stop.arrivalTime}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{stop.name}</h4>
                                                        <div className="bg-slate-100 text-slate-700 font-mono text-xs font-bold px-2 py-1 rounded w-max mt-1 border border-slate-200 sm:hidden">
                                                            {stop.arrivalTime}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
