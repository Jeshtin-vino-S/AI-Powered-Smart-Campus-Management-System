import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Award,
  Layers,
  BookOpen,
} from 'lucide-react';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & form state
  const [modalOpen, setModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Assign HOD Modal
  const [assignModal, setAssignModal] = useState({
    open: false,
    dept: null,
    hodId: '',
    loading: false,
    error: '',
  });

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    establishedYear: 2015,
    intakeCapacity: 120,
    contactEmail: '',
    hodId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, facRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users/faculty/all').catch(() => ({ data: { faculty: [] } })),
      ]);

      if (deptRes.data?.success) {
        setDepartments(deptRes.data.departments || []);
      }
      if (facRes.data?.success) {
        setFacultyMembers(facRes.data.faculty || []);
      }
    } catch (err) {
      console.error('Error fetching departments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        establishedYear: form.establishedYear,
        intakeCapacity: form.intakeCapacity,
        contactEmail: form.contactEmail.trim().toLowerCase(),
        hodId: form.hodId ? Number(form.hodId) : null,
      };

      const res = await api.post('/departments', payload);
      if (res.data?.success) {
        setToastMessage(`Department '${form.name}' created successfully with UG & PG curriculum!`);
        setModalOpen(false);
        setForm({
          name: '',
          code: '',
          description: '',
          establishedYear: 2015,
          intakeCapacity: 120,
          contactEmail: '',
          hodId: '',
        });
        fetchData();
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create department');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignHodSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.dept) return;

    setAssignModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await api.put(`/departments/${assignModal.dept.id}`, {
        hodId: assignModal.hodId ? Number(assignModal.hodId) : null,
      });

      if (res.data?.success) {
        setToastMessage(`Head of Department (HOD) appointed for ${assignModal.dept.name} successfully!`);
        setAssignModal({ open: false, dept: null, hodId: '', loading: false, error: '' });
        fetchData();
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      setAssignModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to update department HOD',
        loading: false,
      }));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Academic Departments
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              College departments offering UG & PG programs, appointed HODs, student enrollments, and faculty members
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {/* Success Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Info Banner on Department & HOD Hierarchy */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-indigo-50/60 border border-blue-100 flex items-start gap-3">
          <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-blue-950">
              Collegiate Department Leadership Hierarchy
            </p>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              In academic institutions, an Academic Department (e.g. <strong>Department of Mathematics</strong> or <strong>Department of Computer Applications</strong>) conducts both <strong>Undergraduate (UG: B.Sc / BCA)</strong> and <strong>Postgraduate (PG: M.Sc / MCA)</strong> programs under a <strong>single Head of Department (HOD)</strong>.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search department by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {filteredDepts.length} Active Departments
          </span>
        </div>

        {/* Departments Cards Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold">Loading departments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDepts.map((dept) => (
              <div
                key={dept.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {dept.code}
                    </span>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {dept.description || 'Department curriculum and research programs'}
                  </p>

                  {/* Programs Badge */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      <Layers className="w-3 h-3 text-blue-600" />
                      UG & PG Programs Included
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  {/* Appointed HOD Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-blue-600" /> Head of Department (HOD)
                      </span>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        {dept.hod?.name || 'Vacant / Not Appointed'}
                      </p>
                      {dept.hod?.email && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          {dept.hod.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setAssignModal({
                          open: true,
                          dept,
                          hodId: dept.hodId ? String(dept.hodId) : '',
                          loading: false,
                          error: '',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition shrink-0 cursor-pointer"
                    >
                      {dept.hod ? 'Change HOD' : 'Appoint HOD'}
                    </button>
                  </div>

                  {/* Student & Faculty Counters */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Enrolled Students</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">
                        {dept.stats?.students ?? 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Faculty Members</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">
                        {dept.stats?.faculty ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Assign / Change HOD Modal */}
      {assignModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Appoint Head of Department</h3>
                <p className="text-xs text-slate-500">{assignModal.dept?.name} ({assignModal.dept?.code})</p>
              </div>
              <button
                onClick={() => setAssignModal({ open: false, dept: null, hodId: '', loading: false, error: '' })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {assignModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignModal.error}</span>
              </div>
            )}

            <form onSubmit={handleAssignHodSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold">Select Faculty / HOD Candidate *</label>
                <select
                  value={assignModal.hodId}
                  onChange={(e) => setAssignModal({ ...assignModal, hodId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="">-- Leave Vacant / Unassigned --</option>
                  {facultyMembers.map((fac) => (
                    <option key={fac.id} value={fac.userId}>
                      {fac.user?.name || 'Faculty Member'} ({fac.designation} - {fac.qualification})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  The selected candidate will head this department covering both UG & PG classes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, dept: null, hodId: '', loading: false, error: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignModal.loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
                >
                  {assignModal.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save HOD Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Academic Department</h3>
                <p className="text-xs text-slate-500">Configure department with UG & PG programs and appoint HOD</p>
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

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Department Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Department of Mathematics"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Department Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. MATH"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Programs Hierarchy Note */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Programs Under this Department:
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Both <strong>Undergraduate (UG: B.Sc / BCA)</strong> and <strong>Postgraduate (PG: M.Sc / MCA)</strong> will operate under this department governed by the appointed HOD.
                </p>
              </div>

              {/* Appoint HOD dropdown */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Appoint Head of Department (HOD)</label>
                <select
                  value={form.hodId}
                  onChange={(e) => setForm({ ...form, hodId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Appoint Later / Vacant --</option>
                  {facultyMembers.map((fac) => (
                    <option key={fac.id} value={fac.userId}>
                      {fac.user?.name || 'Faculty Member'} ({fac.designation} - {fac.qualification})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Description *</label>
                <textarea
                  placeholder="Department curriculum overview, academic focus, and research areas..."
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Established Year *</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={form.establishedYear}
                    onChange={(e) => setForm({ ...form, establishedYear: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Total Intake Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.intakeCapacity}
                    onChange={(e) => setForm({ ...form, intakeCapacity: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Contact Email *</label>
                  <input
                    type="email"
                    placeholder="dept@campus.edu"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DepartmentsPage;