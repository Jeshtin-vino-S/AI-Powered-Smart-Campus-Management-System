import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Search, Bell, ChevronDown, LogOut, Settings, User, CheckCircle2, AlertCircle } from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const roleLabels = {
    admin: 'Admin',
    hod: 'HOD',
    faculty: 'Faculty',
    student: 'Student',
  };

  const roleDisplay = roleLabels[user?.role] || 'Admin';

  // Fetch real campus notifications from API
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notices');
        if (isMounted && res.data?.success && Array.isArray(res.data.notices)) {
          setNotifications(res.data.notices);
        }
      } catch (err) {
        // Quiet fail if offline or not permitted
      }
    };

    if (user) {
      fetchNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-3 px-6 bg-transparent select-none shrink-0 relative z-30">
      {/* Search Input Bar matching 04_Admin_Dashboard.png */}
      <div className="relative w-64 sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 stroke-[2.2]" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 bg-white/95 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:bg-white transition-all shadow-2xs"
        />
      </div>

      {/* Right Controls: Notification Bell + User Avatar Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Notification Bell (No default dot; dot only renders when there are real notices) */}
        <div className="relative" ref={notifRef}>
          <button 
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setDropdownOpen(false);
            }}
            className="relative w-9 h-9 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer hover:bg-slate-50"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {/* Real notification indicator: only shown if active notifications exist */}
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 px-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold text-slate-800">Campus Notices</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#1e6bff]">
                  {notifications.length} New
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 font-medium">No new notices</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                      <div className="text-xs font-bold text-slate-800 truncate">{n.title}</div>
                      <div className="text-[11px] font-medium text-slate-500 line-clamp-2 mt-0.5">{n.content}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill with working Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 bg-transparent pl-1 pr-2 py-1 rounded-2xl cursor-pointer hover:bg-white/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 via-pink-400 to-[#1e6bff] p-0.5 shadow-xs overflow-hidden shrink-0">
              <img 
                src={user?.avatar || '/assets/userdummy.jpg'} 
                alt={user?.name || 'User Profile'} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/userdummy.jpg';
                }}
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <span className="text-xs font-black text-slate-800">{roleDisplay}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 stroke-[2.5] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* User Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* User Bio Header */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-black text-slate-900 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[11px] font-medium text-slate-400 truncate">{user?.email || 'admin@smartcampus.edu'}</p>
                <div className="mt-1.5 flex items-center space-x-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#1e6bff]">
                    {roleDisplay}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Online</span>
                  </span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(`/${user?.role || 'admin'}/settings`);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </button>
              </div>

              {/* Working Logout Action */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
