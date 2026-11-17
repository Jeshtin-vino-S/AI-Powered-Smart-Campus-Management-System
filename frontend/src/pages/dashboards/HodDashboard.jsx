import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const HodDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHodStats = async () => {
      try {
        const res = await api.get('/analytics/hod');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching HOD analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHodStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e6bff]" />
          <p className="text-xs font-semibold text-slate-500">Loading department analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Real data only from database API (zero hardcoded / zero dummy fallback values)
  const stats = data?.stats || {};
  const departmentName = data?.department || 'Department Overview';
  const barData = data?.semesterPerformance || [];
  const pieData = data?.workload || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Title Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            HOD Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {departmentName}
          </p>
        </div>

        {/* 4 Stat Cards Row matching 05_HOD_Dashboard.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Students */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Students</p>
            </div>
          </div>

          {/* Card 2: Faculty */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalFaculty ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Faculty</p>
            </div>
          </div>

          {/* Card 3: Attendance */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.averageAttendance ?? 0}%
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Attendance</p>
            </div>
          </div>

          {/* Card 4: Subjects */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalSubjects ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Subjects</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Department Performance (Left) + Faculty Workload Donut (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Department Performance Bar Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-4">
              Department Performance
            </h2>

            <div className="h-56 w-full">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="semester" 
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
                    <Bar dataKey="score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No semester performance records available
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Faculty Workload Donut Chart */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-2">
              Faculty Workload
            </h2>

            <div className="flex flex-col items-center justify-center flex-1 my-2">
              {pieData.length > 0 ? (
                <>
                  <div className="w-40 h-40 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 w-full max-w-[200px] mt-2 text-xs font-bold">
                    {pieData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || '#3b82f6' }}></span>
                          <span>{item.name}</span>
                        </div>
                        <span className="text-slate-500">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No faculty teaching load recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HodDashboard;
