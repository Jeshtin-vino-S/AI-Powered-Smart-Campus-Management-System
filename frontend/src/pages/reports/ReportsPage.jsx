import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BarChart3,
  AlertTriangle,
  Download,
  Users,
  ShieldCheck,
  Award,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/at-risk-students');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching AI risk report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportJson = () => {
    if (!data) return;
    const reportData = {
      title: 'Smart Campus AI Academic Risk & Performance Audit',
      generatedAt: new Date().toISOString(),
      totalAnalyzed: data.totalAnalyzed,
      atRiskCount: data.atRiskCount,
      students: data.students || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Campus_Academic_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const students = data?.students || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Academic Reports & AI Audits
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated student academic standing evaluation, attendance drop alerts, and intervention plans
            </p>
          </div>

          <button
            onClick={handleExportJson}
            disabled={loading || !data}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer self-start"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Report</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Evaluated Students</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{data?.totalAnalyzed ?? 0}</p>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Active Academic Records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Students Requiring Advisory</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{data?.atRiskCount ?? 0}</p>
              <p className="text-[11px] font-bold text-rose-600 mt-1">Attendance &lt; 75% or Low Marks</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Healthy Standing Rate</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {data?.totalAnalyzed > 0
                  ? Math.round(((data.totalAnalyzed - data.atRiskCount) / data.totalAnalyzed) * 100)
                  : 100}
                %
              </p>
              <p className="text-[11px] font-bold text-emerald-600 mt-1">Good Academic Progress</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* At-Risk Students Audit Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Student Standing & Risk Predictions</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">Sorted by Risk Index</span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-400 font-semibold">Running predictive models...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No student records evaluated.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department & Sem</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Risk Factors</th>
                    <th className="py-3 px-4">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st) => {
                    const level = st.prediction?.riskLevel || 'low';
                    const isHigh = level === 'high';
                    const isMed = level === 'medium';

                    return (
                      <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{st.rollNumber}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {st.departmentCode} • Sem {st.currentSemester}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isHigh
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isMed
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {level}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600">
                          {Array.isArray(st.prediction?.riskFactors) && st.prediction.riskFactors.length > 0 ? (
                            st.prediction.riskFactors.join(', ')
                          ) : (
                            <span className="text-emerald-600 font-medium">None • On Track</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-sm text-slate-800 font-medium">
                          {Array.isArray(st.prediction?.recommendations) && st.prediction.recommendations.length > 0 ? (
                            st.prediction.recommendations[0]
                          ) : (
                            <span className="text-slate-400">Regular progression</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
