import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn(`[Gemini SDK Init Warning]: ${err.message}`);
  }
}

export const getGeminiModel = () => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
};

/**
 * Predicts student academic risk using attendance, examination scores, and assignment metrics.
 * Decision-support indicator only.
 */
export const predictStudentRisk = async ({ student, attendanceRate, marksData, assignmentData }) => {
  // Quantitative metrics computation
  const avgMarksPercent = marksData && marksData.length > 0
    ? (marksData.reduce((acc, m) => acc + (m.marksObtained / m.maxMarks) * 100, 0) / marksData.length)
    : 75;

  const assignmentSubmissionRate = assignmentData && assignmentData.total > 0
    ? (assignmentData.submitted / assignmentData.total) * 100
    : 80;

  let riskLevel = 'low';
  let riskScore = 0; // 0 to 100
  const riskFactors = [];
  const recommendations = [];

  // Attendance evaluations
  if (attendanceRate < 65) {
    riskScore += 45;
    riskFactors.push(`Critical attendance deficit: current rate is ${attendanceRate.toFixed(1)}% (below mandatory 75% threshold).`);
    recommendations.push('Attend all upcoming lectures and submit medical/leave certificates for excused absences to the HOD.');
  } else if (attendanceRate < 75) {
    riskScore += 25;
    riskFactors.push(`Attendance borderline: current rate is ${attendanceRate.toFixed(1)}%, risking exam debarment.`);
    recommendations.push('Maintain strict attendance in subsequent weeks to surpass the 75% eligibility mark.');
  }

  // Marks evaluations
  if (avgMarksPercent < 45) {
    riskScore += 35;
    riskFactors.push(`Internal examination average is low at ${avgMarksPercent.toFixed(1)}%.`);
    recommendations.push('Schedule remedial peer tutoring sessions and attend faculty office consultation hours.');
  } else if (avgMarksPercent < 60) {
    riskScore += 15;
    riskFactors.push(`Academic assessment scores show moderate vulnerability (${avgMarksPercent.toFixed(1)}%).`);
    recommendations.push('Review foundational topic worksheets and practice previous semester question papers.');
  }

  // Assignment submissions
  if (assignmentSubmissionRate < 60) {
    riskScore += 20;
    riskFactors.push(`Low assignment completion rate (${assignmentSubmissionRate.toFixed(1)}%).`);
    recommendations.push('Prioritize overdue deliverables and request mentor guidance on problem-solving roadmaps.');
  }

  if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 25) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
    riskFactors.push('Academic indicators meet normal progression benchmarks.');
    recommendations.push('Maintain current study rhythm, participate in coding/technical clubs, and explore advanced electives.');
  }

  let aiSummary = `Academic status categorized as ${riskLevel.toUpperCase()} RISK (Indicator Score: ${riskScore}/100). Attendance: ${attendanceRate.toFixed(1)}%, Exam Avg: ${avgMarksPercent.toFixed(1)}%, Assignment Completion: ${assignmentSubmissionRate.toFixed(1)}%. This indicator is intended solely for academic counseling and decision-support.`;

  // Enhance with Google Gemini if configured
  if (genAI) {
    try {
      const model = getGeminiModel();
      const prompt = `You are a high-level university academic advisor. Analyze the following student academic indicators and generate a concise 3-sentence professional guidance note.
Student: ${student.user?.name}
Department: ${student.department?.name}
Current CGPA: ${student.cgpa}
Attendance: ${attendanceRate.toFixed(1)}%
Exam Average: ${avgMarksPercent.toFixed(1)}%
Assignment Rate: ${assignmentSubmissionRate.toFixed(1)}%
Identified Risk Level: ${riskLevel}
Important: State that this is an advisory decision-support indicator, not a definitive prediction. Keep it under 80 words.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        aiSummary = text.trim();
      }
    } catch (apiErr) {
      console.warn(`[Gemini Academic Risk Advisory Fallback]: ${apiErr.message}`);
    }
  }

  return {
    riskLevel,
    riskScore: Math.min(riskScore, 100),
    riskFactors,
    recommendations,
    aiSummary,
    metrics: {
      attendanceRate: Number(attendanceRate.toFixed(1)),
      avgMarksPercent: Number(avgMarksPercent.toFixed(1)),
      assignmentSubmissionRate: Number(assignmentSubmissionRate.toFixed(1)),
    },
    disclaimer: 'Notice: AI predictions and risk metrics are automated decision-support indicators designed for early advisory intervention, not guaranteed academic outcomes.',
  };
};

/**
 * AI Campus Assistant chatbot answering role-specific questions using authorized database data.
 */
export const chatWithCampusAssistant = async ({ query, studentContext, campusContext, user }) => {
  const isStudent = user.role === 'student';

  const contextSummary = isStudent
    ? JSON.stringify({
        role: user.role,
        studentName: user.name,
        email: user.email,
        rollNumber: studentContext?.student?.rollNumber,
        department: studentContext?.student?.department?.name,
        semester: studentContext?.student?.currentSemester,
        cgpa: studentContext?.student?.cgpa,
        attendanceRate: studentContext?.attendanceSummary?.overallPercentage,
        upcomingExams: studentContext?.upcomingExams?.map(e => ({
          title: e.title,
          subject: e.subject?.name,
          date: e.examDate,
          time: `${e.startTime} - ${e.endTime}`,
          room: e.roomNumber,
        })),
        pendingAssignments: studentContext?.pendingAssignments?.map(a => ({
          title: a.title,
          subject: a.subject?.name,
          dueDate: a.dueDate,
        })),
        recentNotices: studentContext?.recentNotices?.map(n => ({
          title: n.title,
          priority: n.priority,
          date: n.createdAt,
        })),
        placementEligibility: studentContext?.placementHighlights,
      })
    : JSON.stringify({
        role: user.role,
        userName: user.name,
        email: user.email,
        campusStats: campusContext?.campusStats,
        upcomingExams: campusContext?.upcomingExams?.map(e => ({
          title: e.title,
          subject: e.subject?.name,
          date: e.examDate,
          time: `${e.startTime} - ${e.endTime}`,
        })),
        recentNotices: campusContext?.recentNotices?.map(n => ({
          title: n.title,
          priority: n.priority,
          date: n.createdAt,
        })),
      });

  if (genAI) {
    try {
      const model = getGeminiModel();
      const systemInstruction = isStudent
        ? `You are the AI Campus Assistant for student ${user.name}. You have authorized access to their college records below. Answer accurately, politely, and concisely using the provided context. Do not fabricate grades, attendance, or schedules.
Authorized Student Context:
${contextSummary}`
        : `You are the AI Campus Management Assistant for ${user.name} (${user.role.toUpperCase()}). You have authorized access to the campus administrative and operational records below. Answer accurately, professionally, and concisely using the provided context.
Authorized Campus Context:
${contextSummary}`;

      const result = await model.generateContent([
        { text: systemInstruction },
        { text: `User Question: ${query}` },
      ]);
      const reply = result.response.text();
      if (reply) {
        return {
          answer: reply.trim(),
          source: 'gemini-3.5-flash',
        };
      }
    } catch (apiErr) {
      console.warn(`[Gemini Assistant API Fallback]: ${apiErr.message}`);
    }
  }

  // Heuristic intelligent responder
  const q = query.toLowerCase();
  let answer = '';

  if (isStudent) {
    if (q.includes('attendance') || q.includes('absent') || q.includes('present')) {
      const rate = studentContext?.attendanceSummary?.overallPercentage;
      answer = `Hello ${user.name}, your overall registered attendance is currently ${rate !== undefined ? rate + '%' : 'available on your dashboard'}. Remember that a minimum of 75% attendance is required to be eligible for end-semester examinations.`;
    } else if (q.includes('exam') || q.includes('examination') || q.includes('test')) {
      const exams = studentContext?.upcomingExams || [];
      if (exams.length > 0) {
        const list = exams.map(e => `• ${e.subject?.name || e.title}: on ${new Date(e.examDate).toLocaleDateString()} (${e.startTime} to ${e.endTime}) in Hall ${e.roomNumber}`).join('\n');
        answer = `You have ${exams.length} scheduled upcoming examination(s):\n${list}\nMake sure to bring your college ID card!`;
      } else {
        answer = `You currently have no scheduled upcoming examinations listed in your department portal.`;
      }
    } else if (q.includes('assignment') || q.includes('homework') || q.includes('due') || q.includes('submission')) {
      const assignments = studentContext?.pendingAssignments || [];
      if (assignments.length > 0) {
        const list = assignments.map(a => `• ${a.title} (${a.subject?.name}): Due on ${new Date(a.dueDate).toLocaleDateString()}`).join('\n');
        answer = `You have ${assignments.length} pending assignment(s) to submit:\n${list}\nBe sure to submit them before the deadline to earn full marks.`;
      } else {
        answer = `Great news! You have no pending assignments with upcoming deadlines at the moment.`;
      }
    } else if (q.includes('cgpa') || q.includes('grade') || q.includes('marks') || q.includes('result')) {
      answer = `Your cumulative recorded CGPA is ${studentContext?.student?.cgpa}/10.0 in Semester ${studentContext?.student?.currentSemester}. You can review your detailed subject-wise marks breakdown under the Results tab.`;
    } else if (q.includes('placement') || q.includes('job') || q.includes('internship') || q.includes('company')) {
      const count = studentContext?.placementHighlights?.length || 0;
      answer = `There are currently ${count} active placement and internship opportunities available for your department. Head over to the Placements tab to view full job descriptions and submit applications.`;
    } else {
      answer = `Hello ${user.name}! I am your AI Campus Assistant. I can help you with your attendance records, upcoming exams, pending assignments, CGPA standing, placement opportunities, and college notices. How can I assist you with your academic schedule today?`;
    }
  } else {
    // Admin / Faculty / HOD heuristic responder
    if (q.includes('student')) {
      answer = `The campus currently has ${campusContext?.campusStats?.totalStudents || 0} enrolled students across ${campusContext?.campusStats?.departmentsCount || 0} active department(s).`;
    } else if (q.includes('faculty') || q.includes('teacher') || q.includes('staff')) {
      answer = `There are currently ${campusContext?.campusStats?.totalFaculty || 0} faculty members registered in the campus directory.`;
    } else if (q.includes('department')) {
      const depts = campusContext?.campusStats?.departments?.join(', ') || 'N/A';
      answer = `There are ${campusContext?.campusStats?.departmentsCount || 0} registered departments: ${depts}.`;
    } else if (q.includes('exam') || q.includes('examination')) {
      const exams = campusContext?.upcomingExams || [];
      if (exams.length > 0) {
        const list = exams.map(e => `• ${e.title} (${e.subject?.name || 'Subject'}): on ${new Date(e.examDate).toLocaleDateString()}`).join('\n');
        answer = `There are ${exams.length} upcoming scheduled exam(s):\n${list}`;
      } else {
        answer = `There are currently no upcoming examinations scheduled in the academic calendar.`;
      }
    } else if (q.includes('attendance')) {
      answer = `You can review and manage student attendance in the Attendance module, or generate institutional analytics reports in the Analytics tab.`;
    } else if (q.includes('notice') || q.includes('announcement')) {
      const notices = campusContext?.recentNotices || [];
      if (notices.length > 0) {
        const list = notices.map(n => `• ${n.title} [${n.priority?.toUpperCase()}]`).join('\n');
        answer = `Recent campus notices:\n${list}`;
      } else {
        answer = `There are no recent campus circulars posted.`;
      }
    } else {
      answer = `Hello ${user.name} (${user.role.toUpperCase()})! I am your AI Smart Campus Management Assistant. I can help you with campus statistics, enrolled students, faculty members, departments, upcoming examinations, and official announcements. How may I assist you?`;
    }
  }

  return {
    answer,
    source: 'campus-academic-knowledgebase',
  };
};

/**
 * Evaluates student profile compatibility against a placement drive.
 */
export const matchStudentToPlacement = async ({ student, placement }) => {
  const studentCgpa = student.cgpa || 0;
  const minCgpa = placement.minimumCgpa || 0;
  const isCgpaEligible = studentCgpa >= minCgpa;

  const studentSkills = (student.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (placement.requiredSkills || []).map(s => s.toLowerCase());

  const matchedSkills = requiredSkills.filter(reqSkill =>
    studentSkills.some(studSkill => studSkill.includes(reqSkill) || reqSkill.includes(studSkill))
  );

  const missingSkills = requiredSkills.filter(
    reqSkill => !matchedSkills.includes(reqSkill)
  );

  const skillScore = requiredSkills.length > 0
    ? (matchedSkills.length / requiredSkills.length) * 100
    : 100;

  let overallMatchScore = (isCgpaEligible ? 50 : 20) + (skillScore * 0.5);
  overallMatchScore = Math.min(Math.round(overallMatchScore), 100);

  let matchQuality = 'Moderate Match';
  if (overallMatchScore >= 80 && isCgpaEligible) matchQuality = 'High Match';
  else if (overallMatchScore < 50 || !isCgpaEligible) matchQuality = 'Low Match';

  let aiEvaluation = `Student meets CGPA criteria (${studentCgpa} vs ${minCgpa} required). Matched skills: ${matchedSkills.join(', ')}. Missing key skills: ${missingSkills.join(', ')}.`;

  if (genAI) {
    try {
      const model = getGeminiModel();
      const prompt = `You are a university placement officer. Assess student fit for a job posting.
Company: ${placement.companyName}
Role: ${placement.jobRole}
Required Skills: ${placement.requiredSkills.join(', ')}
Minimum CGPA: ${placement.minimumCgpa}
Student CGPA: ${student.cgpa}
Student Skills: ${(student.skills || []).join(', ')}
Generate a concise 2-sentence match evaluation and one tip to boost candidacy. Keep under 50 words.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        aiEvaluation = text.trim();
      }
    } catch (err) {
      console.warn(`[Gemini Placement Matching Fallback]: ${err.message}`);
    }
  }

  return {
    isEligible: isCgpaEligible,
    overallMatchScore,
    matchQuality,
    matchedSkills,
    missingSkills,
    aiEvaluation,
  };
};

