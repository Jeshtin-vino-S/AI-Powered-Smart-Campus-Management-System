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
  MapPin,
} from 'lucide-react';

export const FacultyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Role check: Admin and HOD can edit faculty members
  const canEdit = ['admin', 'hod'].includes(currentUser?.role?.toLowerCase());

  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'timetable' | 'attendance' | 'personal'

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    designation: '',
    qualification: '',
    specialization: '',
    cabinNumber: '',
    teachingLoadHours: 16,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Determine back navigation path based on current URL
  const getBackPath = () => {
    if (location.pathname.startsWith('/hod')) return '/hod/faculty';
    return '/admin/faculty';
  };

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/users/faculty/${id}`);
      if (res.data?.success) {
        setFacultyData(res.data);
      } else {
        setError(res.data?.message || 'Failed to load faculty details');
      }
    } catch (err) {
      console.error('Error fetching faculty details:', err);
      setError(err.response?.data?.message || 'Faculty profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFaculty();
    }
  }, [id]);

  const handleOpenEditModal = () => {
    if (!facultyData?.faculty) return;
    const f = facultyData.faculty;
    const usr = f.user || {};
    setEditFormData({
      name: usr.name || '',
      email: usr.email || '',
      phone: usr.phone || '',
      employeeId: f.employeeId || '',
      designation: f.designation || '',
      qualification: f.qualification || '',
      specialization: f.specialization || '',
      cabinNumber: f.cabinNumber || '',
      teachingLoadHours: f.teachingLoadHours || 16,
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
      const res = await api.put(`/users/faculty/${id}`, editFormData);
      if (res.data?.success) {
        setEditSuccess('Faculty details updated successfully!');
        setTimeout(async () => {
          setIsEditModalOpen(false);
          setEditSuccess('');
          await fetchFaculty();
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
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-semibold text-slate-500">Loading faculty academic record...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !facultyData?.faculty) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Faculty Profile Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">{error || 'Unable to retrieve records for the requested faculty member.'}</p>
          <button
            onClick={() => navigate(getBackPath())}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition"
          >
            Back to Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { faculty, stats = {} } = facultyData;
  const user = faculty.user || {};
  const department = faculty.department || {};
  const taughtSubjects = faculty.taughtSubjects || [];
  const timetables = faculty.timetables || [];
  const attendances = faculty.attendances || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate(getBackPath())}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-purple-600 transition self-start cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Faculty Directory</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active Faculty Member
            </span>
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          {/* Top Right Corner Action: Edit Profile (Admin & HOD only) */}
          {canEdit && (
            <div className="absolute top-5 right-5 z-10">
              <button
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer hover:shadow-sm"
                title="Edit Faculty Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pr-0 sm:pr-28 md:pr-32">
            {/* Avatar Circle */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-[#1e6bff] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-md shadow-purple-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.name || 'Faculty Member'}
                </h1>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  {faculty.employeeId || 'N/A'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  {faculty.designation}
                </span>
              </div>

              {/* Department & Qualification */}
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                <span className="text-purple-700 font-bold">{department.name || 'Department of Computer Applications'}</span>
                <span>•</span>
                <span className="text-slate-800 font-extrabold">{faculty.qualification}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {faculty.cabinNumber || 'Tech Block - Room 304'}
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
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Specialization: {faculty.specialization || 'Computer Applications & Systems'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Assigned Subjects */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {stats.assignedSubjectsCount || taughtSubjects.length}
            </p>
            <p className="text-xs text-slate-400 font-bold">Assigned Courses</p>
            <span className="text-[10px] text-purple-600 font-extrabold">Active Curriculum</span>
          </div>

          {/* Card 2: Lectures Conducted */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {stats.totalLecturesConducted || 0}
            </p>
            <p className="text-xs text-slate-400 font-bold">Verified Lectures</p>
            <span className="text-[10px] text-emerald-600 font-extrabold">Attendance Logs Recorded</span>
          </div>

          {/* Card 3: Weekly Timetable Sessions */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {stats.weeklySessionsCount || timetables.length}
            </p>
            <p className="text-xs text-slate-400 font-bold">Weekly Sessions</p>
            <span className="text-[10px] text-blue-600 font-extrabold">Scheduled Classes</span>
          </div>

          {/* Card 4: Teaching Load */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {stats.teachingLoadHours || 16} hrs
            </p>
            <p className="text-xs text-slate-400 font-bold">Workload / Week</p>
            <span className="text-[10px] text-amber-600 font-extrabold">Standard Academic Load</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'subjects', label: 'Taught Subjects', count: taughtSubjects.length, icon: BookOpen },
            { id: 'timetable', label: 'Weekly Schedule', count: timetables.length, icon: Calendar },
            { id: 'attendance', label: 'Verified Lectures', count: attendances.length, icon: ShieldCheck },
            { id: 'personal', label: 'Faculty Credentials', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
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

        {/* TAB 1: TAUGHT SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Assigned Curriculum Courses</h3>
                <p className="text-xs text-slate-400 font-medium">Courses where this faculty member serves as the lead course instructor</p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                {taughtSubjects.length} Courses
              </span>
            </div>

            {taughtSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No teaching courses assigned currently.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taughtSubjects.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:border-purple-200 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {sub.code}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 mt-1">{sub.name}</h4>
                      </div>
                      <span className="text-xs font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {sub.credits} Credits
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                      <span>Semester: <strong className="text-slate-800">{sub.semester}</strong></span>
                      <span>Department: <strong className="text-slate-800">{department.code}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WEEKLY SCHEDULE */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Weekly Lecture Timetable</h3>
                <p className="text-xs text-slate-400 font-medium">Room allocations, class periods, and day-wise teaching slots</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
                {timetables.length} Total Slots
              </span>
            </div>

            {timetables.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No weekly timetable slots assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4">Time Slot</th>
                      <th className="py-2.5 px-4">Subject Course</th>
                      <th className="py-2.5 px-4">Semester & Section</th>
                      <th className="py-2.5 px-4">Assigned Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timetables.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-black text-slate-900">{slot.dayOfWeek}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-purple-700">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {slot.subject?.name || 'Lecture Course'}
                          <span className="block text-[10px] text-slate-400 font-mono">{slot.subject?.code}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          Sem {slot.semester} — Sec {slot.section}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {slot.roomNumber || 'LH-101'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFIED ATTENDANCE SESSIONS */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Lecture Verification & Attendance Logs</h3>
                <p className="text-xs text-slate-400 font-medium">Recent classroom lecture sessions conducted and verified by this faculty member</p>
              </div>
            </div>

            {attendances.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No lecture sessions logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Subject Course</th>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {att.subject?.name || 'Class Lecture'}
                          <span className="block text-[10px] text-slate-400 font-mono">{att.subject?.code}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {att.student?.user?.name || 'Student'}
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
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {att.remarks || 'Lecture recorded'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL & ACADEMIC CREDENTIALS */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
            <h3 className="text-sm font-black text-slate-900">Faculty Credentials & Office Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Academic Profile */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" /> Academic & Department Credentials
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>Designation: <strong className="text-slate-900">{faculty.designation}</strong></p>
                  <p>Highest Qualification: <strong className="text-slate-900">{faculty.qualification}</strong></p>
                  <p>Department: <strong className="text-slate-900">{department.name} ({department.code})</strong></p>
                  <p>Specialization: <strong className="text-slate-900">{faculty.specialization || 'Computer Science & Software Systems'}</strong></p>
                  <p>Weekly Teaching Load: <strong className="text-slate-900">{faculty.teachingLoadHours || 16} Hours</strong></p>
                </div>
              </div>

              {/* Office & Cabin */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" /> Office & Contact Details
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>Cabin Location: <strong className="text-slate-900">{faculty.cabinNumber || 'Tech Block - Room 304'}</strong></p>
                  <p>Official Email: <strong className="text-slate-900">{user.email || 'N/A'}</strong></p>
                  <p>Direct Mobile: <strong className="text-slate-900">+91 {user.phone || 'N/A'}</strong></p>
                  <p>Employee ID: <strong className="text-slate-900 font-mono">{faculty.employeeId}</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT FACULTY DETAILS MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Edit Faculty Details
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Update faculty credentials, designation, and contact information for {faculty.employeeId}
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Campus Email */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Campus Email</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Mobile Phone */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Mobile Phone (10 digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Employee ID */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={editFormData.employeeId}
                      onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Designation</label>
                    <input
                      type="text"
                      required
                      value={editFormData.designation}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Qualification</label>
                    <input
                      type="text"
                      required
                      value={editFormData.qualification}
                      onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Specialization / Research</label>
                    <input
                      type="text"
                      value={editFormData.specialization}
                      onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Cabin Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Cabin / Office Room</label>
                    <input
                      type="text"
                      value={editFormData.cabinNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, cabinNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  {/* Teaching Load */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Teaching Load (Hours / Week)</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={editFormData.teachingLoadHours}
                      onChange={(e) => setEditFormData({ ...editFormData, teachingLoadHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-purple-500/20 disabled:opacity-60 cursor-pointer"
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

export default FacultyDetailsPage;
