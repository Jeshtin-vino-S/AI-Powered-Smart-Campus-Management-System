import { Op } from 'sequelize';
import { Notice, Department, User } from '../models/index.js';
import { emitBroadcast, emitToRole, emitToDepartment } from '../services/socketService.js';

// @desc    Get all notices visible to the current user
// @route   GET /api/notices
// @access  Private
export const getNotices = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userDeptId = req.user.departmentId;

    const notices = await Notice.findAll({
      include: [
        { model: User, as: 'postedBy', attributes: ['id', 'name', 'email', 'role'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Filter in JS for flexible JSON targetRoles matching
    const visibleNotices = notices.filter((n) => {
      const roles = Array.isArray(n.targetRoles) ? n.targetRoles : [];
      const roleMatches = roles.includes('all') || roles.includes(userRole);
      const deptMatches = !n.departmentId || (userDeptId && String(n.departmentId) === String(userDeptId));
      return roleMatches && deptMatches;
    });

    res.json({
      success: true,
      count: visibleNotices.length,
      notices: visibleNotices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create notice
// @route   POST /api/notices
// @access  Private (Admin, HOD, Faculty)
export const createNotice = async (req, res, next) => {
  try {
    const { title, content, priority, targetRoles, department, expiryDate } = req.body;

    if (!title || !content || !priority || !targetRoles) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const rolesArray = Array.isArray(targetRoles) ? targetRoles : [targetRoles];

    const notice = await Notice.create({
      title,
      content,
      priority,
      targetRoles: rolesArray,
      departmentId: department || null,
      postedById: req.user.id,
      expiryDate: expiryDate || null,
    });

    if (department) {
      emitToDepartment(String(department), 'new_notice', notice);
    } else if (rolesArray.includes('all')) {
      emitBroadcast('new_notice', notice);
    } else {
      rolesArray.forEach((r) => emitToRole(r, 'new_notice', notice));
    }

    res.status(201).json({
      success: true,
      message: 'Notice created and broadcasted successfully',
      notice,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin, HOD)
export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByPk(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await notice.destroy();

    res.json({
      success: true,
      message: 'Notice deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
