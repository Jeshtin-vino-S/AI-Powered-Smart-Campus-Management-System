import { Op } from 'sequelize';
import {
  User,
  Student,
  Faculty,
  Department,
  Subject,
  Attendance,
  Mark,
  Examination,
  Assignment,
  Submission,
  Placement,
  Application,
  Timetable,
} from '../models/index.js';

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const cleanAndValidatePhone = (phone) => {
  if (!phone) return { valid: false, clean: '' };
  const digitsOnly = String(phone).replace(/\D/g, '');
  if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
    return { valid: false, clean: '' };
  }
  return { valid: true, clean: digitsOnly };
};

const generateEmployeeId = async (prefix, deptCode) => {
  const code = (deptCode || 'GEN').toUpperCase();
  let seq = 1;
  let candidateId = `${prefix}-${code}-${String(seq).padStart(3, '0')}`;
  while (await Faculty.findOne({ where: { employeeId: candidateId } })) {
    seq++;
    candidateId = `${prefix}-${code}-${String(seq).padStart(3, '0')}`;
  }
  return candidateId;
};

const generateStudentCredentials = async (deptCode, academicYear) => {
  const code = (deptCode || 'GEN').toUpperCase();
  const yearPart = academicYear ? academicYear.split('-')[0].trim() : String(new Date().getFullYear());
  let seq = 1;
  let candidateRoll = `${code}-${yearPart}-${String(seq).padStart(3, '0')}`;
  let candidateReg = `REG${yearPart}${String(seq).padStart(3, '0')}`;
  while (
    await Student.findOne({
      where: {
        [Op.or]: [{ rollNumber: candidateRoll }, { registrationNumber: candidateReg }],
      },
    })
  ) {
    seq++;
    candidateRoll = `${code}-${yearPart}-${String(seq).padStart(3, '0')}`;
    candidateReg = `REG${yearPart}${String(seq).padStart(3, '0')}`;
  }
  return { rollNumber: candidateRoll, registrationNumber: candidateReg };
};

// @desc    Get all users (with filtering, search, pagination)
// @route   GET /api/users
// @access  Private (Admin, HOD)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
      // HOD can only see and access faculty and students in their department
      if (!role) {
        where.role = { [Op.in]: ['faculty', 'student'] };
      } else if (role === 'admin' || role === 'hod') {
        where.role = { [Op.in]: ['faculty', 'student'] };
      }
    } else if (department) {
      where.departmentId = department;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit),
    });

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }, { model: Faculty, as: 'mentor' }],
      });
    } else if (user.role === 'faculty' || user.role === 'hod') {
      profile = await Faculty.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }, { model: Subject, as: 'assignedSubjects' }],
      });
    }

    res.json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user active status
