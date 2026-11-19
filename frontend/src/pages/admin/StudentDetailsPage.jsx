import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  FileText,
  TrendingUp,
  User,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  X,
  Save,
} from 'lucide-react';

export const StudentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Role check: Only Admin, HOD, and Faculty can edit student details
  const canEdit = ['admin', 'hod', 'faculty'].includes(currentUser?.role?.toLowerCase());

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'attendance' | 'marks' | 'assignments' | 'placements' | 'personal'

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    registrationNumber: '',
    currentSemester: 1,
    section: 'A',
    academicYear: '2026-2027',
    cgpa: '0.00',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Determine back navigation path based on current URL
  const getBackPath = () => {
    if (location.pathname.startsWith('/admin')) return '/admin/students';
    if (location.pathname.startsWith('/hod')) return '/hod/students';
    if (location.pathname.startsWith('/faculty')) return '/faculty/students';
    return '/admin/students';
  };

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/users/student/${id}`);
      if (res.data?.success) {
        setStudentData(res.data);
      } else {
        setError(res.data?.message || 'Failed to load student details');
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err.response?.data?.message || 'Student profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleOpenEditModal = () => {
    if (!studentData?.student) return;
    const st = studentData.student;
    const usr = st.user || {};
    setEditFormData({
      name: usr.name || '',
      email: usr.email || '',
      phone: usr.phone || '',
      rollNumber: st.rollNumber || '',
      registrationNumber: st.registrationNumber || '',
      currentSemester: st.currentSemester || 1,
      section: st.section || 'A',
      academicYear: st.academicYear || '2026-2027',
      cgpa: String(st.cgpa || '0.00'),
      guardianName: st.guardianName || '',
      guardianPhone: st.guardianPhone || '',
      guardianEmail: st.guardianEmail || '',
    });
    setEditError('');
    setEditSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');
    setEditSuccess('');

    try {
      const res = await api.put(`/users/student/${id}`, editFormData);
      if (res.data?.success) {
        setEditSuccess('Student details updated successfully!');
        setTimeout(async () => {
          setIsEditModalOpen(false);
          setEditSuccess('');
          await fetchStudent();
        }, 700);
      } else {
        setEditError(res.data?.message || 'Failed to update details');
      }
    } catch (err) {
      console.error('Save edit error:', err);
      setEditError(err.response?.data?.message || 'Error saving changes. Please verify all inputs.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading student academic record...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !studentData?.student) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Student Profile Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">{error || 'Unable to retrieve records for the requested student.'}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            Back to Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { student, stats = {}, enrolledSubjects = [] } = studentData;
  const user = student.user || {};
  const department = student.department || {};
  const isPostGraduate = (student.currentSemester || 0) >= 3 || (student.rollNumber || '').includes('MCA');
  const programType = isPostGraduate ? 'Postgraduate (MCA)' : 'Undergraduate (BCA)';

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate(getBackPath())}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition self-start cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Students Directory</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {student.status || 'Active Enrollment'}
            </span>
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          {/* Top Right Corner Action: Edit Profile (Admin, HOD, Faculty only) */}
          {canEdit && (
            <div className="absolute top-5 right-5 z-10">
              <button
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-[#1e6bff] text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer hover:shadow-sm"
                title="Edit Student Personal & Academic Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pr-0 sm:pr-28 md:pr-32">
            {/* Avatar Circle */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-md shadow-blue-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.name || 'Student Name'}
                </h1>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  {student.rollNumber || 'N/A'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  Reg: {student.registrationNumber || 'N/A'}
                </span>
              </div>

              {/* Department & Program */}
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                <span className="text-blue-600 font-bold">{department.name || 'Department of Computer Applications'}</span>
                <span>•</span>
                <span className="text-slate-800 font-extrabold">{programType}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                  Semester {student.currentSemester} — Section {student.section}
                </span>
              </p>

              {/* Contact Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {user.phone ? `+91 ${user.phone}` : 'N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Batch: {student.batch || '2024-2026'} ({student.academicYear || '2026-2027'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: CGPA */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {Number(student.cgpa || 0).toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 font-bold">Cumulative CGPA</p>
            <span className="text-[10px] text-blue-600 font-extrabold">Scale of 10.0</span>
          </div>

          {/* Card 2: Attendance Rate */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {stats.attendanceRate ?? student.attendancePercentage}%
            </p>
            <p className="text-xs text-slate-400 font-bold">Lecture Attendance</p>
            <span className="text-[10px] text-emerald-600 font-extrabold">
              {stats.totalClasses > 0
                ? `${stats.presentClasses} / ${stats.totalClasses} Attended`
                : `${student.attendancePercentage || 0}% Recorded`}
            </span>
          </div>

          {/* Card 3: Semester & Subjects */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              Sem {student.currentSemester}
            </p>
            <p className="text-xs text-slate-400 font-bold">Current Academic Term</p>
            <span className="text-[10px] text-purple-600 font-extrabold">
              {enrolledSubjects.length} Enrolled Courses
            </span>
          </div>

          {/* Card 4: Academic Standing */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-lg font-black text-slate-900 leading-none mt-1">
              {Number(student.cgpa) >= 8.0 ? 'First Class with Distinction' : 'First Class'}
            </p>
            <p className="text-xs text-slate-400 font-bold mt-1">Academic Status</p>
            <span className="text-[10px] text-emerald-600 font-extrabold">Good Standing</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'courses', label: 'Enrolled Courses', count: enrolledSubjects.length, icon: BookOpen },
            { id: 'attendance', label: 'Attendance History', count: student.attendances?.length, icon: ShieldCheck },
            { id: 'marks', label: 'Exam Marks & Grades', count: student.marks?.length, icon: Award },
            { id: 'assignments', label: 'Coursework Submissions', count: student.submissions?.length, icon: FileText },
            { id: 'placements', label: 'Placement Drives', count: student.applications?.length, icon: Briefcase },
            { id: 'personal', label: 'Guardian & Profile Info', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ENROLLED COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Enrolled Curriculum Subjects</h3>
                <p className="text-xs text-slate-400 font-medium">Subjects assigned for Semester {student.currentSemester} in {department.name}</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                {enrolledSubjects.length} Registered Courses
              </span>
            </div>

            {enrolledSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No enrolled courses found for this term.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledSubjects.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 mt-1.5 leading-snug">{sub.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700 shrink-0">
                        {sub.type} • {sub.credits} Credits
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Faculty Instructor:</span>
                      <span className="font-bold text-slate-800">{sub.faculty?.user?.name || 'Assigned Professor'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Lecture Attendance Log</h3>
                <p className="text-xs text-slate-400 font-medium">Session-by-session faculty verified manual lecture records</p>
              </div>
              <div className="flex items-center space-x-3 text-xs font-bold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Present: {stats.presentClasses || 0}
                </span>
                <span className="text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Absent: {stats.absentClasses || 0}
                </span>
              </div>
            </div>

            {(!student.attendances || student.attendances.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No lecture attendance logs recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Subject Course</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Verification</th>
                      <th className="py-2.5 px-4">Faculty Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {att.subject?.name || 'Class Lecture'}
                          <span className="block text-[10px] text-slate-400 font-mono">{att.subject?.code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                            att.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {att.status === 'present' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold uppercase text-[10px]">
                          {att.verificationMethod || 'manual'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {att.remarks || 'Attended lecture'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXAM MARKS & GRADES */}
        {activeTab === 'marks' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Semester Examination Report</h3>
                <p className="text-xs text-slate-400 font-medium">Internal, midterm, and practical assessment scorecards</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                CGPA: {student.cgpa}
              </span>
            </div>

            {(!student.marks || student.marks.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No official examination scorecards published yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Examination</th>
                      <th className="py-2.5 px-4">Subject Course</th>
                      <th className="py-2.5 px-4">Score Obtained</th>
                      <th className="py-2.5 px-4">Letter Grade</th>
                      <th className="py-2.5 px-4">Performance Bar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.marks.map((m) => {
                      const pct = Math.round((Number(m.marksObtained) / Number(m.maxMarks)) * 100);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {m.examination?.title || 'Mid-Term Assessment'}
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">{m.examination?.type}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {m.subject?.name}
                            <span className="block text-[10px] text-slate-400 font-mono">{m.subject?.code}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 text-sm">
                            {m.marksObtained} <span className="text-xs text-slate-400 font-medium">/ {m.maxMarks}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs">
                              {m.grade || 'A+'}
                            </span>
                          </td>
                          <td className="py-3 px-4 w-48">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold mt-1 block">{pct}% Score</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COURSEWORK SUBMISSIONS */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Coursework Assignments & Submissions</h3>
                <p className="text-xs text-slate-400 font-medium">GitHub repositories, notebook deliverables, and faculty evaluation feedback</p>
              </div>
            </div>

            {(!student.submissions || student.submissions.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assignments submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {student.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{sub.assignment?.title || 'Assignment Deliverable'}</h4>
                        <span className="text-[11px] text-slate-500 font-semibold">{sub.assignment?.subject?.name} ({sub.assignment?.subject?.code})</span>
                      </div>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 self-start">
                        Score: {sub.marksObtained} / {sub.assignment?.maxMarks || 50}
                      </span>
                    </div>

                    {sub.feedback && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-600">
                        <strong className="text-slate-800 font-bold">Faculty Feedback:</strong> {sub.feedback}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Submitted: {new Date(sub.submissionDate || sub.createdAt).toLocaleDateString()}</span>
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                          View Project Submission <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PLACEMENTS & RECRUITMENT */}
        {activeTab === 'placements' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Campus Placements & Corporate Drives</h3>
                <p className="text-xs text-slate-400 font-medium">Recruitment applications, eligibility criteria, and interview shortlisting</p>
              </div>
            </div>

            {(!student.applications || student.applications.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No placement drive applications submitted yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.applications.map((app) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{app.placement?.companyName || 'Corporate Drive'}</h4>
                        <p className="text-[11px] font-semibold text-slate-600">{app.placement?.jobRole}</p>
                      </div>
                      <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase text-[10px]">
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                      <span>Package: <strong className="text-slate-900">{app.placement?.salaryPackage || 'N/A'}</strong></span>
                      <span>Location: {app.placement?.location || 'Pan-India'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PERSONAL & GUARDIAN PROFILE */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
            <h3 className="text-sm font-black text-slate-900">Personal & Guardian Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Guardian Info */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> Parent / Guardian Information
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>Name: <strong className="text-slate-900">{student.guardianName || 'Parent / Guardian'}</strong></p>
                  <p>Contact Phone: <strong className="text-slate-900">{student.guardianPhone || '+91 9840112233'}</strong></p>
                  <p>Guardian Email: <strong className="text-slate-900">{student.guardianEmail || 'guardian@smartcampus.edu'}</strong></p>
                </div>
              </div>

              {/* Faculty Mentor */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" /> Assigned Academic Mentor
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>Mentor: <strong className="text-slate-900">{student.mentor?.user?.name || 'Dr. S. Vignesh (Associate Professor)'}</strong></p>
                  <p>Email: <strong className="text-slate-900">{student.mentor?.user?.email || 'vignesh.mca@smartcampus.edu'}</strong></p>
                  <p>Cabin: <strong className="text-slate-900">RTB-304 (Ramanujan Tech Block)</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT STUDENT DETAILS MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Edit Student Personal & Academic Details
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Update profile, credentials, and guardian contacts for {student.rollNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feedback messages */}
              {editError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
              {editSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Campus Email</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Mobile Phone (10 digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Roll Number</label>
                    <input
                      type="text"
                      required
                      value={editFormData.rollNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Registration Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Registration Number</label>
                    <input
                      type="text"
                      required
                      value={editFormData.registrationNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* CGPA */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Cumulative CGPA (0.0 - 10.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editFormData.cgpa}
                      onChange={(e) => setEditFormData({ ...editFormData, cgpa: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Current Semester */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Current Semester</label>
                    <select
                      value={editFormData.currentSemester}
                      onChange={(e) => setEditFormData({ ...editFormData, currentSemester: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
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
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Section</label>
                    <select
                      value={editFormData.section}
                      onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Academic Year</label>
                    <input
                      type="text"
                      value={editFormData.academicYear}
                      onChange={(e) => setEditFormData({ ...editFormData, academicYear: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Guardian Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={editFormData.guardianName}
                      onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Guardian Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Guardian Phone</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editFormData.guardianPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>

                  {/* Guardian Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Guardian Email</label>
                    <input
                      type="email"
                      value={editFormData.guardianEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, guardianEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e6bff]"
                    />
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1e6bff] hover:bg-blue-600 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {editSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDetailsPage;