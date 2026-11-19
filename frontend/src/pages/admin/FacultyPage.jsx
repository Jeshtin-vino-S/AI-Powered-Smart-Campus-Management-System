import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  GraduationCap,
  UserPlus,
  Search,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  Building2,
  Briefcase,
  Award,
  Eye,
  EyeOff,
  Hash,
  Users,
} from 'lucide-react';

export const FacultyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'list' | 'add'
  const initialMode = searchParams.get('action') === 'add' ? 'add' : 'list';
  const [viewMode, setViewMode] = useState(initialMode);

  // Path helper for navigating to faculty details
  const getFacultyDetailsPath = (facultyId) => {
    if (location.pathname.startsWith('/hod')) return `/hod/faculty/${facultyId}`;
    return `/admin/faculty/${facultyId}`;
  };

  // Data states
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form state with all fields required by backend POST /api/users/faculty
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    designation: 'Assistant Professor',
    qualification: 'M.Tech / Ph.D',
    phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch faculty members & departments from real API
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [facultyRes, deptsRes] = await Promise.all([
        api.get('/users/faculty/all'),
        api.get('/departments'),
      ]);

      if (facultyRes.data?.success && facultyRes.data?.faculty) {
        setFacultyList(facultyRes.data.faculty);
      }

      if (deptsRes.data?.success) {
        const depts = deptsRes.data.departments || deptsRes.data.data || [];
        setDepartments(depts);
        if (depts.length > 0 && !formData.department) {
          setFormData((prev) => ({
            ...prev,
            department: depts[0].id,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching faculty or departments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update view mode when URL changes
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setViewMode('add');
    }
  }, [searchParams]);

  // Handle Form Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    // Phone validation (exactly 10 digits, starts with 6-9)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      setSubmitting(false);
      return;
    }

    if (!formData.qualification.trim()) {
      setFormError('Please enter faculty qualification');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        department: formData.department,
        designation: formData.designation.trim(),
        qualification: formData.qualification.trim(),
        phone: cleanPhone,
      };

      const res = await api.post('/users/faculty', payload);

      if (res.data?.success) {
        const profileInfo = res.data.profile || {};
        const successMsg = `Faculty appointed successfully! Auto-generated Employee ID: ${profileInfo.employeeId || 'Generated'}`;
        setFormSuccess(successMsg);

        // Reset form
        const defaultDept = departments[0];
        setFormData({
          name: '',
          email: '',
          password: '',
          department: defaultDept?.id || '',
          designation: 'Assistant Professor',
          qualification: 'M.Tech / Ph.D',
          phone: '',
        });

        // Re-fetch real faculty
        await fetchData();

        // Switch back to list after short delay
        setTimeout(() => {
          setViewMode('list');
          navigate('/admin/faculty', { replace: true });
        }, 1500);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to appoint faculty. Please check input details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Faculty Handler
  const handleDeleteFaculty = async (userId, facultyName) => {
    if (!window.confirm(`Are you sure you want to remove ${facultyName}? This will permanently delete the faculty profile and user login.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.data?.success) {
        setFacultyList((prev) => prev.filter((f) => f.user?.id !== userId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete faculty');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter faculty based on search and department
  const filteredFaculty = facultyList.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = !selectedDept || String(f.departmentId) === String(selectedDept);

    return matchesSearch && matchesDept;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-in fade-in duration-150">
        {/* Top Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {viewMode === 'add' ? 'Appoint New Faculty' : 'Faculty Directory'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {facultyList.length} Total
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {viewMode === 'add'
                ? 'Fill in all mandatory professional & account details required by campus database'
                : 'Manage faculty profiles, designations, assigned departments, and credentials'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {viewMode === 'add' ? (
              <button
                onClick={() => {
                  setViewMode('list');
                  navigate('/admin/faculty', { replace: true });
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Directory</span>
              </button>
            ) : (
              <>
                <button
                  onClick={fetchData}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all shadow-2xs disabled:opacity-50"
                  title="Refresh List"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setViewMode('add');
                    setFormSuccess('');
                    setFormError('');
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1e6bff] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Appoint Faculty</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* VIEW 1: APPOINT NEW FACULTY FORM */}
        {viewMode === 'add' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100/80 max-w-4xl mx-auto">
            {formSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-800 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Personal & Login Credentials */}
              <div>
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  <Mail className="w-3.5 h-3.5 text-[#1e6bff]" />
                  <span>Personal & Login Credentials</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Full Name (with title) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Dr. K. Rajesh"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Official Faculty Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. rajesh.faculty@smartcampus.edu"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Initial Password (Min 6 chars) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile Number (10 digits) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Details */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  <Briefcase className="w-3.5 h-3.5 text-[#1e6bff]" />
                  <span>Department & Professional Designation</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Assigned Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Senior Lecturer">Senior Lecturer</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Highest Qualification <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      required
                      placeholder="e.g. Ph.D, M.Tech, MCA"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    />
                  </div>

                  {/* Automatic Generation Notice */}
                  <div className="md:col-span-3 flex items-center space-x-2.5 p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-purple-800 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 animate-pulse"></span>
                    <span>Employee ID (e.g. FAC-CSE-001) will be automatically generated by backend API upon appointment.</span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    navigate('/admin/faculty', { replace: true });
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#1e6bff] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Appointing Faculty...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Submit & Appoint Faculty</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 2: FACULTY DIRECTORY LIST */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:bg-white transition-all"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-2.5 w-full md:w-auto">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Faculty Table */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100/90 overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#1e6bff] animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Loading faculty directory...</p>
                </div>
              ) : filteredFaculty.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No faculty members found</h3>
                  <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                    {searchQuery || selectedDept
                      ? 'No faculty match your filter criteria. Try clearing filters.'
                      : 'No faculty accounts appointed yet. Click "+ Appoint Faculty" above to add the first faculty.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 select-none">
                        <th className="py-3 px-5">Faculty</th>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Designation & Qualification</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredFaculty.map((faculty) => {
                        const userName = faculty.user?.name || 'Faculty Member';
                        const userEmail = faculty.user?.email || 'N/A';
                        const userPhone = faculty.user?.phone || 'N/A';
                        const deptCode = faculty.department?.code || 'N/A';

                        return (
                          <tr key={faculty.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Faculty Name & Avatar */}
                            <td className="py-3.5 px-5">
                              <div
                                onClick={() => navigate(getFacultyDetailsPath(faculty.id))}
                                className="flex items-center space-x-3 cursor-pointer group select-none"
                                title="Click to view full faculty details"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-[#1e6bff] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                                    {userName}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-400 truncate">{userEmail}</div>
                                </div>
                              </div>
                            </td>

                            {/* Employee ID */}
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-extrabold tracking-wide">
                                {faculty.employeeId || 'FAC-001'}
                              </span>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-extrabold">
                                {deptCode}
                              </span>
                            </td>

                            {/* Designation & Qualification */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{faculty.designation}</div>
                              <div className="text-[11px] font-medium text-slate-400">{faculty.qualification}</div>
                            </td>

                            {/* Phone */}
                            <td className="py-3.5 px-4 font-medium text-slate-600">
                              +91 {userPhone}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => navigate(getFacultyDetailsPath(faculty.id))}
                                  className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
                                  title="View Full Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFaculty(faculty.user?.id, userName)}
                                  disabled={deletingId === faculty.user?.id}
                                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                  title="Remove Faculty"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyPage;
