import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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
              <Route path="/dashboard" element={<DashboardRouter />} />

              {/* STUDENT */}
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/journals" element={<Journals />} />
              <Route path="/documents" element={<Documents />} />

              {/* STAFF (COMPANY SUPERVISOR) */}
              <Route path="/interns" element={<StaffInterns />} />
              <Route path="/post-requirements" element={<PostRequirements />} />

              {/* COORDINATOR & ADMIN */}
              <Route path="/students" element={<StudentList />} />
              <Route
                path="/students/:studentId"
                element={<StudentDetails />}
              />
              <Route path="/review" element={<ReviewSubmissions />} />

              {/* ADMIN ONLY */}
              <Route path="/companies" element={<ManageCompanies />} />
              <Route path="/reports" element={<SystemReports />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}