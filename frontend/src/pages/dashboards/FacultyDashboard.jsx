import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  BookOpen,
  Users,
  ShieldCheck,
  FileText,
  Clock,
  QrCode,
  FilePlus,
  Upload,
  Loader2,
} from 'lucide-react';

export const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacultyStats = async () => {
      try {
        const res = await api.get('/analytics/faculty');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching faculty analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e6bff]" />
          <p className="text-xs font-semibold text-slate-500">Loading faculty workload...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Real data only from database API (zero hardcoded / zero dummy fallback values)
  const stats = data?.stats || {};
  const todayClasses = data?.todayClasses || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Title Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Faculty Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage your classes and students
          </p>
        </div>

        {/* 4 Stat Cards Row matching 06_Faculty_Dashboard.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Classes */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalClasses ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Classes</p>
            </div>
          </div>

          {/* Card 2: Students */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.enrolledStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Students</p>
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

          {/* Card 4: Assignments */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalAssignments ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Assignments</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Today's Classes (Left) + Quick Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Today's Classes List matching 06_Faculty_Dashboard.png */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-4">
              Today's Classes
            </h2>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {todayClasses.length > 0 ? (
                todayClasses.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {item.time} - {item.subjectCode} ({item.subjectName})
                      </span>
                    </div>

                    <button 
                      onClick={() => alert(`View details for class session ${item.subjectCode}`)}
                      className="px-4 py-1.5 rounded-full bg-sky-100 hover:bg-sky-200 text-[#1e6bff] font-extrabold text-[11px] shadow-2xs transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No classes scheduled for today
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions matching 06_Faculty_Dashboard.png */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h2 className="text-sm font-black text-slate-900 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <button 
                onClick={() => alert('Take QR Attendance Session')}
                className="w-full py-3 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <QrCode className="w-4 h-4 stroke-[2.2]" />
                <span>Take Attendance</span>
              </button>

              <button 
                onClick={() => alert('Create new student assignment')}
                className="w-full py-3 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <FilePlus className="w-4 h-4 stroke-[2.2]" />
                <span>Create Assignment</span>
              </button>

              <button 
                onClick={() => alert('Upload student evaluation marks')}
                className="w-full py-3 px-4 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3 transition-all border border-sky-100/60"
              >
                <Upload className="w-4 h-4 stroke-[2.2]" />
                <span>Upload Marks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
