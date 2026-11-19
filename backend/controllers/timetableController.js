import { Op } from 'sequelize';
import { Timetable, Subject, Faculty, Department, User } from '../models/index.js';

// @desc    Get timetable by department, semester, section
// @route   GET /api/timetable
// @access  Private
export const getTimetable = async (req, res, next) => {
  try {
    const { department, semester, section, academicYear } = req.query;
    const where = {};

    if (department) where.departmentId = department;
    if (semester) where.semester = Number(semester);
    if (section) where.section = section;
    if (academicYear) where.academicYear = academicYear;

    if (req.user.role === 'student' && req.student) {
      where.departmentId = req.student.departmentId;
      where.semester = req.student.currentSemester;
      where.section = req.student.section;
    } else if (req.user.role === 'faculty') {
      const faculty =
        req.faculty || (await Faculty.findOne({ where: { userId: req.user.id } }));
      if (faculty) where.facultyId = faculty.id;
    } else if (req.user.role === 'hod') {
      where.departmentId = req.user.departmentId;
    }

    const entries = await Timetable.findAll({
      where,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code', 'credits', 'type'] },
        {
          model: Faculty,
          as: 'faculty',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar'] }],
        },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });

    res.json({
      success: true,
      count: entries.length,
      timetable: entries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create timetable entry with conflict detection
// @route   POST /api/timetable
// @access  Private (Admin, HOD)
export const createTimetableEntry = async (req, res, next) => {
  try {
    const {
      department,
      semester,
      section,
      academicYear,
      dayOfWeek,
      timeSlot,
      startTime: directStart,
      endTime: directEnd,
      subject,
      faculty,
      roomNumber,
    } = req.body;

    const startTime = timeSlot?.startTime || directStart;
    const endTime = timeSlot?.endTime || directEnd;

    if (
      !department ||
      !semester ||
      !section ||
      !academicYear ||
      !dayOfWeek ||
      !startTime ||
      !endTime ||
      !subject ||
      !faculty ||
      !roomNumber
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    // Conflict Check 1: Faculty overlap
    const facultyConflict = await Timetable.findOne({
      where: {
        facultyId: faculty,
        dayOfWeek,
        academicYear,
        startTime,
      },
      include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
    });

    if (facultyConflict) {
      return res.status(400).json({
        success: false,
        message: `Faculty clash! This instructor is already teaching ${facultyConflict.subject?.name} at this time.`,
      });
    }

    // Conflict Check 2: Room overlap
    const roomConflict = await Timetable.findOne({
      where: {
        roomNumber,
        dayOfWeek,
        academicYear,
        startTime,
      },
    });

    if (roomConflict) {
      return res.status(400).json({
        success: false,
        message: `Room clash! Room ${roomNumber} is already occupied during this time slot.`,
      });
    }

    // Conflict Check 3: Student batch overlap
    const classConflict = await Timetable.findOne({
      where: {
        departmentId: department,
        semester,
        section,
        dayOfWeek,
        academicYear,
        startTime,
      },
    });

    if (classConflict) {
      return res.status(400).json({
        success: false,
        message: 'Class conflict! This section already has a scheduled lecture at this time.',
      });
    }

    const entry = await Timetable.create({
      departmentId: department,
      semester: Number(semester),
      section,
      academicYear,
      dayOfWeek,
      startTime,
      endTime,
      subjectId: subject,
      facultyId: faculty,
      roomNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Timetable slot created successfully',
      entry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update timetable entry
// @route   PUT /api/timetable/:id
// @access  Private (Admin, HOD)
export const updateTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    const { startTime, endTime, roomNumber, faculty, subject } = req.body;

    if (startTime) entry.startTime = startTime;
    if (endTime) entry.endTime = endTime;
    if (roomNumber) entry.roomNumber = roomNumber;
    if (faculty) entry.facultyId = faculty;
    if (subject) entry.subjectId = subject;

    await entry.save();

    res.json({
      success: true,
      message: 'Timetable slot updated successfully',
      entry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete timetable entry
// @route   DELETE /api/timetable/:id
// @access  Private (Admin, HOD)
export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findByPk(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    await entry.destroy();

    res.json({
      success: true,
      message: 'Timetable entry removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-generate timetable
// @route   POST /api/timetable/auto-generate
// @access  Private (Admin, HOD)
export const autoGenerateTimetable = async (req, res, next) => {
  try {
    const { department, semester, section, academicYear } = req.body;

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    let subjects = await Subject.findAll({
      where: { departmentId: department, semester: Number(semester) },
    });

    // If no subjects exist yet for this department & semester, automatically provision standard accredited curriculum subjects
    if (subjects.length === 0) {
      const deptDoc = await Department.findByPk(department);
      const deptCode = deptDoc ? deptDoc.code : 'CA';
      const facultyList = await Faculty.findAll({ where: { departmentId: department } });
      const defaultFacultyId = facultyList.length > 0 ? facultyList[0].id : null;

      const templateSubjects = [
        { name: `${deptCode} Core Architecture & Systems`, code: `SUB-${deptCode}-${semester}01`, credits: 4, type: 'theory' },
        { name: `${deptCode} Applied Software Engineering`, code: `SUB-${deptCode}-${semester}02`, credits: 4, type: 'theory' },
        { name: `${deptCode} Advanced Professional Elective`, code: `SUB-${deptCode}-${semester}03`, credits: 3, type: 'theory' },
        { name: `${deptCode} Industry Project & Practicum`, code: `SUB-${deptCode}-${semester}04`, credits: 3, type: 'practical' },
      ];

      for (let i = 0; i < templateSubjects.length; i++) {
        const item = templateSubjects[i];
        const assignedFac = facultyList[i % (facultyList.length || 1)] || defaultFacultyId;
        const [createdSub] = await Subject.findOrCreate({
          where: { code: item.code },
          defaults: {
            name: item.name,
            code: item.code,
            departmentId: department,
            semester: Number(semester),
            credits: item.credits,
            type: item.type,
            facultyId: assignedFac ? assignedFac.id : null,
            syllabus: `Accredited curriculum syllabus for Semester ${semester}`,
          },
        });
        subjects.push(createdSub);
      }
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:15', endTime: '12:15' },
      { startTime: '13:15', endTime: '14:15' },
      { startTime: '14:15', endTime: '15:15' },
    ];

    // Clear previous entries for clean regeneration
    await Timetable.destroy({
      where: {
        departmentId: department,
        semester: Number(semester),
        section,
        academicYear,
      },
    });

    let subIndex = 0;
    const generated = [];

    for (const day of days) {
      for (const slot of timeSlots) {
        const curSubject = subjects[subIndex % subjects.length];
        subIndex++;

        let facultyId = curSubject.facultyId;
        if (!facultyId) {
          const faculty = await Faculty.findOne({ where: { departmentId: department } });
          facultyId = faculty?.id;
        }

        if (facultyId) {
          const entry = await Timetable.create({
            departmentId: department,
            semester: Number(semester),
            section,
            academicYear,
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: curSubject.id,
            facultyId,
            roomNumber: `LH-${100 + Number(semester)}`,
          });
          generated.push(entry);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully auto-generated ${generated.length} timetable entries`,
      entriesCount: generated.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
