import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Student, Faculty, Department } from '../models/index.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      countryCode,
      phone,
      avatar,
      // Student specific
      rollNumber,
      registrationNumber,
      currentSemester,
      section,
      academicYear,
    } = req.body;

    if (!name || !email || !password || !role || !phone) {
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

    const digitsOnly = String(phone).replace(/\D/g, '');
    if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      });
    }
    const cleanPhone = digitsOnly;
    const selectedCountryCode = countryCode || '+91';

    // Role-based security check for public registration
    if (role === 'admin') {
      const adminExists = await User.findOne({ where: { role: 'admin' } });
      if (adminExists) {
        return res.status(403).json({
          success: false,
          message: 'Admin account already exists. New Admins can only be created by an authorized Admin.',
        });
      }
    } else if (role === 'hod') {
      return res.status(403).json({
        success: false,
        message: 'HOD accounts cannot be registered publicly. Only an Admin can create an HOD.',
      });
    } else if (role === 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Faculty accounts cannot be registered publicly. Only an Admin or HOD can create a Faculty.',
      });
    }

    if (role === 'student' && (!department || !currentSemester || !section || !academicYear)) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const deptDoc = department ? await Department.findByPk(department) : null;
    let finalRollNumber = rollNumber ? rollNumber.trim() : null;
    let finalRegNumber = registrationNumber ? registrationNumber.trim() : null;

    if (role === 'student') {
      if (!deptDoc) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      if (!finalRollNumber || !finalRegNumber) {
        const yearPart = academicYear ? academicYear.split('-')[0].trim() : String(new Date().getFullYear());
        let seq = 1;
        let candidateRoll = `${deptDoc.code}-${yearPart}-${String(seq).padStart(3, '0')}`;
        let candidateReg = `REG${yearPart}${String(seq).padStart(3, '0')}`;
        while (
          await Student.findOne({
            where: {
              [Op.or]: [{ rollNumber: candidateRoll }, { registrationNumber: candidateReg }],
            },
          })
        ) {
          seq++;
          candidateRoll = `${deptDoc.code}-${yearPart}-${String(seq).padStart(3, '0')}`;
          candidateReg = `REG${yearPart}${String(seq).padStart(3, '0')}`;
        }
        if (!finalRollNumber) finalRollNumber = candidateRoll;
        if (!finalRegNumber) finalRegNumber = candidateReg;
      }
    }

    const userExists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      countryCode: selectedCountryCode,
      phone: cleanPhone,
      avatar: avatar ? avatar.trim() : '',
    };

    if (department) {
      userData.departmentId = department;
    }

    const user = await User.create(userData);

    // Create role-specific profiles
    if (role === 'student') {
      await Student.create({
        userId: user.id,
        rollNumber: finalRollNumber,
        registrationNumber: finalRegNumber,
        departmentId: department,
        currentSemester: Number(currentSemester),
        section: section.trim(),
        academicYear: academicYear.trim(),
      });
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        countryCode: user.countryCode,
        phone: user.phone,
        ...(user.departmentId && { department: user.departmentId }),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact the administrator.',
      });
    }

    // Role-specific profile inclusion
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }],
      });
    } else if (user.role === 'faculty' || user.role === 'hod') {
      profile = await Faculty.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }],
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        countryCode: user.countryCode,
        phone: user.phone,
        department: user.department,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }],
      });
    } else if (user.role === 'faculty' || user.role === 'hod') {
      profile = await Faculty.findOne({
        where: { userId: user.id },
        include: [{ model: Department, as: 'department' }],
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

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, countryCode } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (countryCode) user.countryCode = countryCode;

    if (phone) {
      const digitsOnly = String(phone).replace(/\D/g, '');
      if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be exactly 10 digits',
        });
      }
      user.phone = digitsOnly;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        countryCode: user.countryCode,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findByPk(req.user.id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
