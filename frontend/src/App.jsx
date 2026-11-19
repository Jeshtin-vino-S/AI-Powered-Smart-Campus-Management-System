import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Core Public & Router Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DashboardRouter from './pages/dashboards/DashboardRouter';

// Role Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import HodDashboard from './pages/dashboards/HodDashboard';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

// User & Department Directories
import StudentsPage from './pages/admin/StudentsPage';
import StudentDetailsPage from './pages/admin/StudentDetailsPage';
import FacultyPage from './pages/admin/FacultyPage';
import FacultyDetailsPage from './pages/admin/FacultyDetailsPage';
import HodPage from './pages/admin/HodPage';
import HodDetailsPage from './pages/admin/HodDetailsPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';

// Academic Modules
import AttendancePage from './pages/attendance/AttendancePage';
import TimetablePage from './pages/timetable/TimetablePage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import ExaminationsPage from './pages/exams/ExaminationsPage';
import PlacementsPage from './pages/placements/PlacementsPage';
import AiAssistantPage from './pages/assistant/AiAssistantPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Unified Automatic Role-based Dashboard */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Role-specific Explicit Dashboard Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/hod/dashboard" element={<HodDashboard />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          {/* Students, Faculty & HOD Directories */}
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/students/:id" element={<StudentDetailsPage />} />
          <Route path="/admin/faculty" element={<FacultyPage />} />
          <Route path="/admin/faculty/:id" element={<FacultyDetailsPage />} />
          <Route path="/admin/hod" element={<HodPage />} />
          <Route path="/admin/hod/:id" element={<HodDetailsPage />} />
          <Route path="/hod/students" element={<StudentsPage />} />
          <Route path="/hod/students/:id" element={<StudentDetailsPage />} />
          <Route path="/hod/faculty" element={<FacultyPage />} />
          <Route path="/hod/faculty/:id" element={<FacultyDetailsPage />} />
          <Route path="/faculty/students" element={<StudentsPage />} />
          <Route path="/faculty/students/:id" element={<StudentDetailsPage />} />

          {/* Departments Directory */}
          <Route path="/admin/departments" element={<DepartmentsPage />} />

          {/* Dynamic Attendance (Faculty QR & Student Scanner) */}
          <Route path="/admin/attendance" element={<AttendancePage />} />
          <Route path="/hod/attendance" element={<AttendancePage />} />
          <Route path="/faculty/attendance" element={<AttendancePage />} />
          <Route path="/student/attendance" element={<AttendancePage />} />

          {/* Timetable Grid & Auto-Generator */}
          <Route path="/admin/timetable" element={<TimetablePage />} />
          <Route path="/hod/timetable" element={<TimetablePage />} />
          <Route path="/faculty/timetable" element={<TimetablePage />} />
          <Route path="/student/timetable" element={<TimetablePage />} />

          {/* Assignments & Grading */}
          <Route path="/admin/assignments" element={<AssignmentsPage />} />
          <Route path="/faculty/assignments" element={<AssignmentsPage />} />
          <Route path="/student/assignments" element={<AssignmentsPage />} />

          {/* Examinations & Marks */}
          <Route path="/admin/examinations" element={<ExaminationsPage />} />
          <Route path="/faculty/examinations" element={<ExaminationsPage />} />
          <Route path="/student/examinations" element={<ExaminationsPage />} />

          {/* Campus Placements */}
          <Route path="/admin/placements" element={<PlacementsPage />} />
          <Route path="/student/placements" element={<PlacementsPage />} />

          {/* AI Campus Assistant */}
          <Route path="/student/assistant" element={<AiAssistantPage />} />
          <Route path="/faculty/assistant" element={<AiAssistantPage />} />
          <Route path="/admin/assistant" element={<AiAssistantPage />} />

          {/* Campus Notices & Notifications */}
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/hod/notifications" element={<NotificationsPage />} />
          <Route path="/faculty/notifications" element={<NotificationsPage />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />

          {/* AI Reports & Analytics */}
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/hod/analytics" element={<ReportsPage />} />

          {/* Settings & Profile */}
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/hod/settings" element={<SettingsPage />} />
          <Route path="/faculty/settings" element={<SettingsPage />} />
          <Route path="/student/settings" element={<SettingsPage />} />

          {/* Fallback to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
