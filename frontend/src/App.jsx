import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import DashboardRouter from './pages/dashboards/DashboardRouter';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import HodDashboard from './pages/dashboards/HodDashboard';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';

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

          {/* Fallback to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
