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
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role || 'admin';

  // Role-specific menus strictly matching the backend capabilities
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Students', path: '/admin/students', icon: Users },
          { label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
          { label: 'HODs', path: '/admin/hod', icon: Building2 },
          { label: 'Departments', path: '/admin/departments', icon: Building2 },
          { label: 'Attendance', path: '/admin/attendance', icon: QrCode },
          { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
          { label: 'Placements', path: '/admin/placements', icon: Briefcase },
          { label: 'Notifications', path: '/admin/notifications', icon: Bell },
          { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
          { label: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      case 'hod':
        return [
          { label: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
          { label: 'Faculty', path: '/hod/faculty', icon: GraduationCap },
          { label: 'Students', path: '/hod/students', icon: Users },
          { label: 'Timetable', path: '/hod/timetable', icon: Calendar },
          { label: 'Attendance', path: '/hod/attendance', icon: QrCode },
          { label: 'Analytics', path: '/hod/analytics', icon: BarChart3 },
          { label: 'Notifications', path: '/hod/notifications', icon: Bell },
          { label: 'Settings', path: '/hod/settings', icon: Settings },
        ];
      case 'faculty':
        return [
          { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
          { label: 'Attendance', path: '/faculty/attendance', icon: QrCode },
          { label: 'Assignments', path: '/faculty/assignments', icon: BookOpen },
          { label: 'Timetable', path: '/faculty/timetable', icon: Calendar },
          { label: 'Examinations', path: '/faculty/examinations', icon: FileCheck },
          { label: 'Students', path: '/faculty/students', icon: Users },
          { label: 'Notifications', path: '/faculty/notifications', icon: Bell },
          { label: 'Settings', path: '/faculty/settings', icon: Settings },
        ];
      case 'student':
        return [
          { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { label: 'Attendance', path: '/student/attendance', icon: QrCode },
          { label: 'Timetable', path: '/student/timetable', icon: Calendar },
          { label: 'Assignments', path: '/student/assignments', icon: BookOpen },
          { label: 'Examinations', path: '/student/examinations', icon: FileCheck },
          { label: 'Placements', path: '/student/placements', icon: Briefcase },
          { label: 'AI Assistant', path: '/student/assistant', icon: Sparkles },
          { label: 'Notifications', path: '/student/notifications', icon: Bell },
          { label: 'Settings', path: '/student/settings', icon: Settings },
        ];
      default:
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // Ignore
    }
    navigate('/login');
  };

  return (
    <aside className="w-56 lg:w-60 h-screen bg-white text-slate-700 flex flex-col justify-between shrink-0 select-none border-r border-slate-200/90 py-4 px-3 font-sans shadow-xs">
      {/* Top Brand Logo */}
      <div className="space-y-4">
        <div 
          onClick={() => navigate(`/${role}/dashboard`)}
          className="flex items-center space-x-2.5 px-3 py-1 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">Smart Campus</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Portal</span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 custom-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 stroke-[2.2] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button at Bottom */}
      <div className="pt-2 border-t border-slate-100 px-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
