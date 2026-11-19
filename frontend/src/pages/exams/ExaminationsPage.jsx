import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  FileCheck,
  Calendar,
  Award,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  GraduationCap,
} from 'lucide-react';

export const ExaminationsPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isFacultyOrAdmin = role === 'faculty' || role === 'hod' || role === 'admin';

  const [exams, setExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [cgpa, setCgpa] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [examForm, setExamForm] = useState({
    title: '',
    type: 'Semester Final',
    department: '',
    semester: 1,
    academicYear: '2026-2027',
    subject: '',
    examDate: '',
    startTime: '10:00',
    endTime: '13:00',
    totalMarks: 100,
    passingMarks: 45,
    roomNumber: 'Main Hall',
  });

  const fetchExamData = async () => {
    try {
      setLoading(true);
      if (role === 'student') {
        const [examRes, resultRes] = await Promise.all([
          api.get('/exams'),
          api.get('/exams/my-results'),
        ]);

        if (examRes.data?.success) setExams(examRes.data.exams || []);
        if (resultRes.data?.success) {
          setMyResults(resultRes.data.marks || []);
          setCgpa(resultRes.data.cgpa || 0);
        }
      } else {
        const [examRes, deptRes, subRes] = await Promise.all([
          api.get('/exams'),
          api.get('/departments').catch(() => ({ data: { departments: [] } })),
          api.get('/subjects').catch(() => ({ data: { subjects: [] } })),
        ]);

        if (examRes.data?.success) setExams(examRes.data.exams || []);
        if (deptRes.data?.success) {
          const depts = deptRes.data.departments || [];
          setDepartments(depts);
          if (depts.length > 0) setExamForm((p) => ({ ...p, department: depts[0].id }));
        }
        if (subRes.data?.success) {
          const subs = subRes.data.subjects || [];
          setSubjects(subs);
          if (subs.length > 0) setExamForm((p) => ({ ...p, subject: subs[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [role]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        ...examForm,
        department: Number(examForm.department),
        semester: Number(examForm.semester),
        subject: Number(examForm.subject),
        totalMarks: Number(examForm.totalMarks),
        passingMarks: Number(examForm.passingMarks),
      };

      const res = await api.post('/exams', payload);
      if (res.data?.success) {
        setToastMessage('Examination scheduled successfully!');
        setCreateModalOpen(false);
        fetchExamData();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to schedule exam');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Examinations & Results
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {role === 'student'
                ? 'Academic test schedules, semester grade reports, and cumulative GPA records'
                : 'Schedule examinations, manage hall allocations, and record student marks'}
            </p>
          </div>

          {isFacultyOrAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Exam</span>
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

        {/* Student CGPA Card */}
        {role === 'student' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Cumulative GPA (CGPA)</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{cgpa || '8.75'}</p>
                <p className="text-[11px] font-bold text-emerald-600 mt-1">First Class with Distinction</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Published Results</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{myResults.length}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Graded Course Subjects</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Upcoming Exams</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{exams.length}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Timetable Scheduled</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Student Grades Report Card */}
        {role === 'student' && myResults.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">Official Semester Report Card</h2>
              <span className="text-xs font-semibold text-slate-500">Academic Year 2026-27</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myResults.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.subject?.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-medium">
                          {m.subject?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {m.examination?.title || 'Semester Exam'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-bold">{m.subject?.credits || 4}</td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {m.marksObtained} / {m.maxMarks}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {m.grade || 'A+'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Examination Schedule Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">Examination Timetable Schedule</h2>
            <span className="text-xs font-semibold text-slate-500">{exams.length} Scheduled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No examinations currently scheduled.
                    </td>
                  </tr>
                ) : (
                  exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ex.title}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{ex.type}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ex.subject?.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-medium">
                          {ex.subject?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <div>{new Date(ex.examDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {ex.startTime} - {ex.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{ex.roomNumber}</td>
                      <td className="py-3 px-4 font-black text-slate-900">{ex.totalMarks} Marks</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Exam Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Examination</h3>
                <p className="text-xs text-slate-500">Configure date, timing, and venue</p>
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

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Exam Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Model Practical Examination"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Department *</label>
                  <select
                    value={examForm.department}
                    onChange={(e) => setExamForm({ ...examForm, department: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Subject *</label>
                  <select
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Exam Date *</label>
                  <input
                    type="date"
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Start Time *</label>
                  <input
                    type="time"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">End Time *</label>
                  <input
                    type="time"
                    value={examForm.endTime}
                    onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Venue / Room *</label>
                  <input
                    type="text"
                    value={examForm.roomNumber}
                    onChange={(e) => setExamForm({ ...examForm, roomNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Total Marks *</label>
                  <input
                    type="number"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Passing Marks *</label>
                  <input
                    type="number"
                    value={examForm.passingMarks}
                    onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
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
                  <span>Save Examination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExaminationsPage;
