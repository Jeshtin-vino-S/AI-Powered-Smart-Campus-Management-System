import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Hash,
  Award,
} from 'lucide-react';

export const StudentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'list' | 'add'
  const initialMode = searchParams.get('action') === 'add' ? 'add' : 'list';
  const [viewMode, setViewMode] = useState(initialMode);

  // Data states
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Path helper for navigating to student details
  const getStudentDetailsPath = (studentId) => {
    if (location.pathname.startsWith('/hod')) return `/hod/students/${studentId}`;
    if (location.pathname.startsWith('/faculty')) return `/faculty/students/${studentId}`;
    return `/admin/students/${studentId}`;
  };

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form state with all fields required by backend POST /api/users/student
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    currentSemester: 1,
    section: 'A',
    academicYear: `${currentYear}-${currentYear + 1}`,
    phone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch students & departments from real API
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [studentsRes, deptsRes] = await Promise.all([
        api.get('/users/students/filter'),
        api.get('/departments'),
      ]);

      if (studentsRes.data?.success && studentsRes.data?.students) {
        setStudents(studentsRes.data.students);
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
      console.error('Error fetching students or departments:', err);
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

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        department: formData.department,
        currentSemester: Number(formData.currentSemester),
        section: formData.section.trim().toUpperCase(),
        academicYear: formData.academicYear.trim(),
        phone: cleanPhone,
      };

      const res = await api.post('/users/student', payload);

      if (res.data?.success) {
        const studentInfo = res.data.profile || {};
        const successMsg = `Student enrolled successfully! Auto-generated Roll No: ${studentInfo.rollNumber || 'Generated'} | Reg No: ${studentInfo.registrationNumber || 'Generated'}`;
        setFormSuccess(successMsg);

        // Reset form
        const defaultDept = departments[0];
        setFormData({
          name: '',
          email: '',
          password: '',
          department: defaultDept?.id || '',
          currentSemester: 1,
          section: 'A',
          academicYear: `${currentYear}-${currentYear + 1}`,
          phone: '',
        });

        // Re-fetch real students
        await fetchData();

        // Switch back to list after short delay
        setTimeout(() => {
          setViewMode('list');
          navigate('/admin/students', { replace: true });
        }, 1500);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to enroll student. Please check input details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (userId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName}? This will permanently delete the student and user account.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.data?.success) {
        setStudents((prev) => prev.filter((s) => s.user?.id !== userId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = !selectedDept || String(s.departmentId) === String(selectedDept);

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
                {viewMode === 'add' ? 'Enroll New Student' : 'Students Directory'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1e6bff]">
                {students.length} Total
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {viewMode === 'add'
                ? 'Fill in all mandatory academic & account details required by campus database'
                : 'Manage student records, enrollment credentials, and academic details'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {viewMode === 'add' ? (
              <button
                onClick={() => {
                  setViewMode('list');
                  navigate('/admin/students', { replace: true });
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
                  <span>+ Enroll Student</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* VIEW 1: ENROLL NEW STUDENT FORM */}
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
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Arun Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. arun.mca@smartcampus.edu"
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

              {/* Section 2: Academic Program & Enrollment */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-[#1e6bff]" />
                  <span>Academic Program & Enrollment</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Department */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Department <span className="text-rose-500">*</span>
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

                  {/* Current Semester */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Current Semester <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="currentSemester"
                      required
                      value={formData.currentSemester}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Section <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="section"
                      required
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    >
                      {['A', 'B', 'C', 'D'].map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">
                      Academic Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="academicYear"
                      required
                      placeholder="e.g. 2024-2025"
                      value={formData.academicYear}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] transition-all"
                    />
                  </div>

                  {/* Automatic Generation Notice */}
                  <div className="sm:col-span-2 flex items-center space-x-2.5 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-800 text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#1e6bff] shrink-0 animate-pulse"></span>
                    <span>Roll Number & Registration Number will be auto-generated by backend API upon enrollment.</span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    navigate('/admin/students', { replace: true });
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
                      <span>Enrolling Student...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Submit & Enroll Student</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 2: STUDENTS DIRECTORY LIST */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-3.5 shadow-2xs border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, roll no, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e6bff] focus:bg-white transition-all"
                />
              </div>

              {/* Dropdown Filters */}
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

            {/* Students Table */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-100/90 overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-7 h-7 text-[#1e6bff] animate-spin" />
                  <p className="text-xs font-bold text-slate-400">Loading student directory...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1e6bff] flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No students found</h3>
                  <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                    {searchQuery || selectedDept
                      ? 'No students match your filter criteria. Try clearing filters.'
                      : 'No student accounts enrolled yet. Click "+ Enroll Student" above to add the first student.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 select-none">
                        <th className="py-3 px-5">Student</th>
                        <th className="py-3 px-4">Roll & Reg No</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Semester & Section</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredStudents.map((student) => {
                        const userName = student.user?.name || 'Student';
                        const userEmail = student.user?.email || 'N/A';
                        const userPhone = student.user?.phone || 'N/A';
                        const deptCode = student.department?.code || 'N/A';

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Student Name & Avatar */}
                            <td className="py-3.5 px-5">
                              <div
                                onClick={() => navigate(getStudentDetailsPath(student.id))}
                                className="flex items-center space-x-3 cursor-pointer group select-none"
                                title="Click to view full student details"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-[#1e6bff] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                  {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 group-hover:text-[#1e6bff] transition-colors truncate">
                                    {userName}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-400 truncate">{userEmail}</div>
                                </div>
                              </div>
                            </td>

                            {/* Roll Number & Registration Number */}
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div className="font-extrabold text-slate-900 text-xs tracking-wide">
                                {student.rollNumber || 'N/A'}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                Reg: {student.registrationNumber || 'N/A'}
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1e6bff] text-[11px] font-extrabold">
                                {deptCode}
                              </span>
                            </td>

                            {/* Semester & Section */}
                            <td className="py-3.5 px-4 font-semibold text-slate-600">
                              Sem {student.currentSemester} - Sec {student.section || 'A'}
                            </td>

                            {/* Phone */}
                            <td className="py-3.5 px-4 font-medium text-slate-600">
                              +91 {userPhone}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => navigate(getStudentDetailsPath(student.id))}
                                  className="p-1.5 rounded-xl text-[#1e6bff] hover:bg-blue-50 transition-colors"
                                  title="View Full Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.user?.id, userName)}
                                  disabled={deletingId === student.user?.id}
                                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                  title="Remove Student"
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

export default StudentsPage;
