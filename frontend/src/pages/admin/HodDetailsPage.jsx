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
  Users,
} from 'lucide-react';

export const HodDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // Role check: Only Admin can edit HOD profiles
  const canEdit = currentUser?.role?.toLowerCase() === 'admin';

  const [hodData, setHodData] = useState(null);
  const [departmentFaculty, setDepartmentFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' | 'programs' | 'subjects' | 'personal'

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
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchHod = async () => {
    try {
      setLoading(true);
      setError('');
      const [hodRes, facultyRes] = await Promise.all([
        api.get(`/users/hod/${id}`),
        api.get('/users/faculty/all'),
      ]);

      if (hodRes.data?.success) {
        setHodData(hodRes.data);
      } else {
        setError(hodRes.data?.message || 'Failed to load HOD details');
      }

      if (facultyRes.data?.success && facultyRes.data?.faculty) {
        // Exclude the HOD themselves from subordinate faculty list
        const subordinates = facultyRes.data.faculty.filter(
          (f) => String(f.id) !== String(id) && f.user?.role !== 'hod'
        );
        setDepartmentFaculty(subordinates);
      }
    } catch (err) {
      console.error('Error fetching HOD details:', err);
      setError(err.response?.data?.message || 'HOD profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHod();
    }
  }, [id]);

  const handleOpenEditModal = () => {
    if (!hodData?.faculty) return;
    const h = hodData.faculty;
    const usr = h.user || {};
    setEditFormData({
      name: usr.name || '',
      email: usr.email || '',
      phone: usr.phone || '',
      employeeId: h.employeeId || '',
      designation: h.designation || '',
      qualification: h.qualification || '',
      specialization: h.specialization || '',
      cabinNumber: h.cabinNumber || '',
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
      const res = await api.put(`/users/hod/${id}`, editFormData);
      if (res.data?.success) {
        setEditSuccess('HOD details updated successfully!');
        setTimeout(async () => {
          setIsEditModalOpen(false);
          setEditSuccess('');
          await fetchHod();
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
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-semibold text-slate-500">Loading HOD administrative record...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !hodData?.faculty) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">HOD Profile Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">{error || 'Unable to retrieve records for the requested department head.'}</p>
          <button
            onClick={() => navigate('/admin/hod')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition"
          >
            Back to HOD Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { faculty: hod } = hodData;
  const user = hod.user || {};
  const department = hod.department || {};
  const taughtSubjects = hod.taughtSubjects || [];

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin/hod')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-amber-600 transition self-start cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to HODs Directory</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Head of Department
            </span>
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          {/* Top Right Corner Action: Edit Profile (Admin only) */}
          {canEdit && (
            <div className="absolute top-5 right-5 z-10">
              <button
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer hover:shadow-sm"
                title="Edit HOD Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 pr-0 sm:pr-28 md:pr-32">
            {/* Avatar Circle */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-[#1e6bff] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0 shadow-md shadow-amber-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'H'}
            </div>

            {/* Core Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.name || 'Head of Department'}
                </h1>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  {hod.employeeId || 'HOD-CA-001'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  {hod.designation}
                </span>
              </div>

              {/* Department & Qualification */}
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                <span className="text-amber-800 font-bold">{department.name || 'Department of Computer Applications'}</span>
                <span>•</span>
                <span className="text-slate-800 font-extrabold">{hod.qualification}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {hod.cabinNumber || 'Main Tech Block - Suite 101'}
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
                  Specialization: {hod.specialization || 'Academic Administration & Software Architecture'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Department Managed */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {department.code || 'CA'}
            </p>
            <p className="text-xs text-slate-400 font-bold">Department Code</p>
            <span className="text-[10px] text-amber-700 font-extrabold">Executive Head</span>
          </div>

          {/* Card 2: Faculty Supervised */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {departmentFaculty.length}
            </p>
            <p className="text-xs text-slate-400 font-bold">Faculty Members</p>
            <span className="text-[10px] text-purple-600 font-extrabold">Department Roster</span>
          </div>

          {/* Card 3: Department Students */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              270
            </p>
            <p className="text-xs text-slate-400 font-bold">Total Enrolled</p>
            <span className="text-[10px] text-blue-600 font-extrabold">UG & PG Students</span>
          </div>

          {/* Card 4: Programs Overseen */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              2 Programs
            </p>
            <p className="text-xs text-slate-400 font-bold">Degree Levels</p>
            <span className="text-[10px] text-emerald-600 font-extrabold">BCA (UG) & MCA (PG)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
          {[
            { id: 'faculty', label: 'Faculty Roster', count: departmentFaculty.length, icon: GraduationCap },
            { id: 'programs', label: 'Department Programs', count: 2, icon: Layers },
            { id: 'subjects', label: 'Curriculum Subjects', count: taughtSubjects.length, icon: BookOpen },
            { id: 'personal', label: 'HOD Office & Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
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

        {/* TAB 1: FACULTY ROSTER */}
        {activeTab === 'faculty' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Department Faculty Members</h3>
                <p className="text-xs text-slate-400 font-medium">Professors, Associate Professors, and Assistant Professors in {department.name}</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl">
                {departmentFaculty.length} Faculty
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentFaculty.map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigate(`/admin/faculty/${f.id}`)}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:border-purple-300 hover:bg-purple-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {f.user?.name ? f.user.name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                        {f.user?.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{f.designation}</p>
                      <p className="text-[10px] font-mono text-slate-400">{f.employeeId}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 shrink-0">
                    View
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENT PROGRAMS */}
        {activeTab === 'programs' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Academic Programs Under HOD Jurisdiction</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* BCA Program */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                    Undergraduate (UG)
                  </span>
                  <span className="text-xs font-bold text-slate-500">3 Years</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">Bachelor of Computer Applications (BCA)</h4>
                <div className="space-y-1 text-xs text-slate-600 font-medium">
                  <p>Current Active Semester: <strong className="text-slate-800">Semester 2</strong></p>
                  <p>Enrolled Sections: <strong className="text-slate-800">Section A, Section B, Section C</strong></p>
                  <p>Student Strength: <strong className="text-slate-800">135 Enrolled Students (45 / section)</strong></p>
                  <p>Core Curriculum: <strong className="text-slate-800">Python, Java OOP, DBMS SQL, DSA</strong></p>
                </div>
              </div>

              {/* MCA Program */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-extrabold">
                    Postgraduate (PG)
                  </span>
                  <span className="text-xs font-bold text-slate-500">2 Years</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">Master of Computer Applications (MCA)</h4>
                <div className="space-y-1 text-xs text-slate-600 font-medium">
                  <p>Current Active Semester: <strong className="text-slate-800">Semester 4</strong></p>
                  <p>Enrolled Sections: <strong className="text-slate-800">Section A, Section B, Section C</strong></p>
                  <p>Student Strength: <strong className="text-slate-800">135 Enrolled Students (45 / section)</strong></p>
                  <p>Core Curriculum: <strong className="text-slate-800">Cloud Computing, AI Deep Learning, Fullstack</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Curriculum Subjects Handled by HOD</h3>
            {taughtSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Currently serving as Full-Time Department Head overseeing all programs without individual course assignments.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taughtSubjects.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {sub.code}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 mt-1">{sub.name}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PERSONAL & OFFICE CREDENTIALS */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 space-y-5">
            <h3 className="text-sm font-black text-slate-900">HOD Credentials & Administrative Office</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Administrative Profile */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" /> Administrative & Academic Qualifications
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>Role: <strong className="text-slate-900">{hod.designation}</strong></p>
                  <p>Highest Degree: <strong className="text-slate-900">{hod.qualification}</strong></p>
                  <p>Department: <strong className="text-slate-900">{department.name} ({department.code})</strong></p>
                  <p>Academic Focus: <strong className="text-slate-900">{hod.specialization || 'Software Engineering & Academic Governance'}</strong></p>
                </div>
              </div>

              {/* Office & Cabin */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" /> HOD Suite & Contact Information
                </h4>
                <div className="space-y-2 text-slate-600 font-medium">
                  <p>HOD Cabin: <strong className="text-slate-900">{hod.cabinNumber || 'Main Tech Block - Suite 101'}</strong></p>
                  <p>Official Email: <strong className="text-slate-900">{user.email || 'N/A'}</strong></p>
                  <p>Office Phone: <strong className="text-slate-900">+91 {user.phone || 'N/A'}</strong></p>
                  <p>Employee ID: <strong className="text-slate-900 font-mono">{hod.employeeId}</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT HOD DETAILS MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Edit Head of Department Details
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Update administrative credentials, qualification, and contact info for {hod.employeeId}
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Specialization */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Specialization / Research</label>
                    <input
                      type="text"
                      value={editFormData.specialization}
                      onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Cabin Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">HOD Suite / Cabin</label>
                    <input
                      type="text"
                      value={editFormData.cabinNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, cabinNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center space-x-2 transition shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
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

export default HodDetailsPage;
