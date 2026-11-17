import { Op } from 'sequelize';
import {
  Student,
  Mark,
  Attendance,
  Assignment,
  Submission,
  Examination,
  Placement,
  Notice,
  AcademicReport,
  Department,
  User,
  Subject,
  Faculty,
} from '../models/index.js';
import {
  predictStudentRisk,
  chatWithCampusAssistant,
  matchStudentToPlacement,
  generateDepartmentSummary,
} from '../services/aiService.js';

// @desc    Predict students who may be academically at risk
// @route   GET /api/ai/at-risk-students
// @access  Private (Admin, HOD, Faculty)
export const getAtRiskStudents = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const where = {};

    if (req.user.role === 'hod' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    } else if (department) {
      where.departmentId = department;
    }

    if (semester) {
      where.currentSemester = Number(semester);
    }

    const students = await Student.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
    });

    const analysisResults = await Promise.all(
      students.map(async (student) => {
        const totalClasses = await Attendance.count({ where: { studentId: student.id } });
        const presentClasses = await Attendance.count({
          where: { studentId: student.id, status: 'present' },
        });
        const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : Number(student.attendancePercentage);

        const marksData = await Mark.findAll({ where: { studentId: student.id } });

        const totalAssignments = await Assignment.count({
          where: {
            departmentId: student.departmentId,
            semester: student.currentSemester,
          },
        });
        const submittedAssignments = await Submission.count({
          where: { studentId: student.id },
        });

        const prediction = await predictStudentRisk({
          student,
          attendanceRate,
          marksData,
          assignmentData: {
            total: totalAssignments,
            submitted: submittedAssignments,
          },
        });

        const existingReport = await AcademicReport.findOne({
          where: { studentId: student.id },
        });

        if (existingReport) {
          existingReport.riskLevel = prediction.riskLevel;
          existingReport.riskFactors = prediction.riskFactors;
          existingReport.recommendedInterventions = prediction.recommendations;
          existingReport.aiAnalysis = prediction.aiSummary;
          existingReport.lastEvaluated = new Date();
          await existingReport.save();
        } else {
          await AcademicReport.create({
            studentId: student.id,
            riskLevel: prediction.riskLevel,
            riskFactors: prediction.riskFactors,
            recommendedInterventions: prediction.recommendations,
            aiAnalysis: prediction.aiSummary,
            lastEvaluated: new Date(),
          });
        }

        return {
          studentId: student.id,
          name: student.user?.name,
          email: student.user?.email,
          avatar: student.user?.avatar,
          rollNumber: student.rollNumber,
          department: student.department?.name,
          departmentCode: student.department?.code,
          currentSemester: student.currentSemester,
          cgpa: student.cgpa,
          prediction,
        };
      })
    );

    const sorted = analysisResults.sort((a, b) => b.prediction.riskScore - a.prediction.riskScore);
    const atRiskOnly = sorted.filter((s) => s.prediction.riskLevel !== 'low');

    res.json({
      success: true,
      totalAnalyzed: analysisResults.length,
      atRiskCount: atRiskOnly.length,
      students: sorted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get individual student academic risk & recommendations
// @route   GET /api/ai/student-risk/:studentId
// @access  Private
export const getStudentRiskReport = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (req.user.role === 'student' && String(student.userId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only access your own academic records',
      });
    }

    const totalClasses = await Attendance.count({ where: { studentId: student.id } });
    const presentClasses = await Attendance.count({
      where: { studentId: student.id, status: 'present' },
    });
    const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : Number(student.attendancePercentage);

    const marksData = await Mark.findAll({
      where: { studentId: student.id },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
    });

    const totalAssignments = await Assignment.count({
      where: {
        departmentId: student.departmentId,
        semester: student.currentSemester,
      },
    });
    const submittedAssignments = await Submission.count({
      where: { studentId: student.id },
    });

    const prediction = await predictStudentRisk({
      student,
      attendanceRate,
      marksData,
      assignmentData: {
        total: totalAssignments,
        submitted: submittedAssignments,
      },
    });

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.user?.name,
        rollNumber: student.rollNumber,
        department: student.department?.name,
        semester: student.currentSemester,
        cgpa: student.cgpa,
      },
      report: prediction,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Campus Chatbot (Accessible to All Roles)
