import {
  sequelize,
  Student,
  Subject,
  Attendance,
  Mark,
  Examination,
  Assignment,
  Submission,
  Placement,
  Application,
  User,
} from '../models/index.js';

const populateData = async () => {
  try {
    console.log('🚀 Starting comprehensive attendance, marks & submissions population for all students...');

    const students = await Student.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    });
    console.log(`Found ${students.length} students in database.`);

    const subjects = await Subject.findAll();
    const exams = await Examination.findAll();
    const assignments = await Assignment.findAll();
    const placements = await Placement.findAll();

    const mcaSubjects = subjects.filter((s) => s.semester === 4);
    const bcaSubjects = subjects.filter((s) => s.semester === 2);

    const lectureDates = [
      '2026-10-27 09:30:00',
      '2026-10-28 11:15:00',
      '2026-10-29 14:00:00',
      '2026-10-30 10:00:00',
      '2026-11-02 09:30:00',
      '2026-11-03 11:15:00',
      '2026-11-04 14:00:00',
      '2026-11-05 15:30:00',
      '2026-11-06 10:00:00',
      '2026-11-09 09:30:00',
      '2026-11-10 11:15:00',
      '2026-11-11 14:00:00',
      '2026-11-12 10:00:00',
      '2026-11-13 15:30:00',
      '2026-11-16 09:30:00',
      '2026-11-17 11:15:00',
      '2026-11-18 14:00:00',
      '2026-11-19 09:30:00',
    ];

    // Clear existing sparse attendance records
    await Attendance.destroy({ where: {} });
    console.log('Cleared old sparse attendance.');

    const attendanceRecords = [];
    const markRecords = [];
    const submissionRecords = [];
    const applicationRecords = [];

    for (const student of students) {
      const isMCA = student.currentSemester === 4;
      const studentSubs = isMCA ? mcaSubjects : bcaSubjects;
      const targetPct = Number(student.attendancePercentage) || 82;
      const totalSessions = lectureDates.length; // 18 sessions
      const presentCount = Math.round((targetPct / 100) * totalSessions);

      // 1. Generate Attendance Sessions
      lectureDates.forEach((dStr, idx) => {
        const sub = studentSubs[idx % studentSubs.length];
        const isPresent = idx < presentCount;
        attendanceRecords.push({
          subjectId: sub.id,
          facultyId: sub.facultyId,
          studentId: student.id,
          date: new Date(dStr),
          status: isPresent ? 'present' : 'absent',
          verificationMethod: idx % 2 === 0 ? 'manual' : 'qr',
          semester: student.currentSemester,
          academicYear: student.academicYear || '2026-2027',
          remarks: isPresent
            ? (idx % 2 === 0 ? 'Verified in Lecture' : 'Scanned Dynamic QR')
            : (idx % 4 === 0 ? 'Medical Leave' : 'Uninformed Absence'),
        });
      });

      // 2. Generate Marks for semester exams
      const relevantExams = exams.filter((e) => e.semester === student.currentSemester);
      for (const ex of relevantExams) {
        for (const sub of studentSubs.slice(0, 3)) {
          const baseScore = Math.floor(Math.random() * 20) + 75; // 75 - 95
          const score = ex.type === 'midterm' ? Math.round((baseScore / 100) * 50) : Math.round((baseScore / 100) * 100);
          const maxMarks = ex.type === 'midterm' ? 50 : 100;
          const pct = (score / maxMarks) * 100;
          let grade = 'A';
          if (pct >= 90) grade = 'O';
          else if (pct >= 80) grade = 'A+';
          else if (pct >= 70) grade = 'A';
          else if (pct >= 60) grade = 'B+';
          else grade = 'B';

          markRecords.push({
            examinationId: ex.id,
            subjectId: sub.id,
            studentId: student.id,
            marksObtained: score,
            maxMarks,
            grade,
            evaluatedBy: sub.facultyId,
            remarks: 'Evaluated and approved by department faculty',
          });
        }
      }

      // 3. Generate Submissions for coursework assignments
      const relevantAssigns = assignments.filter((a) => a.semester === student.currentSemester);
      for (const assign of relevantAssigns) {
        const marksObtained = Math.floor(Math.random() * 8) + (assign.maxMarks - 10);
        submissionRecords.push({
          assignmentId: assign.id,
          studentId: student.id,
          fileUrl: `https://github.com/smartcampus-student/${student.rollNumber?.toLowerCase() || 'repo'}/assignment-${assign.id}`,
          submittedAt: new Date('2026-11-12 16:45:00'),
          marksObtained,
          feedback: marksObtained >= 40 ? 'Excellent implementation and clean documentation.' : 'Good submission, adheres to guidelines.',
          status: 'evaluated',
        });
      }

      // 4. Generate Placement applications for senior students (MCA sem 4)
      if (isMCA && student.id % 2 === 0) {
        const p = placements[student.id % placements.length];
        if (p) {
          const statuses = ['shortlisted', 'interviewing', 'selected', 'applied'];
          applicationRecords.push({
            placementId: p.id,
            studentId: student.id,
            resumeUrl: `https://smartcampus-storage.edu/resumes/${student.rollNumber?.toLowerCase() || 'student'}-cv.pdf`,
            status: statuses[student.id % statuses.length],
            applicationDate: new Date('2026-11-05'),
          });
        }
      }
    }

    console.log(`Inserting ${attendanceRecords.length} attendance records in batches...`);
    await Attendance.bulkCreate(attendanceRecords);

    // Clear and insert Marks
    await Mark.destroy({ where: {} });
    console.log(`Inserting ${markRecords.length} marks...`);
    await Mark.bulkCreate(markRecords);

    // Clear and insert Submissions
    await Submission.destroy({ where: {} });
    console.log(`Inserting ${submissionRecords.length} submissions...`);
    await Submission.bulkCreate(submissionRecords);

    // Clear and insert Applications
    await Application.destroy({ where: {} });
    console.log(`Inserting ${applicationRecords.length} placement applications...`);
    await Application.bulkCreate(applicationRecords);

    console.log('✅ ALL ATTENDANCE, MARKS, SUBMISSIONS & PLACEMENTS POPULATED AUTHENTICALLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
};

populateData();
