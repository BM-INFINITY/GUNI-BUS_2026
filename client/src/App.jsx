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
import BusInfoPage from './pages/student/BusInfoPage';
import JourneyLogs from './pages/student/JourneyLogs';

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
import ManageBookingDays from './pages/admin/ManageBookingDays';
import RouteManagement from './pages/admin/RouteManagement';
import StudentDetailView from './pages/admin/StudentDetailView';
import AdminLayout from './components/layout/AdminLayout';
import DailyJourneySummary from './pages/admin/DailyJourneySummary';
import StudentJourneyLogs from './pages/admin/StudentJourneyLogs';
import AdminItemDetail from './pages/admin/AdminItemDetail';


//Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import ScanPass from './pages/driver/ScanPass';
import RouteDetails from './pages/driver/RouteDetails';
import DriverCheckpointForm from './pages/driver/DriverCheckpointForm';
import MyScanHistory from './pages/driver/MyScanHistory';
import ReportFoundItem from './pages/driver/ReportFoundItem';

// Lost & Found pages
import LostAndFound from './pages/student/LostAndFound';
import ItemDetail from './pages/student/ItemDetail';
import ReportLostItem from './pages/student/ReportLostItem';
import LostFoundDashboard from './pages/admin/LostFoundDashboard';
import LostFoundAnalytics from './pages/admin/LostFoundAnalytics';
import RideIntent from './pages/student/RideIntent';
import RaiseComplaint from './pages/student/RaiseComplaint';
import MyComplaints from './pages/student/MyComplaints';
import ComplaintsDashboard from './pages/admin/ComplaintsDashboard';
import DemandForecastDashboard from './pages/admin/DemandForecastDashboard';

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

            <Route
                path="/student/bus-info"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <BusInfoPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/journey-history"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <JourneyLogs />
                    </ProtectedRoute>
                }
            />

            {/* Complaint Module — Student */}
            <Route
                path="/student/raise-complaint"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <RaiseComplaint />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/my-complaints"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <MyComplaints />
                    </ProtectedRoute>
                }
            />

            {/* Lost & Found — Student */}
            <Route
                path="/student/lost-and-found"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <LostAndFound />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/lost-and-found/item/:type/:id"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <ItemDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/lost-and-found/report"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <ReportLostItem />
                    </ProtectedRoute>
                }
            />

            {/* Ride Intent — Student */}
            <Route
                path="/student/ride-intent"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <RideIntent />
                    </ProtectedRoute>
                }
            />

            {/* Lost & Found — Driver */}
            <Route
                path="/driver/report-found"
                element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <ReportFoundItem />
                    </ProtectedRoute>
                }
            />

            {/* Driver Routes */}
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

            {/* Admin Routes */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<StudentsManagement />} />
                <Route path="/admin/profile-changes" element={<ProfileChanges />} />
                <Route path="/admin/passes/approved" element={<ApprovedPasses />} />
                <Route path="/admin/buses" element={<BusManagement />} />
                <Route path="/admin/drivers" element={<DriverManagement />} />
                <Route path="/admin/live-attendance" element={<LiveAttendance />} />
                <Route path="/admin/create-day-ticket" element={<CreateDayTicket />} />
                <Route path="/admin/journey-report" element={<DailyJourneyReport />} />
                <Route path="/admin/checkpoint-analytics" element={<CheckpointAnalytics />} />
                <Route path="/admin/scan-history" element={<ScanHistory />} />
                <Route path="/admin/booking-days" element={<ManageBookingDays />} />
                <Route path="/admin/routes" element={<RouteManagement />} />
                <Route path="/admin/students/:id" element={<StudentDetailView />} />
                <Route path="/admin/journey-summary" element={<DailyJourneySummary />} />
                <Route path="/admin/student-journey" element={<StudentJourneyLogs />} />
                <Route path="/admin/one-day-tickets" element={<DailyTickets />} />

                {/* Lost Found Module */}
                <Route path="/admin/lost-found" element={<LostFoundDashboard />} />
                <Route path="/admin/lost-found/item/:type/:id" element={<AdminItemDetail />} />
                <Route path="/admin/lost-found/analytics" element={<LostFoundAnalytics />} />

                {/* Demand Forecast Module */}
                <Route path="/admin/demand-forecast" element={<DemandForecastDashboard />} />

                {/* Complaints Module */}
                <Route path="/admin/complaints" element={<ComplaintsDashboard />} />

                <Route path="/admin/settings" element={<div>Settings Component</div>} />
            </Route>




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
