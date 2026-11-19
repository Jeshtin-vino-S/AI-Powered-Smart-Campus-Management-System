import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { start: '11:15', end: '12:15', label: '11:15 - 12:15' },
  { start: '13:15', end: '14:15', label: '01:15 - 02:15' },
  { start: '14:15', end: '15:15', label: '02:15 - 03:15' },
  { start: '15:15', end: '16:15', label: '03:15 - 04:15' },
];

export const TimetablePage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const canManage = role === 'admin' || role === 'hod';

  const [timetable, setTimetable] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState(1);
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedYear, setSelectedYear] = useState('2026-2027');

  // Modals & Actions
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Add Slot Form
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    faculty: '',
    roomNumber: '304',
  });

  // Initial Fetch Departments & Subjects
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, subRes, facRes] = await Promise.all([
          api.get('/departments'),
          api.get('/subjects'),
          api.get('/users/faculty/all').catch(() => ({ data: { faculty: [] } })),
        ]);

        if (deptRes.data?.success) {
          const depts = deptRes.data.departments || [];
          setDepartments(depts);
          if (depts.length > 0 && !selectedDept) {
            setSelectedDept(depts[0].id);
          }
        }
        if (subRes.data?.success) {
          const subs = subRes.data.subjects || [];
          setSubjects(subs);
          if (subs.length > 0) {
            setSlotForm((prev) => ({ ...prev, subject: subs[0].id }));
          }
        }
        if (facRes.data?.success) {
          setFacultyList(facRes.data.faculty || []);
          if (facRes.data.faculty?.length > 0) {
            setSlotForm((prev) => ({ ...prev, faculty: facRes.data.faculty[0].id }));
          }
        }
      } catch (err) {
        console.error('Error fetching timetable metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Timetable Grid
  const fetchTimetableGrid = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedSem) params.semester = selectedSem;
      if (selectedSection) params.section = selectedSection;
      if (selectedYear) params.academicYear = selectedYear;

      const res = await api.get('/timetable', { params });
      if (res.data?.success) {
        setTimetable(res.data.timetable || []);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableGrid();
  }, [selectedDept, selectedSem, selectedSection, selectedYear]);

  // Handle Add Slot
  const handleAddSlot = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        department: selectedDept,
        semester: Number(selectedSem),
        section: selectedSection,
        academicYear: selectedYear,
        dayOfWeek: slotForm.dayOfWeek,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        subject: Number(slotForm.subject),
        faculty: Number(slotForm.faculty),
        roomNumber: slotForm.roomNumber,
      };

      const res = await api.post('/timetable', payload);
      if (res.data?.success) {
        setToastMessage('Timetable slot scheduled successfully!');
        setAddModalOpen(false);
        fetchTimetableGrid();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Conflict detected or invalid parameters');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Auto-Generate
  const handleAutoGenerate = async () => {
    if (!selectedDept) {
      setErrorMessage('Please select a department first');
      return;
    }
    setAutoGenLoading(true);
    setToastMessage('');
    setErrorMessage('');
    try {
      const res = await api.post('/timetable/auto-generate', {
        department: selectedDept,
        semester: Number(selectedSem),
        section: selectedSection,
        academicYear: selectedYear,
      });

      if (res.data?.success) {
        setToastMessage(res.data.message || `Timetable generated automatically for Semester ${selectedSem} (Section ${selectedSection}) with zero conflicts!`);
        fetchTimetableGrid();
        setTimeout(() => setToastMessage(''), 4500);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to auto-generate timetable');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setAutoGenLoading(false);
    }
  };

  // Delete Entry
  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchTimetableGrid();
    } catch (err) {
      alert('Failed to delete slot');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Academic Timetable
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Weekly class timetable schedule and heuristic conflict resolution
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoGenerate}
                disabled={autoGenLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center space-x-2 transition cursor-pointer"
              >
                {autoGenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Auto-Generate Timetable</span>
              </button>

              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Class Slot</span>
              </button>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department:
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Semester:</span>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>
                  Semester {s} {s === 4 ? '(MCA - PG)' : '(BCA - UG)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['A', 'B', 'C'].map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timetable Weekly Grid */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-400 font-semibold">Loading weekly schedule...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 border-r border-slate-200 w-28">Day</th>
                    {TIME_SLOTS.map((slot) => (
                      <th key={slot.label} className="py-3 px-3 border-r border-slate-200 text-center min-w-[140px]">
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayEntries = timetable.filter((t) => t.dayOfWeek === day);

                    return (
                      <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900 bg-slate-50/60 border-r border-slate-200">
                          {day}
                        </td>

                        {TIME_SLOTS.map((slot) => {
                          const slotEntry = dayEntries.find(
                            (e) => e.startTime.slice(0, 5) === slot.start
                          );

                          return (
                            <td key={slot.start} className="p-2 border-r border-slate-200 align-top">
                              {slotEntry ? (
                                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/90 flex flex-col justify-between h-full space-y-1 relative group">
                                  {canManage && (
                                    <button
                                      onClick={() => handleDeleteSlot(slotEntry.id)}
                                      className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                                      title="Remove slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                                      {slotEntry.subject?.code}
                                    </span>
                                    <p className="font-extrabold text-slate-900 line-clamp-1 leading-tight">
                                      {slotEntry.subject?.name}
                                    </p>
                                  </div>
                                  <div className="pt-1 border-t border-blue-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                    <span>Rm {slotEntry.roomNumber}</span>
                                    <span className="truncate max-w-[80px]">
                                      {slotEntry.faculty?.user?.name || 'Faculty'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-16 flex items-center justify-center text-[10px] text-slate-300 font-mono">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Slot Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Class Slot</h3>
                <p className="text-xs text-slate-500">Includes automatic faculty & room conflict checking</p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
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

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Day of Week *</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Time Slot *</label>
                  <select
                    value={slotForm.startTime}
                    onChange={(e) => {
                      const selected = TIME_SLOTS.find((s) => s.start === e.target.value);
                      setSlotForm({
                        ...slotForm,
                        startTime: selected.start,
                        endTime: selected.end,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s.start} value={s.start}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Subject Course *</label>
                <select
                  value={slotForm.subject}
                  onChange={(e) => setSlotForm({ ...slotForm, subject: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(subjects.filter((s) => s.semester === Number(selectedSem)).length > 0
                    ? subjects.filter((s) => s.semester === Number(selectedSem))
                    : subjects
                  ).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}) — Sem {sub.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Faculty In-Charge *</label>
                  <select
                    value={slotForm.faculty}
                    onChange={(e) => setSlotForm({ ...slotForm, faculty: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.user?.name || f.employeeId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Room / Lab Number *</label>
                  <input
                    type="text"
                    value={slotForm.roomNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
                >
                  {addLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TimetablePage;
