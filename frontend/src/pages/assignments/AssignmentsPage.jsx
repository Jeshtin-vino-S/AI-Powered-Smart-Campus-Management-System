import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Award,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export const AssignmentsPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const isFacultyOrAdmin = role === 'faculty' || role === 'hod' || role === 'admin';

  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Submissions review modal for faculty
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // Grade state
  const [gradeInputs, setGradeInputs] = useState({});

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    maxMarks: 25,
    instructions: '',
    attachmentUrl: '',
  });

  const [submitForm, setSubmitForm] = useState({
    fileUrl: '',
    comments: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const [res, subRes] = await Promise.all([
        api.get('/assignments'),
        isFacultyOrAdmin ? api.get('/subjects').catch(() => ({ data: { subjects: [] } })) : Promise.resolve({ data: { subjects: [] } }),
      ]);

      if (res.data?.success) {
        setAssignments(res.data.assignments || []);
      }
      if (subRes.data?.success && subRes.data.subjects?.length > 0) {
        setSubjects(subRes.data.subjects);
        setCreateForm((prev) => ({ ...prev, subjectId: subRes.data.subjects[0].id }));
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [role]);

  // Handle Faculty Create
  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/assignments', {
        ...createForm,
        subjectId: Number(createForm.subjectId),
        maxMarks: Number(createForm.maxMarks),
      });

      if (res.data?.success) {
        setToastMessage('Assignment created and distributed to students!');
        setCreateModalOpen(false);
        setCreateForm({
          title: '',
          description: '',
          subjectId: subjects[0]?.id || '',
          dueDate: '',
          maxMarks: 25,
          instructions: '',
          attachmentUrl: '',
        });
        fetchAssignments();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Student Submit
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post(`/assignments/${selectedAssignment.id}/submit`, submitForm);
      if (res.data?.success) {
        setToastMessage('Assignment submitted successfully!');
        setSubmitModalOpen(false);
        setSubmitForm({ fileUrl: '', comments: '' });
        fetchAssignments();
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle View Submissions (Faculty)
  const handleOpenSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionsModalOpen(true);
    setSubLoading(true);
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      if (res.data?.success) {
        setSubmissionsList(res.data.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setSubLoading(false);
    }
  };

  // Handle Grade Submission
  const handleGrade = async (submissionId) => {
    const input = gradeInputs[submissionId];
    if (!input || !input.marksObtained) {
      alert('Please enter marks obtained');
      return;
    }

    try {
      const res = await api.put(`/assignments/submissions/${submissionId}/grade`, {
        marksObtained: Number(input.marksObtained),
        feedback: input.feedback || '',
      });

      if (res.data?.success) {
        alert('Graded successfully!');
        handleOpenSubmissions(selectedAssignment);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grade submission');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Assignments & Coursework
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isFacultyOrAdmin
                ? 'Create assignments, track student submission compliance, and evaluate coursework'
                : 'View assigned coursework, submit digital attachments, and review feedback'}
            </p>
          </div>

          {isFacultyOrAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
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

        {/* Assignments Cards Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Assignments Found</h3>
            <p className="text-xs text-slate-400 mt-1">There are currently no active assignments posted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((a) => {
              const isPastDue = new Date(a.dueDate) < new Date();

              return (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {a.subject?.code || 'COURSE'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPastDue
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        Due: {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                      {a.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>Max Score: <strong className="text-slate-900">{a.maxMarks} Marks</strong></span>
                      {isFacultyOrAdmin && (
                        <span>Submissions: <strong className="text-blue-600">{a.totalSubmissions || 0}</strong></span>
                      )}
                    </div>

                    {isFacultyOrAdmin ? (
                      <button
                        onClick={() => handleOpenSubmissions(a)}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>View & Grade Submissions</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setSubmitModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Submit Work</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Assignment Modal (Faculty) */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Assignment</h3>
                <p className="text-xs text-slate-500">Post coursework with deadline and score criteria</p>
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
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Relational Query Optimization Project"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Subject *</label>
                <select
                  value={createForm.subjectId}
                  onChange={(e) => setCreateForm({ ...createForm, subjectId: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Description & Objectives *</label>
                <textarea
                  rows={3}
                  placeholder="Instructions for students..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Due Date *</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Maximum Marks *</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={createForm.maxMarks}
                    onChange={(e) => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Attachment / Resource Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={createForm.attachmentUrl}
                  onChange={(e) => setCreateForm({ ...createForm, attachmentUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                  <span>Publish Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Modal */}
      {submitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Assignment</h3>
                <p className="text-xs text-slate-500">{selectedAssignment.title}</p>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
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

            <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Solution File / Drive Link *</label>
                <input
                  type="url"
                  placeholder="https://github.com/... or Google Drive URL"
                  value={submitForm.fileUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, fileUrl: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Comments for Faculty</label>
                <textarea
                  rows={3}
                  placeholder="Optional submission remarks..."
                  value={submitForm.comments}
                  onChange={(e) => setSubmitForm({ ...submitForm, comments: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
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
                  <span>Submit Solution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Submissions Review Modal */}
      {submissionsModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Student Submissions</h3>
                <p className="text-xs text-slate-500">{selectedAssignment.title} (Max: {selectedAssignment.maxMarks} Marks)</p>
              </div>
              <button
                onClick={() => setSubmissionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {subLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : submissionsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">
                  No students have submitted solutions yet.
                </p>
              ) : (
                submissionsList.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">
                          {sub.student?.user?.name || 'Student'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {sub.student?.registrationNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {sub.fileUrl && (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Solution File</span>
                      </a>
                    )}

                    {sub.comments && (
                      <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100">
                        "{sub.comments}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        placeholder={`Marks (Max ${selectedAssignment.maxMarks})`}
                        defaultValue={sub.marksObtained ?? ''}
                        onChange={(e) =>
                          setGradeInputs({
                            ...gradeInputs,
                            [sub.id]: {
                              ...gradeInputs[sub.id],
                              marksObtained: e.target.value,
                            },
                          })
                        }
                        className="w-32 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Feedback / Remarks..."
                        defaultValue={sub.feedback ?? ''}
                        onChange={(e) =>
                          setGradeInputs({
                            ...gradeInputs,
                            [sub.id]: {
                              ...gradeInputs[sub.id],
                              feedback: e.target.value,
                            },
                          })
                        }
                        className="flex-1 min-w-[150px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                      />
                      <button
                        onClick={() => handleGrade(sub.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Save Grade
                      </button>
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

export default AssignmentsPage;
