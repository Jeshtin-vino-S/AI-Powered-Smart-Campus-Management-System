import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, ChevronDown } from 'lucide-react';

export const Header = () => {
  const { user } = useAuth();

  const roleLabels = {
    admin: 'Admin',
    hod: 'HOD',
    faculty: 'Faculty',
    student: 'Student',
  };

  const roleDisplay = roleLabels[user?.role] || 'User';

  // Format date like "Thu, Nov 13, 2025" from UI screenshots
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="w-full flex items-center justify-between py-3 px-6 bg-transparent select-none shrink-0">
      {/* Search Input Bar */}
      <div className="relative w-64 sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 stroke-[2.2]" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 bg-white/90 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Right Controls: Notification, User Profile, and Date Badge */}
      <div className="flex items-center space-x-4 sm:space-x-5">
        {/* Notification Bell */}
        <button 
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
        </button>

        {/* User Profile Dropdown Pill */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200/80 pl-1.5 pr-3 py-1 rounded-2xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-400 to-[#1e6bff] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name[0] : roleDisplay[0]
            )}
          </div>
          <span className="text-xs font-bold text-slate-800">{roleDisplay}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
        </div>

        {/* Date Badge matching UI screenshots */}
        <div className="hidden lg:flex items-center px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-600 shadow-2xs">
          {todayFormatted}
        </div>
      </div>
    </header>
  );
};

export default Header;
