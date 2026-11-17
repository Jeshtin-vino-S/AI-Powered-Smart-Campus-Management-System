import { Op } from 'sequelize';
import { Placement, Application, Student, Department, User, Notification } from '../models/index.js';
import { matchStudentToPlacement } from '../services/aiService.js';
import { emitToRole, emitToUser } from '../services/socketService.js';

// @desc    Admin / Placement Officer creates a placement opportunity
// @route   POST /api/placements
// @access  Private (Admin, HOD)
export const createPlacement = async (req, res, next) => {
  try {
    const {
      companyName,
      jobRole,
      jobType,
      salaryPackage,
      location,
      eligibleDepartments,
      minimumCgpa,
      eligibilityCriteria,
      requiredSkills,
      applicationDeadline,
      selectionProcess,
      jobDescription,
    } = req.body;

    if (
      !companyName ||
      !jobRole ||
      !jobType ||
      !salaryPackage ||
      !location ||
      !eligibleDepartments ||
      minimumCgpa === undefined ||
      !applicationDeadline ||
      !jobDescription
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : requiredSkills
      ? String(requiredSkills)
          .split(',')
          .map((s) => s.trim())
      : [];

    const placement = await Placement.create({
      companyName,
      jobRole,
      jobType,
      salaryPackage,
      location,
      minimumCgpa: Number(minimumCgpa),
      eligibilityCriteria: eligibilityCriteria || '',
      requiredSkills: skillsArray,
      applicationDeadline,
      selectionProcess: selectionProcess || '',
      jobDescription,
      postedById: req.user.id,
    });

    if (Array.isArray(eligibleDepartments) && eligibleDepartments.length > 0) {
      await placement.setEligibleDepartments(eligibleDepartments);
    }

    emitToRole('student', 'new_placement_drive', {
      companyName,
      jobRole,
      salaryPackage,
      deadline: applicationDeadline,
    });

    res.status(201).json({
      success: true,
      message: 'Placement drive posted successfully',
      placement,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all placements
// @route   GET /api/placements
// @access  Private
export const getPlacements = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const where = {};

    if (activeOnly === 'true') {
      where.isActive = true;
      where.applicationDeadline = { [Op.gte]: new Date() };
    }

    const placements = await Placement.findAll({
      where,
      include: [
        { model: Department, as: 'eligibleDepartments', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'postedBy', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (student) {
        const enriched = await Promise.all(
          placements.map(async (p) => {
            const myApp = await Application.findOne({
              where: { placementId: p.id, studentId: student.id },
            });
            const isEligible =
              Number(student.cgpa) >= Number(p.minimumCgpa) &&
              p.eligibleDepartments?.some((d) => String(d.id) === String(student.departmentId));

            return {
              ...p.toJSON(),
              myApplication: myApp,
              isEligible,
            };
          })
        );

        return res.json({
          success: true,
          count: enriched.length,
          placements: enriched,
        });
      }
    }

    const enriched = await Promise.all(
      placements.map(async (p) => {
        const totalApplicants = await Application.count({ where: { placementId: p.id } });
        const selectedCount = await Application.count({
          where: { placementId: p.id, status: 'selected' },
        });
        return {
          ...p.toJSON(),
          stats: {
            totalApplicants,
            selectedCount,
          },
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      placements: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get placement details by ID
// @route   GET /api/placements/:id
// @access  Private
export const getPlacementById = async (req, res, next) => {
  try {
    const placement = await Placement.findByPk(req.params.id, {
      include: [
        { model: Department, as: 'eligibleDepartments', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'postedBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement opportunity not found' });
    }

    let myApplication = null;
    let aiMatch = null;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (student) {
        myApplication = await Application.findOne({
          where: { placementId: placement.id, studentId: student.id },
        });
        aiMatch = await matchStudentToPlacement({ student, placement });
      }
    }

    res.json({
      success: true,
      placement: {
        ...placement.toJSON(),
        myApplication,
        aiMatch,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student applies for a placement
// @route   POST /api/placements/:id/apply
// @access  Private (Student)
export const applyPlacement = async (req, res, next) => {
  try {
    const { resumeUrl, notes } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    const placement = await Placement.findByPk(req.params.id);

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    if (!placement.isActive) {
      return res.status(400).json({ success: false, message: 'This placement opportunity is no longer active' });
    }

    if (new Date() > new Date(placement.applicationDeadline)) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(403).json({ success: false, message: 'Student profile not found' });
    }

    if (Number(student.cgpa) < Number(placement.minimumCgpa)) {
      return res.status(400).json({
        success: false,
        message: `Your CGPA (${student.cgpa}) does not meet the minimum eligibility requirement of ${placement.minimumCgpa}.`,
      });
    }

    const existingApp = await Application.findOne({
      where: {
        placementId: placement.id,
        studentId: student.id,
      },
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this placement opportunity',
      });
    }

    const application = await Application.create({
      placementId: placement.id,
      studentId: student.id,
      applicationDate: new Date(),
      resumeUrl,
      studentSnapshot: {
        cgpa: student.cgpa,
        skills: student.skills,
      },
      notes: notes || '',
    });

    await Notification.create({
      recipientId: req.user.id,
      title: `Application Submitted: ${placement.companyName}`,
      message: `Your application for ${placement.jobRole} at ${placement.companyName} has been received.`,
      type: 'placement',
      link: '/student/placements',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get applicants for a placement
// @route   GET /api/placements/:id/applications
// @access  Private (Admin, HOD)
export const getPlacementApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { placementId: req.params.id };

    if (status) {
      where.status = status;
    }

    const placement = await Placement.findByPk(req.params.id);
    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    const applications = await Application.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
            { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
          ],
        },
      ],
      order: [['applicationDate', 'DESC']],
    });

    const enriched = await Promise.all(
      applications.map(async (app) => {
        const matchData = await matchStudentToPlacement({
          student: app.student,
          placement,
        });
        return {
          ...app.toJSON(),
          aiMatch: matchData,
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      applications: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/placements/applications/:applicationId/status
// @access  Private (Admin, HOD)
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const application = await Application.findByPk(req.params.applicationId, {
      include: [
        { model: Placement, as: 'placement' },
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
      ],
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    if (notes !== undefined) application.notes = notes;
    await application.save();

    if (application.student?.user?.id) {
      await Notification.create({
        recipientId: application.student.user.id,
        title: `Placement Status Update: ${application.placement?.companyName}`,
        message: `Your application status for ${application.placement?.jobRole} is now: ${status.toUpperCase()}.`,
        type: 'placement',
        link: '/student/placements',
      });
      emitToUser(String(application.student.user.id), 'placement_status_changed', {
        placementId: application.placement?.id,
        status,
      });
    }

    res.json({
      success: true,
      message: `Applicant status successfully marked as '${status}'`,
      application,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete placement
// @route   DELETE /api/placements/:id
// @access  Private (Admin, HOD)
export const deletePlacement = async (req, res, next) => {
  try {
    const placement = await Placement.findByPk(req.params.id);

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    await Application.destroy({ where: { placementId: placement.id } });
    await placement.destroy();

    res.json({
      success: true,
      message: 'Placement drive removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
