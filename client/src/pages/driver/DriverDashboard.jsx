import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { driver as driverApi } from "../../services/api";
import CheckpointControl from "./CheckpointControl";
import { Clock, Bus, Users, MapPin, PackagePlus, AlertCircle, ArrowRight, Activity, Map, UserCheck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function DriverDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [driver, setDriver] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await driverApi.getDashboard();

      setDriver(res.data.driver);
      setAnalytics(res.data.analytics);
      setPassengers(res.data.passengers || []);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard error:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-indigo-600 font-semibold animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  const assignedBus = driver?.assignedBus;
  const assignedRoute = driver?.assignedRoute;

  // Calculate percentages for the live status bars
  const total = analytics?.totalPassengers || 0;
  const checkedIn = analytics?.checkedIn || 0;
  const checkedOut = analytics?.checkedOut || 0;

  const getProgressWidth = (val, max) => {
    if (!max || max === 0) return '0%';
    return `${Math.min(100, Math.round((val / max) * 100))}%`;
  };

  return (
    <div className="space-y-6 pb-6 w-full max-w-xl mx-auto">

      {/* Welcome & Date Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end px-1"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {user?.name?.split(' ')[0] || 'Driver'} <span className="text-indigo-500"></span>
          </h1>
        </div>
      </motion.div>

      {/* Top Assignment Card */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {!assignedRoute ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-inner">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Assignment Today</h2>
            <p className="text-slate-500 text-sm max-w-[200px]">You have not been assigned to a route or bus for today.</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[2rem] p-4 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-[11px] uppercase tracking-wider font-bold rounded-full backdrop-blur-md border border-white/10">
                  <Activity size={12} className="text-emerald-300" /> Active Route
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-3 mb-1">
                  <h2 className="text-2xl font-black tracking-tight">{assignedRoute.routeNumber}</h2>
                </div>
                <p className="text-lg font-medium text-indigo-100 leading-snug flex items-center gap-2">
                  <Map className="w-4 h-4 text-indigo-300" />
                  {assignedRoute.routeName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10 hover:bg-white/20 transition-colors">
                  <div className="bg-white/20 p-2.5 rounded-xl text-white">
                    <Bus size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Bus No.</p>
                    <p className="font-bold text-sm leading-tight">{assignedBus ? assignedBus.busNumber : 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10 hover:bg-white/20 transition-colors">
                  <div className="bg-white/20 p-2.5 rounded-xl text-white">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Shift</p>
                    <p className="font-bold text-sm leading-tight capitalize">{driver?.shift || 'Flexible'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* Quick Actions Array - Horizontal Scroll */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-2"
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 -mx-1">
          <button
            onClick={() => navigate("/driver/checkpoint")}
            className="flex-shrink-0 w-32 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all outline-none"
          >
            <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl shadow-inner border border-emerald-100/50">
              <MapPin size={24} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-700 text-[13px]">Checkpoints</span>
          </button>

          <button
            onClick={() => navigate("/driver/report-found")}
            className="flex-shrink-0 w-32 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all outline-none"
          >
            <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl shadow-inner border border-amber-100/50">
              <PackagePlus size={24} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-700 text-[13px]">Report Item</span>
          </button>

          <button
            onClick={() => navigate("/driver/scan")}
            className="flex-shrink-0 w-32 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all outline-none"
          >
            <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl shadow-inner border border-indigo-100/50">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-700 text-[13px]">Scan Pass</span>
          </button>
        </div>
      </motion.section>

      {/* Checkpoint Control Component */}
      {assignedRoute && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-500" />
            <h3 className="font-bold text-slate-700">Journey Progress</h3>
          </div>
          <CheckpointControl />
        </motion.div>
      )}

      {/* Live Stats */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4 ml-1">
          <Activity size={18} className="text-slate-700" />
          <h3 className="text-lg font-bold text-slate-800">Live Status</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Comprehensive Stats Card */}
          <div className="col-span-1 sm:col-span-3 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-3xl font-black text-slate-800">{total}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Expected Passengers</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Users size={24} className="text-slate-400" />
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-700">On Board ({checkedIn})</span>
                  <span className="text-emerald-600/70">{total > 0 ? Math.round((checkedIn / total) * 100) : 0}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: getProgressWidth(checkedIn, total) }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-indigo-700">Completed ({checkedOut})</span>
                  <span className="text-indigo-600/70">{total > 0 ? Math.round((checkedOut / total) * 100) : 0}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: getProgressWidth(checkedOut, total) }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Passenger Manifest Summary */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4 ml-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck size={18} />
            Manifest
          </h3>
          <button
            onClick={() => navigate("/driver/seats")}
            className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors"
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        {passengers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 flex flex-col items-center">
            <Users size={32} className="text-slate-300 mb-3" />
            <p className="font-medium text-slate-500">No passengers scheduled.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</span>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {passengers.length} Total
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {passengers.slice(0, 3).map((p) => {
                const status = p.checkOutTime ? 'completed' : p.checkInTime ? 'onboard' : 'pending';
                return (
                  <li key={p._id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm
                        ${status === 'completed' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' :
                          status === 'onboard' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                            'bg-slate-100 text-slate-500 border border-slate-200'}`}
                      >
                        {p.userId?.profilePhoto ? (
                          <img src={p.userId.profilePhoto} alt="profile" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          (p.userId?.name || 'S').charAt(0)
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{p.userId?.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate font-mono mt-0.5 tracking-wide">{p.userId?.enrollmentNumber}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg
                        ${status === 'completed' ? 'bg-indigo-50 text-indigo-600' :
                          status === 'onboard' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-slate-50 text-slate-500'}`}
                      >
                        {status === 'completed' ? 'Done' : status === 'onboard' ? 'On Bus' : 'Pending'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {passengers.length > 3 && (
              <div
                onClick={() => navigate("/driver/seats")}
                className="p-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors border-t border-slate-50"
              >
                + {passengers.length - 3} more passengers
              </div>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}
