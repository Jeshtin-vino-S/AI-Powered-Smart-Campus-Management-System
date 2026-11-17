import { Assignment, Submission, Faculty, Student, Subject, Department, User, Notification } from '../models/index.js';
import { handleFileUpload } from '../middleware/uploadMiddleware.js';

// @desc    Faculty creates assignment
// @route   POST /api/assignments
// @access  Private (Faculty, HOD)
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, subjectId, dueDate, maxMarks, instructions } = req.body;

    if (!title || !description || !subjectId || !dueDate || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const faculty =
      req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
    if (!faculty && req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ success: false, message: 'Faculty profile not found' });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (req.user.role === 'faculty') {
      if (subject.facultyId !== faculty.id) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to create assignments for subjects assigned to you.',
        });
      }
    } else if (req.user.role === 'hod') {
      if (subject.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You are only authorized to manage assignments for your own department.',
        });
      }
    }

    let attachmentUrl = '';
    if (req.file) {
      attachmentUrl = await handleFileUpload(req.file, 'assignments');
    } else if (req.body.attachmentUrl) {
      attachmentUrl = req.body.attachmentUrl;
    }

    const assignment = await Assignment.create({
      title,
      description,
      subjectId: subject.id,
      facultyId: faculty.id,
      departmentId: subject.departmentId,
      semester: subject.semester,
      dueDate,
      maxMarks: Number(maxMarks),
      attachmentUrl,
      instructions: instructions || '',
      totalSubmissions: 0,
    });

    const students = await Student.findAll({
      where: {
        departmentId: subject.departmentId,
        currentSemester: subject.semester,
      },
    });

    await Promise.all(
      students.map((s) => {
        return Notification.create({
          recipientId: s.userId,
          title: `New Assignment: ${title}`,
          message: `A new assignment has been posted for ${subject.name}. Due on ${new Date(dueDate).toLocaleDateString()}.`,
          type: 'assignment',
          link: '/student/assignments',
        });
      })
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created and published to students successfully',
      assignment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignments (role filtered)
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res, next) => {
  try {
    const { subjectId, semester, departmentId } = req.query;
    const where = {};

    if (subjectId) where.subjectId = subjectId;
    if (semester) where.semester = Number(semester);
    if (departmentId) where.departmentId = departmentId;

    if (req.user.role === 'student' && req.student) {
      where.departmentId = req.student.departmentId;
      where.semester = req.student.currentSemester;
    } else if (req.user.role === 'faculty') {
      const faculty =
        req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
      if (faculty) where.facultyId = faculty.id;
    } else if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    }

    const assignments = await Assignment.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: Faculty,
          as: 'faculty',
          attributes: ['id', 'employeeId'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
        },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['dueDate', 'ASC']],
    });

    res.json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single assignment details with student submission status
// @route   GET /api/assignments/:id
// @access  Private
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    let mySubmission = null;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (student) {
        mySubmission = await Submission.findOne({
          where: {
            assignmentId: assignment.id,
            studentId: student.id,
          },
        });
      }
    }

    res.json({
      success: true,
      assignment: {
        ...assignment.toJSON(),
        mySubmission,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student submits assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
export const submitAssignment = async (req, res, next) => {
  try {
    const { comments, fileUrl: providedUrl } = req.body;
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(403).json({ success: false, message: 'Student profile not found' });
    }

    let fileUrl = providedUrl;
    if (req.file) {
      fileUrl = await handleFileUpload(req.file, 'submissions');
    }

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    let submission = await Submission.findOne({
      where: {
        assignmentId: assignment.id,
        studentId: student.id,
      },
    });

    if (submission) {
      submission.submissionDate = new Date();
      submission.fileUrl = fileUrl;
      submission.comments = comments || '';
      submission.status = isLate ? 'late' : 'submitted';
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId: assignment.id,
        studentId: student.id,
        submissionDate: new Date(),
        fileUrl,
        comments: comments || '',
        status: isLate ? 'late' : 'submitted',
      });
    }

    const totalCount = await Submission.count({ where: { assignmentId: assignment.id } });
    assignment.totalSubmissions = totalCount;
    await assignment.save();

    res.json({
      success: true,
      message: `Assignment submitted successfully${isLate ? ' (Marked Late)' : ''}!`,
      submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Faculty gets all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Faculty, HOD, Admin)
export const getSubmissionsForAssignment = async (req, res, next) => {
  try {
    const submissions = await Submission.findAll({
      where: { assignmentId: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'rollNumber', 'section'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
        },
      ],
      order: [['submissionDate', 'DESC']],
    });

    res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Faculty evaluates / grades a submission
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Private (Faculty, HOD)
export const evaluateSubmission = async (req, res, next) => {
  try {
    const { marksObtained, feedback } = req.body;

    if (marksObtained === undefined || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const submission = await Submission.findByPk(req.params.submissionId, {
      include: [
        { model: Assignment, as: 'assignment' },
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
      ],
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission record not found' });
    }

    const faculty = await Faculty.findOne({ where: { userId: req.user.id } });

    if (Number(marksObtained) > Number(submission.assignment?.maxMarks)) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained cannot exceed maximum marks (${submission.assignment?.maxMarks})`,
      });
    }

    submission.marksObtained = Number(marksObtained);
    submission.feedback = feedback;
    submission.status = 'evaluated';
    submission.evaluatedBy = faculty?.id || null;
    submission.evaluatedAt = new Date();
    await submission.save();

    if (submission.student?.user?.id) {
      await Notification.create({
        recipientId: submission.student.user.id,
        title: `Assignment Evaluated: ${submission.assignment?.title}`,
        message: `Your submission has been evaluated. Score: ${marksObtained}/${submission.assignment?.maxMarks}. Feedback: ${feedback}`,
        type: 'assignment',
        link: '/student/assignments',
      });
    }

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Faculty, Admin, HOD)
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await Submission.destroy({ where: { assignmentId: assignment.id } });
    await assignment.destroy();

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
