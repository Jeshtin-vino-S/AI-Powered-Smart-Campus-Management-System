import { Examination, Mark, Subject, Student, Faculty, Department, User, Notification } from '../models/index.js';

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  return 'F';
};

// @desc    Admin / Faculty creates a new Examination
// @route   POST /api/exams
// @access  Private (Admin, HOD, Faculty)
export const createExam = async (req, res, next) => {
  try {
    const {
      title,
      type,
      department,
      semester,
      academicYear,
      subject,
      examDate,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      roomNumber,
    } = req.body;

    if (
      !title ||
      !type ||
      !department ||
      !semester ||
      !academicYear ||
      !subject ||
      !examDate ||
      !startTime ||
      !endTime ||
      !totalMarks ||
      !passingMarks ||
      !roomNumber
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const exam = await Examination.create({
      title,
      type,
      departmentId: department,
      semester: Number(semester),
      academicYear,
      subjectId: subject,
      examDate,
      startTime,
      endTime,
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      roomNumber,
    });

    const students = await Student.findAll({
      where: { departmentId: department, currentSemester: Number(semester) },
    });

    await Promise.all(
      students.map((s) => {
        return Notification.create({
          recipientId: s.userId,
          title: `Exam Scheduled: ${title}`,
          message: `An examination has been scheduled for ${examDate} (${startTime} - ${endTime}) in ${roomNumber}.`,
          type: 'exam',
          link: '/student/results',
        });
      })
    );

    res.status(201).json({
      success: true,
      message: 'Examination scheduled successfully',
      exam,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all scheduled examinations
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.query;
    const where = {};

    if (department) where.departmentId = department;
    if (semester) where.semester = Number(semester);
    if (academicYear) where.academicYear = academicYear;

    if (req.user.role === 'student' && req.student) {
      where.departmentId = req.student.departmentId;
      where.semester = req.student.currentSemester;
    } else if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    } else if (req.user.role === 'faculty') {
      const faculty =
        req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
      if (faculty) {
        const taughtSubjects = await Subject.findAll({
          where: { facultyId: faculty.id },
          attributes: ['id'],
        });
        const subIds = taughtSubjects.map((s) => s.id);
        where.subjectId = { [Op.in]: subIds };
      }
    }

    const exams = await Examination.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['examDate', 'ASC'], ['startTime', 'ASC']],
    });

    res.json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Faculty uploads / submits marks for an exam
// @route   POST /api/exams/:examId/marks
// @access  Private (Faculty, HOD)
export const submitMarks = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const marksList = req.body.marksList || req.body.marks;

    if (!marksList || !Array.isArray(marksList) || marksList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const exam = await Examination.findByPk(examId, {
      include: [{ model: Subject, as: 'subject' }],
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const faculty =
      req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
    if (!faculty && req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Faculty profile not found' });
    }

    if (req.user.role === 'faculty') {
      if (exam.subject?.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to enter marks for subjects assigned to you.',
        });
      }
    } else if (req.user.role === 'hod') {
      if (exam.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to manage exams for your own department.',
        });
      }
    }

    for (const m of marksList) {
      const percentage = (Number(m.marksObtained) / exam.totalMarks) * 100;
      const grade = calculateGrade(percentage);

      const existingMark = await Mark.findOne({
        where: { examinationId: exam.id, studentId: m.studentId },
      });

      if (existingMark) {
        existingMark.marksObtained = Number(m.marksObtained);
        existingMark.maxMarks = exam.totalMarks;
        existingMark.grade = grade;
        existingMark.remarks = m.remarks || '';
        existingMark.evaluatedBy = faculty.id;
        await existingMark.save();
      } else {
        await Mark.create({
          examinationId: exam.id,
          studentId: m.studentId,
          subjectId: exam.subjectId,
          marksObtained: Number(m.marksObtained),
          maxMarks: exam.totalMarks,
          grade,
          remarks: m.remarks || '',
          evaluatedBy: faculty.id,
        });
      }

      // Recompute CGPA roughly
      const allStudentMarks = await Mark.findAll({ where: { studentId: m.studentId } });
      if (allStudentMarks.length > 0) {
        const totalPct = allStudentMarks.reduce(
          (sum, mk) => sum + (Number(mk.marksObtained) / Number(mk.maxMarks)) * 10,
          0
        );
        const newCgpa = (totalPct / allStudentMarks.length).toFixed(2);
        await Student.update({ cgpa: Number(newCgpa) }, { where: { id: m.studentId } });
      }

      const st = await Student.findByPk(m.studentId);
      if (st) {
        await Notification.create({
          recipientId: st.userId,
          title: `Exam Result Published: ${exam.title}`,
          message: `Your score for ${exam.subject?.name} is ${m.marksObtained}/${exam.totalMarks} (Grade: ${grade}).`,
          type: 'exam',
          link: '/student/results',
        });
      }
    }

    res.json({
      success: true,
      message: `Marks successfully entered and computed for ${marksList.length} students`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student views their own exam results
// @route   GET /api/exams/my-results
// @access  Private (Student)
export const getMyResults = async (req, res, next) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(403).json({ success: false, message: 'Student profile not found' });
    }

    const marks = await Mark.findAll({
      where: { studentId: student.id },
      include: [
        { model: Examination, as: 'examination' },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      cgpa: student.cgpa,
      count: marks.length,
      marks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get results for an examination (Faculty / HOD / Admin)
// @route   GET /api/exams/:examId/results
// @access  Private (Faculty, HOD, Admin)
export const getExamResults = async (req, res, next) => {
  try {
    const marks = await Mark.findAll({
      where: { examinationId: req.params.examId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'rollNumber', 'section'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
      order: [['marksObtained', 'DESC']],
    });

    res.json({
      success: true,
      count: marks.length,
      marks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
