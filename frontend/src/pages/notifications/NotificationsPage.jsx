import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Bell,
  Send,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Users,
} from 'lucide-react';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const canPostNotice = role === 'admin' || role === 'hod' || role === 'faculty';

  const [notices, setNotices] = useState([]);
  const [personalNotifs, setPersonalNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetRoles: 'all',
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const [noticeRes, notifRes] = await Promise.all([
        api.get('/notices'),
        api.get('/notifications').catch(() => ({ data: { notifications: [] } })),
      ]);

      if (noticeRes.data?.success) setNotices(noticeRes.data.notices || []);
      if (notifRes.data?.success) setPersonalNotifs(notifRes.data.notifications || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/notices', form);
      if (res.data?.success) {
        setToastMessage('Notice broadcasted successfully to campus!');
        setModalOpen(false);
        setForm({ title: '', content: '', priority: 'medium', targetRoles: 'all' });
        fetchNotices();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to post notice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this broadcast notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert('Failed to delete notice');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Campus Notices & Broadcasts
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official circulars, academic announcements, and real-time personal alerts
            </p>
          </div>

          {canPostNotice && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Notice</span>
            </button>
          )}
        </div>

        {/* Success Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Notice Feed */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold">Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Active Notices</h3>
            <p className="text-xs text-slate-400 mt-1">The campus notice board is currently clear.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => {
              const isUrgent = n.priority === 'urgent' || n.priority === 'high';

              return (
                <div
                  key={n.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3 ${
                    isUrgent ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {n.priority}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">{n.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      {(role === 'admin' || (role === 'hod' && n.postedBy?.id === user?.id)) && (
                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {n.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Posted by: <strong className="text-slate-700">{n.postedBy?.name || 'Administrator'}</strong>
                    </span>
                    <span className="capitalize">Audience: {Array.isArray(n.targetRoles) ? n.targetRoles.join(', ') : n.targetRoles}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Broadcast Campus Notice</h3>
                <p className="text-xs text-slate-500">Post announcements to student and faculty portals</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Notice Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule for Mid-Term Practical Evaluations"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Priority Level *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Normal / Medium</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Target Audience *</label>
                  <select
                    value={form.targetRoles}
                    onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="all">All Campus Members</option>
                    <option value="student">Students Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Notice Content & Details *</label>
                <textarea
                  rows={4}
                  placeholder="Enter full notice announcement text..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationsPage;
