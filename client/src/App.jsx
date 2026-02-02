import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Student Pages
import Login from './pages/auth/Login';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import ApplyPass from './pages/student/ApplyPass';
import ApplyDayTicket from './pages/student/ApplyDayTicket';
import MyDayTickets from './pages/student/MyDayTickets';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsManagement from './pages/admin/StudentsManagement';
import ProfileChanges from './pages/admin/ProfileChanges';
import ApprovedPasses from './pages/admin/ApprovedPasses';
import AdminTransportDashboard from './pages/admin/AdminTransportDashboard';
import DailyTickets from './pages/admin/DailyTickets';
import BusManagement from './pages/admin/BusManagement';
import DriverManagement from './pages/admin/DriverManagement';
import LiveAttendance from './pages/admin/LiveAttendance';
import CreateDayTicket from './pages/admin/CreateDayTicket';
import DailyJourneyReport from './pages/admin/DailyJourneyReport';
import CheckpointAnalytics from './pages/admin/CheckpointAnalytics';
import ScanHistory from './pages/admin/ScanHistory';


//Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import ScanPass from './pages/driver/ScanPass';
import RouteDetails from './pages/driver/RouteDetails';
import DriverCheckpointForm from './pages/driver/DriverCheckpointForm';
import MyScanHistory from './pages/driver/MyScanHistory';

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Login */}
            <Route path="/" element={<Login />} />

            {/* Student Routes */}
            <Route
                path="/student"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/profile"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <StudentProfile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/apply-pass"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <ApplyPass />
                    </ProtectedRoute>
                }
            />



            <Route
                path="/admin/passes/approved"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ApprovedPasses />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/apply-day-ticket"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <ApplyDayTicket />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/my-day-tickets"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <MyDayTickets />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/students"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <StudentsManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/profile-changes"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ProfileChanges />
                    </ProtectedRoute>
                }
            />





            <Route
                path="/admin/buses"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <BusManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/drivers"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DriverManagement />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/live-attendance"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <LiveAttendance />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/create-day-ticket"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <CreateDayTicket />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/journey-report"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DailyJourneyReport />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/checkpoint-analytics"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <CheckpointAnalytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/scan-history"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ScanHistory />
                    </ProtectedRoute>
                }
            />


            {/* Driver routes */}
            <Route
                path="/driver"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <DriverDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver/scan"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <ScanPass />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver/route"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <RouteDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver/checkpoint"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <DriverCheckpointForm />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver/scan-history"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <MyScanHistory />
                    </ProtectedRoute>
                }
            />
            {/* TODO: Uncomment when AdminTransportDashboard is created */}
            {/* Admin Scan Pass */}
            <Route
                path="/admin/one-day-tickets"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DailyTickets />
                    </ProtectedRoute>
                }
            />




            {/* Catch all - redirect based on role */}
            <Route
                path="*"
                element={
                    user ? (
                        user.role === 'admin' ? <Navigate to="/admin" /> :
                            <Navigate to="/student" />
                    ) : (
                        <Navigate to="/" />
                    )
                }
            />
        </Routes>
    );
}

function App() {
    return (

        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
