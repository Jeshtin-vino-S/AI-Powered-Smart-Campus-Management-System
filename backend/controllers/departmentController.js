import { Op } from 'sequelize';
import { Department, Student, Faculty, User } from '../models/index.js';

// @desc    Get all departments with stats (scoped by role)
// @route   GET /api/departments
// @access  Public / Authenticated
export const getDepartments = async (req, res, next) => {
  try {
    const where = {};
    if (req.user && req.user.role !== 'admin' && req.user.departmentId) {
      where.id = req.user.departmentId;
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: User,
          as: 'hod',
          attributes: ['id', 'name', 'email', 'avatar', 'phone'],
        },
      ],
      order: [['name', 'ASC']],
    });

    const enriched = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.count({ where: { departmentId: dept.id } });
        const facultyCount = await Faculty.count({ where: { departmentId: dept.id } });
        return {
          ...dept.toJSON(),
          stats: {
            students: studentCount,
            faculty: facultyCount,
          },
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      departments: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'hod',
          attributes: ['id', 'name', 'email', 'avatar', 'phone'],
        },
      ],
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const studentCount = await Student.count({ where: { departmentId: department.id } });
    const facultyCount = await Faculty.count({ where: { departmentId: department.id } });

    res.json({
      success: true,
      department: {
        ...department.toJSON(),
        stats: {
          students: studentCount,
          faculty: facultyCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, hod, establishedYear, intakeCapacity, contactEmail } = req.body;

    if (!name || !code || !description || !establishedYear || !intakeCapacity || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid contact email address',
      });
    }

    const currentYear = new Date().getFullYear();
    const yearNum = Number(establishedYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      return res.status(400).json({
        success: false,
        message: `Established year must be between 1900 and ${currentYear}`,
      });
    }

    const capacityNum = Number(intakeCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Intake capacity must be a positive number',
      });
    }

    const exists = await Department.findOne({
      where: {
        [Op.or]: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name or code already exists',
      });
    }

    const deptData = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      establishedYear: yearNum,
      intakeCapacity: capacityNum,
      contactEmail: contactEmail.trim().toLowerCase(),
    };

    if (hod) {
      deptData.hodId = hod;
    }

    const department = await Department.create(deptData);

    if (hod) {
      await User.update({ role: 'hod', departmentId: department.id }, { where: { id: hod } });
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
export const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, description, hod, establishedYear, intakeCapacity, contactEmail } = req.body;
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (contactEmail !== undefined) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid contact email address',
        });
      }
      department.contactEmail = contactEmail.trim().toLowerCase();
    }

    if (establishedYear !== undefined) {
      const currentYear = new Date().getFullYear();
      const yearNum = Number(establishedYear);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        return res.status(400).json({
          success: false,
          message: `Established year must be between 1900 and ${currentYear}`,
        });
      }
      department.establishedYear = yearNum;
    }

    if (intakeCapacity !== undefined) {
      const capacityNum = Number(intakeCapacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Intake capacity must be a positive number',
        });
      }
      department.intakeCapacity = capacityNum;
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (description !== undefined) department.description = description.trim();

    if (hod !== undefined) {
      if (hod) {
        department.hodId = hod;
        await User.update({ role: 'hod', departmentId: department.id }, { where: { id: hod } });
      } else {
        department.hodId = null;
      }
    }

    await department.save();

    res.json({
      success: true,
      message: 'Department updated successfully',
      department,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const studentCount = await Student.count({ where: { departmentId: department.id } });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${studentCount} active enrolled students. Reassign students first.`,
      });
    }

    await department.destroy();

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
