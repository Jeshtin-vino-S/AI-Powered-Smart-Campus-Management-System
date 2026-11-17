import jwt from 'jsonwebtoken';
import { User, Student, Faculty, Department, Subject } from '../models/index.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the administrator.',
      });
    }

    req.user = user;

    // Attach role-specific sub-profiles
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({
        where: { userId: user.id },
        include: [
          { model: Department, as: 'department' },
          { model: Faculty, as: 'mentor' },
        ],
      });
      req.student = studentProfile;
    } else if (user.role === 'faculty' || user.role === 'hod') {
      const facultyProfile = await Faculty.findOne({
        where: { userId: user.id },
        include: [
          { model: Department, as: 'department' },
          { model: Subject, as: 'assignedSubjects' },
        ],
      });
      req.faculty = facultyProfile;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
    });
  }
};
