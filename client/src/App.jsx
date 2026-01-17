import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Student Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import ApplyPass from './pages/ApplyPass';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import StudentsManagement from './pages/StudentsManagement';
import ProfileChanges from './pages/ProfileChanges';
import PendingPasses from './pages/PendingPasses';
import ApprovedPasses from './pages/ApprovedPasses';
import AdminTransportDashboard from './pages/AdminTransportDashboard';
import AdminScanPass from './pages/AdminScanPass'; // new scan page
import BusManagement from './pages/admin/BusManagement';
import DriverManagement from './pages/admin/DriverManagement';
import LiveAttendance from './pages/admin/LiveAttendance';


//Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import ScanPass from './pages/driver/ScanPass';
import RouteDetails from './pages/driver/RouteDetails';

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
                path="/admin/passes/pending"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <PendingPasses />
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
            {/* TODO: Uncomment when AdminTransportDashboard is created */}
            {/* Admin Scan Pass */}
            <Route
                path="/admin/scan-pass"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminScanPass />
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