// @route   POST /api/ai/assistant/chat
// @access  Private (All Roles)
export const chatAssistant = async (req, res, next) => {
  try {
    const { message, query: bodyQuery } = req.body;
    const query = message || bodyQuery;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    let studentContext = null;
    let campusContext = null;

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        where: { userId: req.user.id },
        include: [{ model: Department, as: 'department' }],
      });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      const totalClasses = await Attendance.count({ where: { studentId: student.id } });
      const presentClasses = await Attendance.count({
        where: { studentId: student.id, status: 'present' },
      });
      const overallPercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : student.attendancePercentage;

      const upcomingExams = await Examination.findAll({
        where: {
          departmentId: student.departmentId,
          semester: student.currentSemester,
          examDate: { [Op.gte]: new Date() },
        },
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
        order: [['examDate', 'ASC']],
        limit: 5,
      });

      const allAssignments = await Assignment.findAll({
        where: {
          departmentId: student.departmentId,
          semester: student.currentSemester,
          dueDate: { [Op.gte]: new Date() },
        },
        include: [{ model: Subject, as: 'subject', attributes: ['id', 'name'] }],
      });

      const pendingAssignments = [];
      for (const a of allAssignments) {
        const sub = await Submission.findOne({
          where: { assignmentId: a.id, studentId: student.id },
        });
        if (!sub) pendingAssignments.push(a);
      }

      const recentNotices = await Notice.findAll({
        where: {
          [Op.or]: [{ departmentId: null }, { departmentId: student.departmentId }],
        },
        order: [['createdAt', 'DESC']],
        limit: 4,
      });

      const placementHighlights = await Placement.findAll({
        where: {
          isActive: true,
          minimumCgpa: { [Op.lte]: student.cgpa },
        },
        attributes: ['id', 'companyName', 'jobRole', 'salaryPackage'],
        limit: 3,
      });

      studentContext = {
        student,
        attendanceSummary: { overallPercentage },
        upcomingExams,
        pendingAssignments,
        recentNotices,
        placementHighlights,
      };
    } else {
      // Non-student (Admin / HOD / Faculty) Context
      const totalStudents = await Student.count();
      const totalFaculty = await Faculty.count();
      const departments = await Department.findAll({ attributes: ['id', 'name', 'code'] });
      const recentNotices = await Notice.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['title', 'priority', 'createdAt'],
      });
      const upcomingExams = await Examination.findAll({
        where: { examDate: { [Op.gte]: new Date() } },
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
        order: [['examDate', 'ASC']],
        limit: 5,
      });

      campusContext = {
        campusStats: {
          totalStudents,
          totalFaculty,
          departmentsCount: departments.length,
          departments: departments.map((d) => d.name),
        },
        upcomingExams,
        recentNotices,
      };
    }

    const aiResponse = await chatWithCampusAssistant({
      query,
      studentContext,
      campusContext,
      user: req.user,
    });

    res.json({
      success: true,
      answer: aiResponse.answer,
      reply: aiResponse.answer,
      source: aiResponse.source,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Evaluate AI placement match for a student
// @route   GET /api/ai/placement-match/:placementId
// @access  Private
export const getPlacementMatch = async (req, res, next) => {
  try {
    const { placementId } = req.params;
    const placement = await Placement.findByPk(placementId);

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement opportunity not found' });
    }

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const matchResult = await matchStudentToPlacement({ student, placement });

    res.json({
      success: true,
      placement: {
        id: placement.id,
        companyName: placement.companyName,
        jobRole: placement.jobRole,
      },
      match: matchResult,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate executive department summary for HOD
// @route   GET /api/ai/department-summary
// @access  Private (HOD, Admin)
export const getDepartmentSummary = async (req, res, next) => {
  try {
    const departmentId = req.user.departmentId;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'No department assigned to profile' });
    }

    const students = await Student.findAll({ where: { departmentId } });
    const facultyCount = await Faculty.count({ where: { departmentId } });
    const validCgpaStudents = students.filter((s) => Number(s.cgpa) > 0);
    const avgCgpa =
      validCgpaStudents.length > 0
        ? validCgpaStudents.reduce((sum, s) => sum + Number(s.cgpa), 0) / validCgpaStudents.length
        : 7.0;

    const avgAttendance =
      students.length > 0
        ? students.reduce((sum, s) => sum + Number(s.attendancePercentage || 0), 0) / students.length
        : 80;

    const atRiskCount = students.filter((s) => Number(s.attendancePercentage || 0) < 75 || Number(s.cgpa) < 5.5).length;

    const deptDoc = await Department.findByPk(departmentId);

    const summary = await generateDepartmentSummary({
      departmentName: deptDoc?.name,
      studentCount: students.length,
      facultyCount,
      avgCgpa,
      avgAttendance,
      atRiskCount,
    });

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
