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

            {/* TODO: Uncomment when AdminTransportDashboard is created */}
            {/* <Route
                path="/admin/transport"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminTransportDashboard />
                    </ProtectedRoute>
                }
            /> */}


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
