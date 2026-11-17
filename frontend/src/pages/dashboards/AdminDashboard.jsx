import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  FileSpreadsheet,
  BellRing,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/analytics/admin');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e6bff]" />
          <p className="text-xs font-semibold text-slate-500">Loading live campus analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Real data only from database API (zero hardcoded / zero dummy fallback values)
  const stats = data?.stats || {};
  const chartData = data?.performanceTrend || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Title Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Overview of College Management System
          </p>
        </div>

        {/* 4 Stat Cards Row matching 04_Admin_Dashboard.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Total Students</p>
            </div>
          </div>

          {/* Card 2: Total Faculty */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalFaculty ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Total Faculty</p>
            </div>
          </div>

          {/* Card 3: Departments */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalDepartments ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Departments</p>
            </div>
          </div>

          {/* Card 4: Attendance */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1e6bff] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.overallAttendanceRate ?? 0}%
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Attendance</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Academic Performance Chart (Left) + Quick Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Academic Performance Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">
                Academic Performance
              </h2>
              <div className="flex items-center space-x-4 text-[11px] font-bold text-slate-500">
                <span className="flex items-center space-x-1.5 text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-[#1e6bff]"></span>
                  <span>This Year</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span>Last Year</span>
                </span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-56 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="performanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e6bff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1e6bff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#1e6bff"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#performanceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No academic evaluation records found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions matching 04_Admin_Dashboard.png */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-3">
              Quick Actions
            </h2>

            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              <button 
                onClick={() => alert('Add Student wizard')}
                className="w-full py-2.5 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <UserPlus className="w-4 h-4 stroke-[2.2]" />
                <span>Add Student</span>
              </button>

              <button 
                onClick={() => alert('Add Faculty wizard')}
                className="w-full py-2.5 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <Users className="w-4 h-4 stroke-[2.2]" />
                <span>Add Faculty</span>
              </button>

              <button 
                onClick={() => alert('Generate Academic Report feature')}
                className="w-full py-2.5 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                <span>Generate Report</span>
              </button>

              <button 
                onClick={() => alert('Campus Broadcast Notice composer')}
                className="w-full py-2.5 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <BellRing className="w-4 h-4 stroke-[2.2]" />
                <span>Send Notice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
