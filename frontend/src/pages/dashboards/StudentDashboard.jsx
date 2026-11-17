import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
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

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        const res = await api.get('/analytics/student');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching student analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e6bff]" />
          <p className="text-xs font-semibold text-slate-500">Loading student records...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Real data only from database API (zero hardcoded / zero dummy fallback values)
  const stats = data?.stats || {};
  const chartData = data?.performanceTrend || [];
  const events = data?.events || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Title Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Your Academic Overview
          </p>
        </div>

        {/* 4 Stat Cards Row matching 07_Student_Dashboard.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Attendance */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.attendancePercentage ?? 0}%
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Attendance</p>
            </div>
          </div>

          {/* Card 2: CGPA */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.cgpa ?? '0.0'}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">CGPA</p>
            </div>
          </div>

          {/* Card 3: Assignments */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalAssignments ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Assignments</p>
            </div>
          </div>

          {/* Card 4: Placements */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.activePlacements ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Placements</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Academic Performance Line Chart (Left) + Upcoming Events (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Academic Performance Chart matching 07_Student_Dashboard.png */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-4">
              Academic Performance
            </h2>

            <div className="h-56 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e6bff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1e6bff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="exam" 
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
                      fill="url(#studentGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No internal marks or exam evaluations recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Events matching 07_Student_Dashboard.png */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-4">
              Upcoming Events
            </h2>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {events.length > 0 ? (
                events.map((evt, idx) => (
                  <div
                    key={evt.id || idx}
                    className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">
                        {evt.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {evt.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No upcoming deadlines or exams
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
