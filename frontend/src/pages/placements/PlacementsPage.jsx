import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  ExternalLink,
  Users,
  Send,
  Clock,
} from 'lucide-react';

export const PlacementsPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isAdminOrHod = role === 'admin' || role === 'hod';

  const [placements, setPlacements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);

  // Applications view for Admin
  const [appsModalOpen, setAppsModalOpen] = useState(false);
  const [applicationsList, setApplicationsList] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    companyName: '',
    jobRole: '',
    jobType: 'full-time',
    salaryPackage: '₹12.0 LPA',
    location: 'Bangalore',
    eligibleDepartments: [],
    minimumCgpa: 7.0,
    applicationDeadline: '',
    jobDescription: '',
    requiredSkills: 'React, Node.js, SQL',
  });

  const [applyForm, setApplyForm] = useState({
    resumeUrl: '',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Placements
  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const [res, deptRes] = await Promise.all([
        api.get('/placements'),
        api.get('/departments').catch(() => ({ data: { departments: [] } })),
      ]);

      if (res.data?.success) {
        setPlacements(res.data.placements || []);
      }
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching placements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, [role]);

  // Handle Admin Create
  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        ...createForm,
        minimumCgpa: Number(createForm.minimumCgpa),
        eligibleDepartments:
          createForm.eligibleDepartments.length > 0
            ? createForm.eligibleDepartments
            : departments.map((d) => d.id),
      };

      const res = await api.post('/placements', payload);
      if (res.data?.success) {
        setToastMessage('Placement drive posted successfully!');
        setCreateModalOpen(false);
        fetchPlacements();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to post drive');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Student Apply
  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedDrive) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/placements/${selectedDrive.id}/apply`, applyForm);
      if (res.data?.success) {
        setToastMessage('Application submitted successfully!');
        setApplyModalOpen(false);
        setApplyForm({ resumeUrl: '', notes: '' });
        fetchPlacements();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle View Applications (Admin)
  const handleViewApplications = async (drive) => {
    setSelectedDrive(drive);
    setAppsModalOpen(true);
    setAppsLoading(true);
    try {
      const res = await api.get(`/placements/${drive.id}/applications`);
      if (res.data?.success) {
        setApplicationsList(res.data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (appId, status) => {
    try {
      const res = await api.put(`/placements/applications/${appId}/status`, { status });
      if (res.data?.success) {
        alert(`Status updated to ${status}`);
        handleViewApplications(selectedDrive);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Campus Placements & Drives
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isAdminOrHod
                ? 'Coordinate company recruitment drives, review applicants, and manage selection pipeline'
                : 'Explore campus recruitment opportunities, verify CGPA eligibility, and apply with resume'}
            </p>
          </div>

          {isAdminOrHod && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Drive</span>
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

        {/* Placement Drives Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold">Loading placement drives...</p>
          </div>
        ) : placements.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Active Drives</h3>
            <p className="text-xs text-slate-400 mt-1">There are no company recruitment drives open at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {placements.map((drive) => {
              const isApplied = Boolean(drive.myApplication);

              return (
                <div
                  key={drive.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {drive.companyName}
                      </span>
                      {role === 'student' ? (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            drive.isEligible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {drive.isEligible ? 'Eligible' : 'Cutoff Not Met'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                          Min CGPA: {drive.minimumCgpa}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-blue-700 leading-tight">
                      {drive.jobRole}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {drive.salaryPackage}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" /> {drive.location}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {drive.jobDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Deadline: <strong className="text-slate-800">{new Date(drive.applicationDeadline).toLocaleDateString()}</strong></span>
                      <span className="capitalize">{drive.jobType}</span>
                    </div>

                    {isAdminOrHod ? (
                      <button
                        onClick={() => handleViewApplications(drive)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>View Applicants</span>
                      </button>
                    ) : isApplied ? (
                      <div className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs text-center border border-emerald-200">
                        Status: <span className="uppercase">{drive.myApplication.status}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDrive(drive);
                          setApplyModalOpen(true);
                        }}
                        disabled={!drive.isEligible}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Apply with Resume</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Post Drive Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post Recruitment Drive</h3>
                <p className="text-xs text-slate-500">Publish corporate drive for eligible students</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
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

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google Cloud"
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Job Designation *</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Support Engineer"
                    value={createForm.jobRole}
                    onChange={(e) => setCreateForm({ ...createForm, jobRole: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Salary Package CTC *</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹14.5 LPA"
                    value={createForm.salaryPackage}
                    onChange={(e) => setCreateForm({ ...createForm, salaryPackage: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Job Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Minimum CGPA *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max="10.0"
                    value={createForm.minimumCgpa}
                    onChange={(e) => setCreateForm({ ...createForm, minimumCgpa: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Deadline *</label>
                  <input
                    type="date"
                    value={createForm.applicationDeadline}
                    onChange={(e) => setCreateForm({ ...createForm, applicationDeadline: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Job Description *</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities and interview rounds..."
                  value={createForm.jobDescription}
                  onChange={(e) => setCreateForm({ ...createForm, jobDescription: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
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
                  <span>Publish Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Apply Modal */}
      {applyModalOpen && selectedDrive && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Apply for Recruitment Drive</h3>
                <p className="text-xs text-slate-500">{selectedDrive.companyName} — {selectedDrive.jobRole}</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
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

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Resume Link (Google Drive / LinkedIn) *</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={applyForm.resumeUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Cover Note / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Tell the placement team about your key strengths..."
                  value={applyForm.notes}
                  onChange={(e) => setApplyForm({ ...applyForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
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
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Applications Review Modal */}
      {appsModalOpen && selectedDrive && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Applicants List</h3>
                <p className="text-xs text-slate-500">{selectedDrive.companyName} • {selectedDrive.jobRole}</p>
              </div>
              <button
                onClick={() => setAppsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {appsLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : applicationsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">
                  No applications received yet.
                </p>
              ) : (
                applicationsList.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {app.student?.user?.name || 'Student Candidate'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {app.student?.registrationNumber} • CGPA: <strong className="text-slate-800">{app.student?.cgpa}</strong>
                      </div>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Resume</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {app.status}
                      </span>
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PlacementsPage;
