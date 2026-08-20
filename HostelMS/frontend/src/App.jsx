import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import StudentRegistration from './pages/StudentRegistration';
import AdminDashboard from './pages/admin/Dashboard';
import HostelsPage from './pages/admin/Hostels';
import RoomsPage from './pages/admin/Rooms';
import StudentsPage from './pages/admin/Students';
import PaymentsPage from './pages/admin/Payments';
import ComplaintsPage from './pages/admin/Complaints';
import VisitorsPage from './pages/admin/Visitors';
import AnalyticsPage from './pages/admin/Analytics';
import StudentApprovals from './pages/admin/StudentApprovals';

import WardenDashboard from './pages/warden/Dashboard';

import StudentDashboard from './pages/student/Dashboard';
import MyRoom from './pages/student/MyRoom';
import BrowseRooms from './pages/student/BrowseRooms';

import NotificationsPage from './pages/Notifications';

// Route guards
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/student-registration" element={user ? <Navigate to={`/${user.role}`} replace /> : <StudentRegistration />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<RequireAuth roles={['admin']}><DashboardLayout /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="hostels" element={<HostelsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="residents" element={<StudentsPage />} />
        <Route path="student-approvals" element={<StudentApprovals />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Warden routes */}
      <Route path="/warden" element={<RequireAuth roles={['warden']}><DashboardLayout /></RequireAuth>}>
        <Route index element={<WardenDashboard />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="student-approvals" element={<StudentApprovals />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<RequireAuth roles={['student']}><DashboardLayout /></RequireAuth>}>
        <Route index element={<StudentDashboard />} />
        <Route path="room" element={<MyRoom />} />
        <Route path="browse-rooms" element={<BrowseRooms />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '14px', fontFamily: '"DM Sans", sans-serif' },
            success: { duration: 3000 },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
