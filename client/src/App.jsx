import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages (to be created)
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import AdminDashboard from './pages/AdminDashboard';
import DriverPortal from './pages/DriverPortal';
import ApplyPass from './pages/ApplyPass';
import BuyTicket from './pages/BuyTicket';

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
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
            <Route path="/login" element={<Login />} />

            <Route
                path="/"
                element={
                    user ? (
                        user.role === 'admin' ? <Navigate to="/admin" /> :
                            user.role === 'driver' ? <Navigate to="/driver" /> :
                                <Navigate to="/student" />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

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
                path="/student/buy-ticket"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <BuyTicket />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/driver"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <DriverPortal />
                    </ProtectedRoute>
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
