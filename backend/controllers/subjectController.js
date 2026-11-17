import { Subject, Department, Faculty, User, Student } from '../models/index.js';

// @desc    Get all subjects (filterable by dept, semester, with role scoping)
// @route   GET /api/subjects
// @access  Private
export const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, faculty } = req.query;
    const where = {};

    if (department) where.departmentId = department;
    if (semester) where.semester = Number(semester);
    if (faculty) where.facultyId = faculty;

    // Strict Role Scoping
    if (req.user.role === 'faculty') {
      const facultyProfile =
        req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
      if (facultyProfile) {
        where.facultyId = facultyProfile.id;
      }
    } else if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    } else if (req.user.role === 'student') {
      const studentProfile =
        req.student || (await Student.findOne({ where: { userId: req.user.id } }));
      if (studentProfile) {
        where.departmentId = studentProfile.departmentId;
        where.semester = studentProfile.currentSemester;
      }
    }

    const subjects = await Subject.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        {
          model: Faculty,
          as: 'faculty',
          attributes: ['id', 'employeeId', 'designation'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
        },
      ],
      order: [['semester', 'ASC'], ['code', 'ASC']],
    });

    res.json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Admin, HOD)
export const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, credits, type, syllabus, faculty } = req.body;

    if (!name || !code || !department || !semester || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const semNum = Number(semester);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      return res.status(400).json({
        success: false,
        message: 'Semester must be a number between 1 and 8',
      });
    }

    const creditNum = Number(credits);
    if (isNaN(creditNum) || creditNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credits must be a positive number',
      });
    }

    const exists = await Subject.findOne({ where: { code: code.trim().toUpperCase() } });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A subject with this code already exists',
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      departmentId: department,
      semester: semNum,
      credits: creditNum,
      type: type || 'theory',
      syllabus: syllabus || '',
      facultyId: faculty || null,
    });

    if (faculty) {
      const facultyDoc = await Faculty.findByPk(faculty);
      if (facultyDoc && facultyDoc.addAssignedSubject) {
        await facultyDoc.addAssignedSubject(subject);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin, HOD)
export const updateSubject = async (req, res, next) => {
  try {
    const { name, code, semester, credits, type, syllabus, faculty } = req.body;
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name.trim();
    if (code) subject.code = code.trim().toUpperCase();
    if (semester !== undefined) subject.semester = Number(semester);
    if (credits !== undefined) subject.credits = Number(credits);
    if (type) subject.type = type;
    if (syllabus !== undefined) subject.syllabus = syllabus;

    if (faculty !== undefined) {
      subject.facultyId = faculty || null;
      if (faculty) {
        const facultyDoc = await Faculty.findByPk(faculty);
        if (facultyDoc && facultyDoc.addAssignedSubject) {
          await facultyDoc.addAssignedSubject(subject);
        }
      }
    }

    await subject.save();

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin, HOD)
export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await subject.destroy();

    res.json({
      success: true,
      message: 'Subject removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
