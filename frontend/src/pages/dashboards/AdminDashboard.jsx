import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Award,
  FileSpreadsheet,
  Send,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state for Notice & Report
  const [activeModal, setActiveModal] = useState(null); // 'notice' | null
  const [actionLoading, setActionLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const fetchAdminStats = async () => {
    try {
      const analyticsRes = await api.get('/analytics/admin');
      if (analyticsRes.data?.success) {
        setData(analyticsRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleSendNotice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload = {
        title: noticeForm.title,
        description: noticeForm.description,
        priority: noticeForm.priority,
      };

      const res = await api.post('/notices', payload);
      if (res.data?.success) {
        setModalSuccess('Notice broadcasted to campus successfully!');
        setNoticeForm({ title: '', description: '', priority: 'medium' });
        setTimeout(() => setActiveModal(null), 1200);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to broadcast notice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      title: 'Smart Campus Academic Management Report',
      generatedAt: new Date().toISOString(),
      stats: data?.stats || {},
      departmentDistribution: data?.deptDistribution || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Smart_Campus_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e6bff]" />
          <p className="text-xs font-semibold text-slate-500">Loading campus analytics...</p>
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
        {/* Top Header Row matching 04_Admin_Dashboard.png */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Overview of College Management System
            </p>
          </div>

          {/* Date Badge on the top-right matching 04_Admin_Dashboard.png */}
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-[11px] font-bold text-slate-600 shadow-2xs">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* 4 Stat Cards Row matching 04_Admin_Dashboard.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100/80 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-[#e6fbf5] text-[#0d9488] flex items-center justify-center shadow-2xs">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalStudents ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Total Students</p>
              <span className="inline-block text-[10px] text-teal-600 font-extrabold mt-0.5">Total</span>
            </div>
          </div>

          {/* Card 2: Total Faculty */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100/80 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-[#f4e8ff] text-[#9333ea] flex items-center justify-center shadow-2xs">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalFaculty ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Total Faculty</p>
              <span className="inline-block text-[10px] text-purple-600 font-extrabold mt-0.5">Active</span>
            </div>
          </div>

          {/* Card 3: Departments */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100/80 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center shadow-2xs">
              <GraduationCap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.totalDepartments ?? 0}
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Departments</p>
              <span className="inline-block text-[10px] text-amber-600 font-extrabold mt-0.5">Dept</span>
            </div>
          </div>

          {/* Card 4: Attendance */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100/80 flex flex-col items-center justify-center text-center space-y-2 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {stats.overallAttendanceRate ?? 0}%
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">Attendance</p>
              <span className="inline-block text-[10px] text-sky-600 font-extrabold mt-0.5">Overall</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Academic Performance Chart (Left) + Quick Actions (Right) matching 04_Admin_Dashboard.png */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Academic Performance Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">
                Academic Performance
              </h2>
              <div className="flex items-center space-x-4 text-[11px] font-bold text-slate-500">
                <span className="flex items-center space-x-1.5 text-[#1e6bff]">
                  <span className="w-2 h-2 rounded-full bg-[#1e6bff]"></span>
                  <span>↑ This Year</span>
                </span>
                <span className="flex items-center space-x-1.5 text-purple-600">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>● Last Year</span>
                </span>
              </div>
            </div>

            {/* Recharts Area Chart matching 04_Admin_Dashboard.png */}
            <div className="h-56 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="performanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e6bff" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1e6bff" stopOpacity={0.02} />
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
                      strokeWidth={2.5}
                      dot={{ fill: '#1e6bff', r: 4, stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#1e6bff' }}
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
              {/* Action 1: Add Student -> Navigates to individual Students Page */}
              <button 
                onClick={() => navigate('/admin/students?action=add')}
                className="w-full py-3 px-4 rounded-2xl bg-[#ebf4ff] hover:bg-[#dbeafe] text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3.5 transition-all shadow-2xs"
              >
                <UserPlus className="w-4 h-4 stroke-[2.2]" />
                <span>Add Student</span>
              </button>

              {/* Action 2: Add Faculty -> Navigates to individual Faculty Page */}
              <button 
                onClick={() => navigate('/admin/faculty?action=add')}
                className="w-full py-3 px-4 rounded-2xl bg-[#ebf4ff] hover:bg-[#dbeafe] text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3.5 transition-all shadow-2xs"
              >
                <Users className="w-4 h-4 stroke-[2.2]" />
                <span>Add Faculty</span>
              </button>

              {/* Action 3: Add HOD -> Navigates to individual HOD Page */}
              <button 
                onClick={() => navigate('/admin/hod?action=add')}
                className="w-full py-3 px-4 rounded-2xl bg-[#ebf4ff] hover:bg-[#dbeafe] text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3.5 transition-all shadow-2xs"
              >
                <Award className="w-4 h-4 stroke-[2.2]" />
                <span>Add HOD</span>
              </button>

              {/* Action 4: Send Notice */}
              <button 
                onClick={() => {
                  setModalError('');
                  setModalSuccess('');
                  setActiveModal('notice');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#ebf4ff] hover:bg-[#dbeafe] text-[#1e6bff] font-extrabold text-xs flex items-center space-x-3.5 transition-all shadow-2xs"
              >
                <Send className="w-4 h-4 stroke-[2.2]" />
                <span>Send Notice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notice Modal */}
        {activeModal === 'notice' && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in duration-200">
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {modalSuccess && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {modalError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Modal 3: Send Notice */}
              {activeModal === 'notice' && (
                <form onSubmit={handleSendNotice} className="space-y-3">
                  <h3 className="text-base font-black text-slate-900">Broadcast Campus Notice</h3>
                  <input
                    type="text"
                    placeholder="Notice Title"
                    required
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                  />
                  <textarea
                    rows={3}
                    placeholder="Notice description..."
                    required
                    value={noticeForm.description}
                    onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-[#1e6bff] text-white text-xs font-bold shadow-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {actionLoading ? 'Broadcasting...' : 'Broadcast Notice'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
