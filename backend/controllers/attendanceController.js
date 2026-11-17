import { Op } from 'sequelize';
import { Attendance, Subject, Student, Faculty, User, Department } from '../models/index.js';
import {
  createAttendanceSession,
  generateDynamicQRToken,
  verifyQRToken,
  endAttendanceSession,
  getSessionInfo,
} from '../services/qrService.js';
import { emitToAttendanceSession } from '../services/socketService.js';

// @desc    Faculty starts a new attendance session
// @route   POST /api/attendance/session/start
// @access  Private (Faculty, HOD)
export const startSession = async (req, res, next) => {
  try {
    const { subjectId, section, validityMinutes } = req.body;

    if (!subjectId || !section || !validityMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const faculty = req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
    if (!faculty && req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Faculty profile not found' });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Role-based Subject & Department checks
    if (req.user.role === 'faculty') {
      if (subject.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to start attendance sessions for subjects assigned to you.',
        });
      }
    } else if (req.user.role === 'hod') {
      if (subject.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to manage attendance for your own department subjects.',
        });
      }
    }

    const sessionId = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const session = await createAttendanceSession({
      sessionId,
      subjectId: subject.id,
      facultyId: faculty.id,
      departmentId: subject.departmentId,
      semester: subject.semester,
      section,
      validityMinutes,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session initiated successfully',
      session: {
        sessionId: session.sessionId,
        subjectId: session.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: session.semester,
        section: session.section,
        expiresAt: session.expiresAt,
        tokenRefreshIntervalSeconds: 15,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Faculty gets live refreshing QR Token
// @route   GET /api/attendance/session/:sessionId/token
// @access  Private (Faculty, HOD)
export const getLiveSessionToken = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionInfo(sessionId);

    if (!session || !session.active) {
      return res.status(400).json({
        success: false,
        message: 'This attendance session has expired or is invalid',
      });
    }

    const qrData = generateDynamicQRToken(sessionId);

    res.json({
      success: true,
      sessionId,
      qrData,
      validForSeconds: 15,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student scans dynamic QR to mark attendance
// @route   POST /api/attendance/scan
// @access  Private (Student)
export const markQRAttendance = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const student = await Student.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    });

    if (!student) {
      return res.status(403).json({ success: false, message: 'Student profile not found' });
    }

    const verification = verifyQRToken(qrData);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message,
      });
    }

    const { session } = verification;

    if (
      String(student.departmentId) !== String(session.departmentId) ||
      Number(student.currentSemester) !== Number(session.semester)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this department/semester course session',
      });
    }

    const existing = await Attendance.findOne({
      where: {
        sessionToken: session.sessionId,
        studentId: student.id,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this session',
      });
    }

    const attendance = await Attendance.create({
      subjectId: session.subjectId,
      facultyId: session.facultyId,
      studentId: student.id,
      date: new Date(),
      status: 'present',
      sessionToken: session.sessionId,
      verificationMethod: 'qr',
      semester: session.semester,
      academicYear: student.academicYear,
    });

    const totalRecords = await Attendance.count({ where: { studentId: student.id } });
    const presentRecords = await Attendance.count({
      where: {
        studentId: student.id,
        status: 'present',
      },
    });

    student.attendancePercentage = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 100;
    await student.save();

    emitToAttendanceSession(session.sessionId, 'student_marked_attendance', {
      studentId: student.id,
      studentName: student.user?.name,
      rollNumber: student.rollNumber,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Attendance successfully recorded via Smart QR!',
      attendance: {
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        method: attendance.verificationMethod,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Faculty marks attendance manually
// @route   POST /api/attendance/manual
// @access  Private (Faculty, HOD)
export const markManualAttendance = async (req, res, next) => {
  try {
    const { subjectId, records, date, academicYear } = req.body;

    if (!subjectId || !records || !date || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const faculty = req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
    if (!faculty && req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Faculty profile not found' });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Role-based Subject & Department checks
    if (req.user.role === 'faculty') {
      if (subject.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to start attendance sessions for subjects assigned to you.',
        });
      }
    } else if (req.user.role === 'hod') {
      if (subject.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to manage attendance for your own department subjects.',
        });
      }
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    for (const rec of records) {
      const existing = await Attendance.findOne({
        where: {
          subjectId: subject.id,
          studentId: rec.studentId,
          date: { [Op.between]: [startOfDay, endOfDay] },
        },
      });

      if (existing) {
        existing.status = rec.status;
        existing.verificationMethod = 'manual';
        existing.remarks = rec.remarks || '';
        await existing.save();
      } else {
        await Attendance.create({
          subjectId: subject.id,
          facultyId: faculty.id,
          studentId: rec.studentId,
          date: new Date(date),
          status: rec.status,
          verificationMethod: 'manual',
          semester: subject.semester,
          academicYear,
          remarks: rec.remarks || '',
        });
      }

      const total = await Attendance.count({ where: { studentId: rec.studentId } });
      const present = await Attendance.count({
        where: { studentId: rec.studentId, status: 'present' },
      });
      const pct = total > 0 ? (present / total) * 100 : 100;
      await Student.update({ attendancePercentage: pct }, { where: { id: rec.studentId } });
    }

    res.json({
      success: true,
      message: `Manual attendance recorded for ${records.length} students`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance records (Student sees their own; Faculty sees their subject records; HOD/Admin sees dept/all records)
// @route   GET /api/attendance/my
// @access  Private
export const getMyAttendance = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) {
        return res.status(403).json({ success: false, message: 'Student profile not found' });
      }

      const records = await Attendance.findAll({
        where: { studentId: student.id },
        include: [
          { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] },
          {
            model: Faculty,
            as: 'faculty',
            attributes: ['id', 'employeeId'],
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          },
        ],
        order: [['date', 'DESC']],
      });

      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const overallPercentage = total > 0 ? ((present / total) * 100).toFixed(1) : 100;

      return res.json({
        success: true,
        stats: {
          totalClasses: total,
          attended: present,
          percentage: Number(overallPercentage),
          isAtRisk: Number(overallPercentage) < 75,
        },
        records,
      });
    }

    // For Faculty, HOD, Admin: Return recent attendance records
    let where = {};
    if (req.user.role === 'faculty') {
      const faculty = req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
      if (faculty) {
        where.facultyId = faculty.id;
      }
    }

    const records = await Attendance.findAll({
      where,
      limit: 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'registrationNumber'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        createdAt: r.createdAt,
        status: r.status,
        studentName: r.student?.user?.name || 'Student',
        subjectName: r.subject?.name || '',
        subjectCode: r.subject?.code || '',
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subject attendance report for Faculty/HOD
// @route   GET /api/attendance/subject/:subjectId
// @access  Private (Faculty, HOD, Admin)
export const getSubjectAttendanceReport = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findByPk(subjectId);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const students = await Student.findAll({
      where: {
        departmentId: subject.departmentId,
        currentSemester: subject.semester,
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
      order: [['rollNumber', 'ASC']],
    });

    const studentReports = await Promise.all(
      students.map(async (st) => {
        const total = await Attendance.count({
          where: { subjectId: subject.id, studentId: st.id },
        });
        const present = await Attendance.count({
          where: { subjectId: subject.id, studentId: st.id, status: 'present' },
        });
        const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';

        return {
          studentId: st.id,
          name: st.user?.name,
          rollNumber: st.rollNumber,
          section: st.section,
          totalSessions: total,
          attendedSessions: present,
          percentage: Number(pct),
          isAtRisk: Number(pct) < 75,
        };
      })
    );

    res.json({
      success: true,
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
      },
      studentReports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End active attendance session
// @route   POST /api/attendance/session/:sessionId/end
// @access  Private (Faculty, HOD)
export const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    endAttendanceSession(sessionId);

    const attendedCount = await Attendance.count({ where: { sessionToken: sessionId } });

    res.json({
      success: true,
      message: 'Attendance session successfully concluded',
      totalRecorded: attendedCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
