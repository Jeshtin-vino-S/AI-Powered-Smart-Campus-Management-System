import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  QrCode,
  BookOpen,
  FileCheck,
  Briefcase,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Award,
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role || 'admin';

  // Role-specific menus strictly matching the design images
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Students', path: '/admin/students', icon: Users },
          { label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
          { label: 'Departments', path: '/admin/departments', icon: Building2 },
          { label: 'Attendance', path: '/admin/attendance', icon: QrCode },
          { label: 'Assignments', path: '/admin/assignments', icon: BookOpen },
          { label: 'Examinations', path: '/admin/examinations', icon: FileCheck },
          { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
          { label: 'Placements', path: '/admin/placements', icon: Briefcase },
          { label: 'Notifications', path: '/admin/notifications', icon: Bell },
          { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
          { label: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      case 'hod':
        return [
          { label: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
          { label: 'Department', path: '/hod/department', icon: Building2 },
          { label: 'Faculty', path: '/hod/faculty', icon: GraduationCap },
          { label: 'Students', path: '/hod/students', icon: Users },
          { label: 'Analytics', path: '/hod/analytics', icon: BarChart3 },
          { label: 'Notifications', path: '/hod/notifications', icon: Bell },
        ];
      case 'faculty':
        return [
          { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
          { label: 'Attendance', path: '/faculty/attendance', icon: QrCode },
          { label: 'Assignments', path: '/faculty/assignments', icon: BookOpen },
          { label: 'Examinations', path: '/faculty/examinations', icon: FileCheck },
          { label: 'Marks', path: '/faculty/marks', icon: Award },
          { label: 'Students', path: '/faculty/students', icon: Users },
          { label: 'Notifications', path: '/faculty/notifications', icon: Bell },
        ];
      case 'student':
        return [
          { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { label: 'Attendance', path: '/student/attendance', icon: QrCode },
          { label: 'Assignments', path: '/student/assignments', icon: BookOpen },
          { label: 'Examinations', path: '/student/examinations', icon: FileCheck },
          { label: 'Timetable', path: '/student/timetable', icon: Calendar },
          { label: 'Placements', path: '/student/placements', icon: Briefcase },
          { label: 'Notifications', path: '/student/notifications', icon: Bell },
        ];
      default:
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-56 lg:w-60 h-screen bg-[#06122d] text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-white/5 py-4 px-3 font-sans">
      {/* Top Brand Logo matching UI images */}
      <div className="space-y-4">
        <div 
          onClick={() => navigate(`/${role}/dashboard`)}
          className="flex items-center space-x-2.5 px-3 py-1.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-[#1e6bff] flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-all">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-base font-black tracking-tight text-white">Smart Campus</span>
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#1e6bff] text-white shadow-md shadow-blue-600/30 font-extrabold translate-x-0.5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[2.2] ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button at Bottom */}
      <div className="pt-2 border-t border-white/10 px-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
