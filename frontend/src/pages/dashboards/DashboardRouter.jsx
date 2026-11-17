import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import HodDashboard from './HodDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';

export const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#06122d] flex items-center justify-center text-white font-bold text-sm">
        Loading Smart Campus...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'hod':
      return <HodDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <AdminDashboard />;
  }
};

export default DashboardRouter;
