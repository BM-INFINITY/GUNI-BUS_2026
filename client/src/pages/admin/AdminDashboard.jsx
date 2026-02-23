import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Bus,
    ShieldCheck,
    Map,
    Activity,
    ClipboardList,
    Clock
} from 'lucide-react';
import { admin } from '../../services/api';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalBuses: 0,
        activeDrivers: 0,
        activeRoutes: 0,
        todayAttendance: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [studentsRes, busesRes, driversRes, routesRes, attendanceRes] = await Promise.all([
                admin.getStudents({ page: 1, limit: 1 }),
                admin.getBuses(),
                admin.getDrivers(),
                admin.getRoutes(),
                admin.getTodayAttendance()
            ]);

            const totalAttendance = attendanceRes.data.reduce((acc, curr) => acc + curr.checkIns, 0);

            setStats({
                totalStudents: studentsRes.data.totalStudents || 0,
                totalBuses: busesRes.data.length || 0,
                activeDrivers: driversRes.data.length || 0,
                activeRoutes: routesRes.data.length || 0,
                todayAttendance: totalAttendance
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const kpiCards = [
        {
            title: 'Total Students',
            value: stats.totalStudents,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue'
        },
        {
            title: 'Total Buses',
            value: stats.totalBuses,
            icon: Bus,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo'
        },
        {
            title: 'Active Drivers',
            value: stats.activeDrivers,
            icon: ShieldCheck,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green'
        },
        {
            title: 'Active Routes',
            value: stats.activeRoutes,
            icon: Map,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple'
        },
        {
            title: "Today's Attendance",
            value: stats.todayAttendance,
            icon: Activity,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange'
        }
    ];
    const recentActivity = [
        { id: 1, type: 'pass', user: 'Rahul Sharma', action: 'Pass approved', time: '10 mins ago', icon: ShieldCheck, iconColor: 'text-green-500' },
        { id: 2, type: 'profile', user: 'Anjali Patel', action: 'Profile update request', time: '25 mins ago', icon: Clock, iconColor: 'text-amber-500' },
        { id: 3, type: 'bus', user: 'Route 101', action: 'Journey completed', time: '1 hour ago', icon: Bus, iconColor: 'text-indigo-500' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-wrapper">
            <header className="page-header-premium">
                <div className="header-hero-box">
                    <div>
                        <h1>Dashboard Overview</h1>
                        <p className="text-amber-400">Welcome, Admin</p>
                    </div>

                </div>
            </header>

            {/* KPI Grid */}
            <div className="admin-grid-stats">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className={`admin-stat-card ${card.border}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="admin-stat-title">{card.title}</span>
                                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <div className="admin-stat-value">{card.value}</div>
                            <div className="admin-stat-footer flex items-center text-green-600 font-medium">
                                <span className="mr-1">↑ 12%</span>
                                <span className="text-slate-400 font-normal">from last month</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Recent Activity */}
                <div className="admin-table-container">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity size={18} className="text-indigo-600" />
                            Recent Activity
                        </h3>
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentActivity.map((activity) => {
                            const Icon = activity.icon;
                            return (
                                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                                    <div className={`p-2 rounded-full bg-slate-100 ${activity.iconColor}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {activity.action}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {activity.user}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400 whitespace-nowrap">
                                        {activity.time}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