// @route   PATCH /api/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'student') {
      await Student.destroy({ where: { userId: user.id } });
    } else if (user.role === 'faculty' || user.role === 'hod') {
      await Faculty.destroy({ where: { userId: user.id } });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all faculty members
// @route   GET /api/users/faculty/all
// @access  Private
export const getFacultyList = async (req, res, next) => {
  try {
    const { department } = req.query;
    const where = {};
    if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    } else if (department) {
      where.departmentId = department;
    }

    const faculty = await Faculty.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'assignedSubjects', attributes: ['id', 'name', 'code'] },
      ],
    });

    res.json({
      success: true,
      count: faculty.length,
      faculty,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete faculty profile, assigned subjects, timetables, and lecture sessions
// @route   GET /api/users/faculty/:id
// @access  Private
export const getFacultyDetails = async (req, res, next) => {
  try {
    const facultyInclude = [
      { model: User, as: 'user', attributes: { exclude: ['password'] } },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      { model: Subject, as: 'taughtSubjects' },
    ];

    // Priority 1: Check by Faculty PK
    let faculty = await Faculty.findByPk(req.params.id, { include: facultyInclude });

    // Priority 2: Fallback to searching by userId
    if (!faculty) {
      faculty = await Faculty.findOne({
        where: { userId: req.params.id },
        include: facultyInclude,
      });
    }

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Weekly Timetable Slots
    const timetables = await Timetable.findAll({
      where: { facultyId: faculty.id },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits'] }],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC'],
      ],
    });

    // Recent Verified Attendance / Lecture Sessions
    const attendances = await Attendance.findAll({
      where: { facultyId: faculty.id },
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] },
      ],
      order: [['date', 'DESC']],
      limit: 30,
    });

    // Assignments Issued
    const assignments = await Assignment.findAll({
      where: { facultyId: faculty.id },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
      order: [['dueDate', 'DESC']],
    });

    const totalLecturesConducted = await Attendance.count({ where: { facultyId: faculty.id } });

    const facultyJson = faculty.toJSON();
    facultyJson.timetables = timetables;
    facultyJson.attendances = attendances;
    facultyJson.assignments = assignments;

    res.json({
      success: true,
      faculty: facultyJson,
      stats: {
        totalLecturesConducted,
        assignedSubjectsCount: faculty.taughtSubjects?.length || 0,
        weeklySessionsCount: timetables.length,
        assignmentsCount: assignments.length,
        teachingLoadHours: faculty.teachingLoadHours || 16,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update faculty / HOD personal and academic details
// @route   PUT /api/users/faculty/:id
// @access  Private (Admin, HOD)
export const updateFacultyDetails = async (req, res, next) => {
  try {
    let faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      faculty = await Faculty.findOne({ where: { userId: req.params.id } });
    }

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const user = await User.findByPk(faculty.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user account not found' });
    }

    const {
      name,
      email,
      phone,
      employeeId,
      designation,
      qualification,
      specialization,
      cabinNumber,
      teachingLoadHours,
    } = req.body;

    // Email validation and duplicate check
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }
      const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phone) {
      const phoneCheck = cleanAndValidatePhone(phone);
      if (!phoneCheck.valid) {
        return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
      }
      user.phone = phoneCheck.clean;
    }
    await user.save();

    // Employee ID uniqueness check
    if (employeeId && employeeId.trim() !== faculty.employeeId) {
      const existingEmp = await Faculty.findOne({ where: { employeeId: employeeId.trim() } });
      if (existingEmp && existingEmp.id !== faculty.id) {
        return res.status(400).json({ success: false, message: 'A faculty member with this employee ID already exists' });
      }
      faculty.employeeId = employeeId.trim();
    }

    if (designation && designation.trim()) {
      faculty.designation = designation.trim();
    }
    if (qualification && qualification.trim()) {
      faculty.qualification = qualification.trim();
    }
    if (specialization !== undefined) {
      faculty.specialization = specialization.trim();
    }
    if (cabinNumber !== undefined) {
      faculty.cabinNumber = cabinNumber.trim();
    }
    if (teachingLoadHours !== undefined && !isNaN(Number(teachingLoadHours))) {
      faculty.teachingLoadHours = Number(teachingLoadHours);
    }

    await faculty.save();

    res.json({
      success: true,
      message: 'Faculty details updated successfully',
      faculty,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get students filtered by department, semester, section
// @route   GET /api/users/students/filter
// @access  Private
export const getStudentList = async (req, res, next) => {
  try {
    const { department, semester, section } = req.query;
    const where = {};

    if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    } else if (department) {
      where.departmentId = department;
    }
    if (semester) where.currentSemester = Number(semester);
    if (section) where.section = section;

    const students = await Student.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['rollNumber', 'ASC']],
    });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete student profile and academic details by Student ID or User ID
// @route   GET /api/users/student/:id
// @access  Private
export const getStudentDetails = async (req, res, next) => {
  try {
    const studentInclude = [
      { model: User, as: 'user', attributes: { exclude: ['password'] } },
      { model: Department, as: 'department' },
      {
        model: Faculty,
        as: 'mentor',
        include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }],
      },
      {
        model: Mark,
        as: 'marks',
        include: [
          { model: Examination, as: 'examination', attributes: ['title', 'type', 'totalMarks'] },
          { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        ],
      },
      {
        model: Submission,
        as: 'submissions',
        include: [
          {
            model: Assignment,
            as: 'assignment',
            attributes: ['title', 'maxMarks', 'dueDate'],
            include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
          },
        ],
      },
      {
        model: Application,
        as: 'applications',
        include: [
          { model: Placement, as: 'placement', attributes: ['companyName', 'jobRole', 'salaryPackage', 'location'] },
        ],
      },
    ];

    // Priority 1: Check by Student Primary Key ID (prevents collision between student.id and user.id)
    let student = await Student.findByPk(req.params.id, { include: studentInclude });

    // Priority 2: Fallback to searching by userId
    if (!student) {
      student = await Student.findOne({
        where: { userId: req.params.id },
        include: studentInclude,
      });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Fetch verified attendance logs explicitly for clean ordering and association
    const attendances = await Attendance.findAll({
      where: { studentId: student.id },
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
      order: [['date', 'DESC']],
      limit: 30,
    });

    const studentJson = student.toJSON();
    studentJson.attendances = attendances;

    const totalAttendance = await Attendance.count({ where: { studentId: student.id } });
    const presentAttendance = await Attendance.count({ where: { studentId: student.id, status: 'present' } });
    const attendancePercentage =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : Number(student.attendancePercentage || 0);

    const enrolledSubjects = await Subject.findAll({
      where: {
        departmentId: student.departmentId,
        semester: student.currentSemester,
      },
      include: [{ model: Faculty, as: 'faculty', include: [{ model: User, as: 'user', attributes: ['name'] }] }],
    });

    res.json({
      success: true,
      student: studentJson,
      stats: {
        attendanceRate: attendancePercentage,
        totalClasses: totalAttendance,
        presentClasses: presentAttendance,
        absentClasses: Math.max(0, totalAttendance - presentAttendance),
        cgpa: student.cgpa,
        enrolledSubjectsCount: enrolledSubjects.length,
      },
      enrolledSubjects,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student personal and academic details
// @route   PUT /api/users/student/:id
// @access  Private (Admin, HOD, Faculty)
export const updateStudentDetails = async (req, res, next) => {
  try {
    let student = await Student.findByPk(req.params.id);
    if (!student) {
      student = await Student.findOne({ where: { userId: req.params.id } });
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const user = await User.findByPk(student.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user account not found' });
    }

    const {
      name,
      email,
      phone,
      rollNumber,
      registrationNumber,
      currentSemester,
      section,
      academicYear,
      guardianName,
      guardianPhone,
      guardianEmail,
      cgpa,
    } = req.body;

    // Email validation and duplicate check
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }
      const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phone) {
      const phoneCheck = cleanAndValidatePhone(phone);
      if (!phoneCheck.valid) {
        return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits' });
      }
      user.phone = phoneCheck.clean;
    }
    await user.save();

    // Roll number uniqueness check
    if (rollNumber && rollNumber.trim() !== student.rollNumber) {
      const existingRoll = await Student.findOne({ where: { rollNumber: rollNumber.trim() } });
      if (existingRoll && existingRoll.id !== student.id) {
        return res.status(400).json({ success: false, message: 'A student with this roll number already exists' });
      }
      student.rollNumber = rollNumber.trim();
    }

    // Registration number uniqueness check
    if (registrationNumber && registrationNumber.trim() !== student.registrationNumber) {
      const existingReg = await Student.findOne({ where: { registrationNumber: registrationNumber.trim() } });
      if (existingReg && existingReg.id !== student.id) {
        return res.status(400).json({ success: false, message: 'A student with this registration number already exists' });
      }
      student.registrationNumber = registrationNumber.trim();
    }

    if (currentSemester !== undefined) {
      student.currentSemester = Number(currentSemester);
    }
    if (section && section.trim()) {
      student.section = section.trim().toUpperCase();
    }
    if (academicYear && academicYear.trim()) {
      student.academicYear = academicYear.trim();
    }
    if (guardianName !== undefined) {
      student.guardianName = guardianName.trim();
    }
    if (guardianPhone !== undefined) {
      student.guardianPhone = guardianPhone.trim();
    }
    if (guardianEmail !== undefined) {
      student.guardianEmail = guardianEmail.trim().toLowerCase();
    }
    if (cgpa !== undefined && !isNaN(Number(cgpa))) {
      student.cgpa = Number(cgpa);
    }

    await student.save();

    res.json({
      success: true,
      message: 'Student personal and academic details updated successfully',
      student,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin creates another Admin
// @route   POST /api/users/admin
// @access  Private (Admin)
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, countryCode, phone, avatar } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const phoneCheck = cleanAndValidatePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }

    const exists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'admin',
      countryCode: countryCode || '+91',
      phone: phoneCheck.clean,
      avatar: avatar ? avatar.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        countryCode: user.countryCode,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin creates HOD
// @route   POST /api/users/hod
// @access  Private (Admin)
export const createHOD = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      department,
      departments,
      employeeId,
      designation,
      qualification,
      countryCode,
      phone,
      avatar,
    } = req.body;

    const primaryDeptId = department || (Array.isArray(departments) && departments[0]) || null;

    if (!name || !email || !password || !primaryDeptId || !designation || !qualification || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const phoneCheck = cleanAndValidatePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }

    const deptDoc = await Department.findByPk(primaryDeptId);
    if (!deptDoc) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const userExists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Auto-generate employeeId if not manually provided: e.g. HOD-CSE-001
    const finalEmployeeId = employeeId?.trim() || (await generateEmployeeId('HOD', deptDoc.code));

    const facultyExists = await Faculty.findOne({ where: { employeeId: finalEmployeeId } });
    if (facultyExists) {
      return res.status(400).json({
        success: false,
        message: `Employee ID ${finalEmployeeId} already exists`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'hod',
      departmentId: deptDoc.id,
      countryCode: countryCode || '+91',
      phone: phoneCheck.clean,
      avatar: avatar ? avatar.trim() : '',
    });

    const facultyProfile = await Faculty.create({
      userId: user.id,
      employeeId: finalEmployeeId,
      departmentId: deptDoc.id,
      designation: designation.trim(),
      qualification: qualification.trim(),
    });

    // Automatically set as HOD of the primary department and all linked departments
    const allDeptIds = Array.isArray(departments) && departments.length > 0 ? departments : [deptDoc.id];
    for (const dId of allDeptIds) {
      await Department.update({ hodId: user.id }, { where: { id: dId } });
    }

    res.status(201).json({
      success: true,
      message: `HOD account created and assigned to department successfully with Employee ID: ${finalEmployeeId}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId,
        countryCode: user.countryCode,
        phone: user.phone,
      },
      profile: facultyProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin or HOD creates Faculty
// @route   POST /api/users/faculty
// @access  Private (Admin, HOD)
export const createFaculty = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      department,
      employeeId,
      designation,
      qualification,
      countryCode,
      phone,
      avatar,
    } = req.body;

    const targetDeptId = req.user.role === 'hod' ? req.user.departmentId : department;

    if (!name || !email || !password || !targetDeptId || !designation || !qualification || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const phoneCheck = cleanAndValidatePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }

    const deptDoc = await Department.findByPk(targetDeptId);
    if (!deptDoc) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const userExists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Auto-generate employeeId if not manually provided: e.g. FAC-CSE-001
    const finalEmployeeId = employeeId?.trim() || (await generateEmployeeId('FAC', deptDoc.code));

    const facultyExists = await Faculty.findOne({ where: { employeeId: finalEmployeeId } });
    if (facultyExists) {
      return res.status(400).json({
        success: false,
        message: `Employee ID ${finalEmployeeId} already exists`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'faculty',
      departmentId: deptDoc.id,
      countryCode: countryCode || '+91',
      phone: phoneCheck.clean,
      avatar: avatar ? avatar.trim() : '',
    });

    const facultyProfile = await Faculty.create({
      userId: user.id,
      employeeId: finalEmployeeId,
      departmentId: deptDoc.id,
      designation: designation.trim(),
      qualification: qualification.trim(),
    });

    res.status(201).json({
      success: true,
      message: `Faculty member created successfully with Employee ID: ${finalEmployeeId}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId,
        countryCode: user.countryCode,
        phone: user.phone,
      },
      profile: facultyProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin or HOD onboards Student
// @route   POST /api/users/student
// @access  Private (Admin, HOD)
export const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      department,
      rollNumber,
      registrationNumber,
      currentSemester,
      section,
      academicYear,
      countryCode,
      phone,
      avatar,
    } = req.body;

    const targetDeptId = req.user.role === 'hod' ? req.user.departmentId : department;

    if (
      !name ||
      !email ||
      !password ||
      !targetDeptId ||
      !currentSemester ||
      !section ||
      !academicYear ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const phoneCheck = cleanAndValidatePhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }

    const deptDoc = await Department.findByPk(targetDeptId);
    if (!deptDoc) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const userExists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    let finalRollNumber = rollNumber?.trim();
    let finalRegNumber = registrationNumber?.trim();

    if (!finalRollNumber || !finalRegNumber) {
      const generated = await generateStudentCredentials(deptDoc.code, academicYear);
      if (!finalRollNumber) finalRollNumber = generated.rollNumber;
      if (!finalRegNumber) finalRegNumber = generated.registrationNumber;
    }

    const studentExists = await Student.findOne({
      where: {
        [Op.or]: [{ rollNumber: finalRollNumber }, { registrationNumber: finalRegNumber }],
      },
    });
    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'A student with this roll number or registration number already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'student',
      departmentId: deptDoc.id,
      countryCode: countryCode || '+91',
      phone: phoneCheck.clean,
      avatar: avatar ? avatar.trim() : '',
    });

    const studentProfile = await Student.create({
      userId: user.id,
      rollNumber: finalRollNumber,
      registrationNumber: finalRegNumber,
      departmentId: deptDoc.id,
      currentSemester: Number(currentSemester),
      section: section.trim(),
      academicYear: academicYear.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId,
        countryCode: user.countryCode,
        phone: user.phone,
      },
      profile: studentProfile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