/**
 * Generates an executive departmental academic health summary for HOD & Admin.
 */
export const generateDepartmentSummary = async ({ departmentName, studentCount, facultyCount, avgCgpa, avgAttendance, atRiskCount }) => {
  let summary = `Department of ${departmentName}: Currently managing ${studentCount} students and ${facultyCount} faculty members. The average student CGPA stands at ${avgCgpa.toFixed(2)} with a departmental attendance rate of ${avgAttendance.toFixed(1)}%. There are currently ${atRiskCount} student(s) identified with high/medium academic risk indicators requiring proactive mentoring.`;

  if (genAI) {
    try {
      const model = getGeminiModel();
      const prompt = `You are a higher education academic auditor. Generate a professional 3-sentence executive summary for the Head of Department.
Department: ${departmentName}
Students: ${studentCount}
Faculty: ${facultyCount}
Department Average CGPA: ${avgCgpa.toFixed(2)}/10
Average Attendance: ${avgAttendance.toFixed(1)}%
At-Risk Students Count: ${atRiskCount}
Highlight strengths and mention recommendations for faculty workload or student mentoring. Under 70 words.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        summary = text.trim();
      }
    } catch (err) {
      console.warn(`[Gemini Department Summary Fallback]: ${err.message}`);
    }
  }

  return summary;
};
