import { Op } from 'sequelize';
import { User, Student, Faculty, Department, Subject } from '../models/index.js';

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
      employeeId,
      designation,
      qualification,
      countryCode,
      phone,
      avatar,
    } = req.body;

    if (!name || !email || !password || !department || !designation || !qualification || !phone) {
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

    const deptDoc = await Department.findByPk(department);
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

    // Automatically set as HOD of the department
    deptDoc.hodId = user.id;
    await deptDoc.save();

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
