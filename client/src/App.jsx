import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TimerProvider } from './context/TimerContext'; // <-- Added TimerProvider
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import Attendance from './pages/student/Attendance';
import Journals from './pages/student/Journals';
import Documents from './pages/student/Documents';

// Staff (Company Supervisor) Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffInterns from './pages/staff/StaffInterns';
import StaffReviews from './pages/staff/StaffReviews';
import PostRequirements from './pages/staff/PostRequirements';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import StudentList from './pages/coordinator/StudentList';
import StudentDetails from './pages/coordinator/StudentDetails';
import ReviewSubmissions from './pages/coordinator/ReviewSubmissions';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCompanies from './pages/admin/ManageCompanies';
import SystemReports from './pages/admin/SystemReports';

function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'coordinator') return <CoordinatorDashboard />;
  if (user?.role === 'staff') return <StaffDashboard />;

  return <StudentDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <TimerProvider> {/* <-- Wrapped with TimerProvider */}
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* DASHBOARD */}
                <Route path="/dashboard" element={<DashboardRouter />} />

                {/* STUDENT */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Attendance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journals"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Journals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Documents />
                    </ProtectedRoute>
                  }
                />

                {/* COMPANY SUPERVISOR */}
                <Route
                  path="/interns"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffInterns />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/supervisor-reviews"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffReviews />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/post-requirements"
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <PostRequirements />
                    </ProtectedRoute>
                  }
                />

                {/* COORDINATOR & ADMIN */}
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <StudentList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students/:studentId"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <StudentDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/review"
                  element={
                    <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                      <ReviewSubmissions />
                    </ProtectedRoute>
                  }
                />

                {/* ADMIN */}
                <Route
                  path="/companies"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageCompanies />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SystemReports />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                path="*"
                element={<Navigate to="/login" replace />}
              />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </TimerProvider>
    </AuthProvider>
  );
}