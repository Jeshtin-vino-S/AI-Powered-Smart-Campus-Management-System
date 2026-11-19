import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  Building2,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

export const AttendancePage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isFacultyOrStaff = role === 'faculty' || role === 'hod' || role === 'admin';

  // Common State
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSection, setSelectedSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Faculty Attendance Register State
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [studentId]: { status: 'present' | 'absent' | 'late', remarks: '' } }
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Student Attendance View State
  const [studentStats, setStudentStats] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);

  // Fetch initial subjects & student data
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);

        if (isFacultyOrStaff) {
          // Fetch faculty assigned subjects
          const subRes = await api.get('/subjects');
          if (subRes.data?.success && Array.isArray(subRes.data.subjects)) {
            const subs = subRes.data.subjects;
            setSubjects(subs);
            if (subs.length > 0) {
              setSelectedSubjectId(String(subs[0].id));
            }
          }
        } else {
          // Student role: fetch their attendance overview
          const attRes = await api.get('/attendance/my');
          if (attRes.data?.success) {
            setStudentStats(attRes.data.stats || {});
            setStudentHistory(attRes.data.records || []);
          }
        }
      } catch (err) {
        console.error('Error initializing attendance page:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [role]);

  // When selectedSubject changes for faculty, fetch enrolled students for that class
  useEffect(() => {
    if (!isFacultyOrStaff || !selectedSubjectId) return;

    const fetchClassStudents = async () => {
      try {
        const currentSub = subjects.find((s) => String(s.id) === String(selectedSubjectId));
        if (!currentSub) return;

        // Fetch students enrolled in this subject's department and semester
        let roster = [];
        try {
          const filterRes = await api.get('/users/students/filter', {
            params: {
              department: currentSub.departmentId,
              semester: currentSub.semester,
            },
          });
          if (filterRes.data?.success && Array.isArray(filterRes.data.students)) {
            roster = filterRes.data.students;
          }
        } catch (filterErr) {
          console.warn('Filter query failed, falling back to all students:', filterErr);
        }

        // Fallback to all students if filter returned 0
        if (roster.length === 0) {
          const allRes = await api.get('/users', { params: { role: 'student' } });
          if (allRes.data?.success && Array.isArray(allRes.data.users)) {
            roster = allRes.data.users
              .filter((u) => u.studentProfile)
              .map((u) => ({
                id: u.studentProfile.id,
                rollNumber: u.studentProfile.rollNumber,
                registrationNumber: u.studentProfile.registrationNumber,
                currentSemester: u.studentProfile.currentSemester,
                section: u.studentProfile.section,
                attendancePercentage: u.studentProfile.attendancePercentage,
                user: {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                },
              }));
          }
        }

        setStudents(roster);

        // Initialize all students as 'present' by default
        const initialMap = {};
        roster.forEach((st) => {
          initialMap[st.id] = {
            status: 'present',
            remarks: '',
          };
        });
        setAttendanceRecords(initialMap);
      } catch (err) {
        console.error('Error fetching class roster:', err);
      }
    };

    fetchClassStudents();
  }, [selectedSubjectId, subjects, isFacultyOrStaff]);

  // Toggle single student status
  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));
  };

  // Update remarks
  const handleRemarksChange = (studentId, remarksText) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remarksText,
      },
    }));
  };

  // Batch: Mark All Present
  const handleMarkAllPresent = () => {
    setAttendanceRecords((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        updated[st.id] = { ...updated[st.id], status: 'present' };
      });
      return updated;
    });
  };

  // Batch: Mark All Absent
  const handleMarkAllAbsent = () => {
    setAttendanceRecords((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        updated[st.id] = { ...updated[st.id], status: 'absent' };
      });
      return updated;
    });
  };

  // Submit Manual Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) {
      alert('Please select a subject');
      return;
    }

    if (students.length === 0) {
      alert('No students available in this class roster to mark attendance');
      return;
    }

    setSaveLoading(true);
    setErrorMessage('');
    setToastMessage('');

    try {
      const recordsPayload = students.map((st) => ({
        studentId: st.id,
        status: attendanceRecords[st.id]?.status || 'present',
        remarks: attendanceRecords[st.id]?.remarks || '',
      }));

      const payload = {
        subjectId: Number(selectedSubjectId),
        records: recordsPayload,
        date: selectedDate,
        academicYear,
      };

      const res = await api.post('/attendance/manual', payload);
      if (res.data?.success) {
        setToastMessage(res.data.message || `Attendance recorded successfully for ${recordsPayload.length} students!`);
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setSaveLoading(false);
    }
  };

  // Calculate live counts
  const totalCount = students.length;
  const presentCount = Object.values(attendanceRecords).filter((r) => r.status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter((r) => r.status === 'absent').length;
  const lateCount = Object.values(attendanceRecords).filter((r) => r.status === 'late').length;
  const sessionRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading attendance register...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ========================================================
  // VIEW A: FACULTY ATTENDANCE REGISTER (Faculty / HOD)
  // ========================================================
  if (isFacultyOrStaff) {
    const currentSubject = subjects.find((s) => String(s.id) === String(selectedSubjectId));

    return (
      <DashboardLayout>
        <div className="space-y-5 max-w-7xl mx-auto">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Class Attendance Register</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  Faculty Entry
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mark student presence directly for your assigned subject lectures
              </p>
            </div>

            {/* Top Save Button */}
            <button
              onClick={handleSaveAttendance}
              disabled={saveLoading || students.length === 0}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
            >
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Attendance</span>
            </button>
          </div>

          {/* Success / Error Alerts */}
          {toastMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Control Bar: Subject, Date, Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* Subject Selector */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                  Assigned Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects assigned</option>
                  ) : (
                    subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code}) — Sem {sub.semester}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date Selector */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                  Attendance Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Mark All Absent</span>
              </button>
            </div>
          </div>

          {/* Quick Real-Time Metrics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Students</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
              <span className="text-[10px] font-bold text-slate-400 mt-1 block">Class Roster</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-emerald-600">Present</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
              <span className="text-[10px] font-bold text-emerald-500 mt-1 block">Marked Attending</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-rose-600">Absent</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
              <span className="text-[10px] font-bold text-rose-500 mt-1 block">Marked Missing</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-blue-600">Session Attendance</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{sessionRate}%</p>
              <span className="text-[10px] font-bold text-blue-500 mt-1 block">Today's Class Rate</span>
            </div>
          </div>

          {/* Student Roster Marking Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {currentSubject ? `${currentSubject.name} (${currentSubject.code})` : 'Class Roster'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Date: {selectedDate} • Section: {selectedSection}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {students.length} Students Listed
              </span>
            </div>

            {students.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No students found for this subject/department.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Roll Number</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Overall %</th>
                      <th className="py-3 px-4 text-center">Mark Attendance (Present / Absent)</th>
                      <th className="py-3 px-4">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map((st, index) => {
                      const currentRecord = attendanceRecords[st.id] || { status: 'present', remarks: '' };
                      const status = currentRecord.status;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {st.rollNumber || 'ST-001'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{st.user?.name || 'Student'}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{st.user?.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-black text-xs ${
                                (st.attendancePercentage ?? 95) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {st.attendancePercentage ?? 95}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'present')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition cursor-pointer ${
                                  status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'absent')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition cursor-pointer ${
                                  status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs shadow-rose-500/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'late')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition cursor-pointer ${
                                  status === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <span>Late</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="e.g. Leave, verified"
                              value={currentRecord.remarks || ''}
                              onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                              className="w-full max-w-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Save Bar */}
            {students.length > 0 && (
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {presentCount} marked Present, {absentCount} marked Absent out of {totalCount} students.
                </span>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  {saveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Attendance Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ========================================================
  // VIEW B: STUDENT ATTENDANCE HUB (Student View)
  // ========================================================
  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Attendance Record
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official lecture attendance recorded by faculty members
          </p>
        </div>

        {/* Stats Row */}
        {studentStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Cumulative Attendance</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{studentStats.percentage}%</p>
                <p className="text-[11px] font-bold mt-1">
                  {studentStats.percentage >= 75 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Eligible for Semester Exams (&gt;75%)
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Under Threshold (&lt;75% Risk)
                    </span>
                  )}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  studentStats.percentage >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Attended Lectures</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{studentStats.attended}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Marked Present by Faculty</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Classes Conducted</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{studentStats.totalClasses}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1">Semester Curriculum</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">Historical Lecture Attendance Logs</h2>
            <span className="text-xs font-semibold text-slate-500">{studentHistory.length} Total Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recorded Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No attendance records logged yet.
                    </td>
                  </tr>
                ) : (
                  studentHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {rec.subject?.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-medium">
                          {rec.subject?.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {rec.faculty?.user?.name || 'Faculty In-Charge'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(rec.date || rec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">
                        {rec.remarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;
