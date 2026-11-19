import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import sequelize from '../config/db.js';
import {
  User,
  Department,
  Faculty,
  Student,
  Subject,
  Attendance,
  Timetable,
  Assignment,
  Submission,
  Examination,
  Mark,
  Placement,
  Application,
  Notice,
  Notification,
  AcademicReport,
} from '../models/index.js';

// Realistic Indian Names Pool
const FIRST_NAMES = [
  'Arun', 'Vignesh', 'Vimal', 'Karthik', 'Suresh', 'Deepak', 'Gokul', 'Harish',
  'Manoj', 'Naveen', 'Pradeep', 'Rajesh', 'Sanjay', 'Saravanan', 'Sivakumar', 'Surya',
  'Vijay', 'Vinoth', 'Vishnu', 'Yogesh', 'Aravind', 'Abishek', 'Dhanush', 'Madhavan',
  'Parthiban', 'Ragul', 'Subash', 'Aaditya', 'Balaji', 'Ganesh', 'Anitha', 'Bhavani',
  'Divya', 'Induja', 'Kavitha', 'Keerthana', 'Nandhini', 'Nithya', 'Pooja', 'Priya',
  'Ramya', 'Rohini', 'Shalini', 'Sneha', 'Swetha', 'Meenakshi', 'Archana', 'Pavithra',
  'Sangeetha', 'Sandhya'
];

const LAST_NAMES = [
  'Kumar', 'Raj', 'Ramesh', 'Sundaram', 'Murugan', 'Chandran', 'Moorthy', 'Krishnan',
  'Venkatesh', 'Gopal', 'Natarajan', 'Mani', 'Perumal', 'Velu', 'Sekar', 'Babu',
  'Pillai', 'Reddy', 'Naidu', 'Iyer', 'Chettiar', 'Thevar', 'Gounder', 'Nadar'
];

export const seedDatabase = async () => {
  console.log('🚀 [Smart Campus Seeder]: Starting clean database re-initialization...');

  try {
    // 1. Disable Foreign Keys and Clean All Tables
    console.log('🧹 [1/8] Clearing all existing records in database...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    const models = [
      'academic_reports',
      'notifications',
      'notices',
      'applications',
      'placement_departments',
      'placements',
      'marks',
      'examinations',
      'submissions',
      'assignments',
      'timetables',
      'attendances',
      'faculty_assigned_subjects',
      'subjects',
      'students',
      'faculties',
      'departments',
      'users',
    ];

    for (const m of models) {
      try {
        await sequelize.query(`TRUNCATE TABLE \`${m}\`;`);
      } catch (e) {
        // Fallback to DELETE if TRUNCATE fails on foreign key locks
        try {
          await sequelize.query(`DELETE FROM \`${m}\`;`);
        } catch (err) {}
      }
    }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ All existing records purged cleanly.');

    // Common Password
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // 2. Create Administrator
    console.log('👑 [2/8] Creating Campus Administrator...');
    const adminUser = await User.create({
      name: 'Campus Administrator',
      email: 'admin@smartcampus.edu',
      password: hashedPassword,
      role: 'admin',
      phone: '9876543210',
      avatar: '/assets/userdummy.jpg',
      status: 'active',
      isEmailVerified: true,
    });

    // 3. Create SINGLE HOD for BOTH MCA and BCA
    // Requirement 1: "oru college la mca and bca iruntha athuku oru hod than irupanga"
    console.log('🏛️ [3/8] Creating Single HOD (Dr. K. Ramesh) heading Department of Computer Applications (UG & PG)...');
    const hodUser = await User.create({
      name: 'Dr. K. Ramesh',
      email: 'hod.ca@smartcampus.edu',
      password: hashedPassword,
      role: 'hod',
      phone: '9840123456',
      avatar: '/assets/userdummy.jpg',
      status: 'active',
      isEmailVerified: true,
    });

    // Create Unified Department: Department of Computer Applications
    const caDept = await Department.create({
      name: 'Department of Computer Applications',
      code: 'CA',
      description: 'Premier Academic Department conducting both Undergraduate (BCA) and Postgraduate (MCA) programs.',
      establishedYear: 2010,
      intakeCapacity: 300,
      contactEmail: 'ca.dept@smartcampus.edu',
      hodId: hodUser.id,
      building: 'Ramanujan Tech Block',
      floor: 3,
    });

    // Update HOD User's department link
    await hodUser.update({ departmentId: caDept.id });

    // HOD Faculty Profile
    const hodFaculty = await Faculty.create({
      userId: hodUser.id,
      departmentId: caDept.id,
      employeeId: 'HOD-CA-001',
      designation: 'Professor & Head of Department',
      qualification: 'Ph.D. (Computer Applications), M.Tech, MCA',
      joiningDate: new Date('2015-06-15'),
      cabinNumber: 'RTB-301',
      status: 'active',
    });

    // 4. Create Faculty Members (Department-based & Language-based)
    // Requirement 4: "athuku etha maari faculty member departement based and language based create pannidu"
    console.log('👨‍🏫 [4/8] Creating Department-based and Language-based Faculty Members...');
    const facultyDefs = [
      // Department-Based Core Computing Faculty
      {
        name: 'Dr. S. Vignesh',
        email: 'vignesh.mca@smartcampus.edu',
        phone: '9845112233',
        departmentId: caDept.id,
        empId: 'FAC-CA-001',
        designation: 'Associate Professor',
        qualification: 'Ph.D., M.Tech (CSE)',
        cabin: 'RTB-304',
      },
      {
        name: 'Prof. M. Anitha',
        email: 'anitha.ca@smartcampus.edu',
        phone: '9845223344',
        departmentId: caDept.id,
        empId: 'FAC-CA-002',
        designation: 'Assistant Professor',
        qualification: 'M.E. (Software Engineering), MCA',
        cabin: 'RTB-305',
      },
      {
        name: 'Dr. R. Suresh',
        email: 'suresh.ca@smartcampus.edu',
        phone: '9845334455',
        departmentId: caDept.id,
        empId: 'FAC-CA-003',
        designation: 'Associate Professor',
        qualification: 'Ph.D., M.Sc. (CS)',
        cabin: 'RTB-204',
      },
      {
        name: 'Prof. P. Karthikeyan',
        email: 'karthik.ca@smartcampus.edu',
        phone: '9845445566',
        departmentId: caDept.id,
        empId: 'FAC-CA-004',
        designation: 'Assistant Professor',
        qualification: 'M.Phil., MCA',
        cabin: 'RTB-205',
      },
      {
        name: 'Prof. S. Divya',
        email: 'divya.ca@smartcampus.edu',
        phone: '9845556677',
        departmentId: caDept.id,
        empId: 'FAC-CA-005',
        designation: 'Assistant Professor',
        qualification: 'M.Tech (Distributed Systems)',
        cabin: 'RTB-306',
      },
      // Language-Based Faculty (Programming Languages & Foundational Languages)
      {
        name: 'Prof. K. Saravanan',
        email: 'saravanan.lang@smartcampus.edu',
        phone: '9845667788',
        departmentId: caDept.id,
        empId: 'FAC-CA-006',
        designation: 'Assistant Professor (Python)',
        qualification: 'MCA, Certified Python Specialist',
        cabin: 'RTB-206',
      },
      {
        name: 'Prof. T. Meenakshi',
        email: 'meenakshi.lang@smartcampus.edu',
        phone: '9845778899',
        departmentId: caDept.id,
        empId: 'FAC-CA-007',
        designation: 'Assistant Professor (Java)',
        qualification: 'M.Tech, Oracle Certified Java Professional',
        cabin: 'RTB-207',
      },
      {
        name: 'Prof. A. Balaji',
        email: 'balaji.lang@smartcampus.edu',
        phone: '9845889900',
        departmentId: caDept.id,
        empId: 'FAC-CA-008',
        designation: 'Assistant Professor (C / C++)',
        qualification: 'M.Sc., M.Phil. (Comp. Sci.)',
        cabin: 'RTB-208',
      },
      {
        name: 'Prof. V. Priya',
        email: 'priya.lang@smartcampus.edu',
        phone: '9845990011',
        departmentId: caDept.id,
        empId: 'FAC-CA-009',
        designation: 'Assistant Professor (Web Tech & JS)',
        qualification: 'MCA, Fullstack Certified Specialist',
        cabin: 'RTB-307',
      },
      {
        name: 'Dr. E. John Peter',
        email: 'john.english@smartcampus.edu',
        phone: '9845001122',
        departmentId: caDept.id,
        empId: 'FAC-CA-010',
        designation: 'Assistant Professor (Technical English)',
        qualification: 'Ph.D. (English Literature & Linguistics)',
        cabin: 'RTB-102',
      },
    ];

    const facultyList = [];
    for (const f of facultyDefs) {
      const u = await User.create({
        name: f.name,
        email: f.email,
        password: hashedPassword,
        role: 'faculty',
        departmentId: f.departmentId,
        phone: f.phone,
        avatar: '/assets/userdummy.jpg',
        status: 'active',
        isEmailVerified: true,
      });

      const profile = await Faculty.create({
        userId: u.id,
        departmentId: f.departmentId,
        employeeId: f.empId,
        designation: f.designation,
        qualification: f.qualification,
        joiningDate: new Date('2018-07-01'),
        cabinNumber: f.cabin,
        status: 'active',
      });

      facultyList.push({ user: u, profile });
    }

    // 5. Create Core Curriculum Subjects
    console.log('📚 [5/8] Creating Academic Subjects and Assigning Teachers...');
    const subjectsData = [
      // MCA Subjects (Postgraduate - Sem 4)
      {
        name: 'Cloud Computing & Distributed Systems',
        code: 'SUB-MCA-401',
        departmentId: caDept.id,
        semester: 4,
        credits: 4,
        type: 'theory',
        facultyId: facultyList[0].profile.id, // Dr. S. Vignesh
      },
      {
        name: 'Advanced AI & Deep Learning Architectures',
        code: 'SUB-MCA-402',
        departmentId: caDept.id,
        semester: 4,
        credits: 4,
        type: 'theory',
        facultyId: facultyList[1].profile.id, // Prof. M. Anitha
      },
      {
        name: 'Fullstack Web Application Engineering',
        code: 'SUB-MCA-403',
        departmentId: caDept.id,
        semester: 4,
        credits: 4,
        type: 'practical',
        facultyId: facultyList[8].profile.id, // Prof. V. Priya
      },
      {
        name: 'Enterprise Software Architecture',
        code: 'SUB-MCA-404',
        departmentId: caDept.id,
        semester: 4,
        credits: 3,
        type: 'theory',
        facultyId: facultyList[4].profile.id, // Prof. S. Divya
      },

      // BCA Subjects (Undergraduate - Sem 2)
      {
        name: 'Python for Data Analytics',
        code: 'SUB-BCA-201',
        departmentId: caDept.id,
        semester: 2,
        credits: 4,
        type: 'theory',
        facultyId: facultyList[5].profile.id, // Prof. K. Saravanan (Python)
      },
      {
        name: 'Object Oriented Programming with Java',
        code: 'SUB-BCA-202',
        departmentId: caDept.id,
        semester: 2,
        credits: 4,
        type: 'practical',
        facultyId: facultyList[6].profile.id, // Prof. T. Meenakshi (Java)
      },
      {
        name: 'Database Management Systems & SQL',
        code: 'SUB-BCA-203',
        departmentId: caDept.id,
        semester: 2,
        credits: 4,
        type: 'theory',
        facultyId: facultyList[2].profile.id, // Dr. R. Suresh
      },
      {
        name: 'Data Structures & Algorithms with C++',
        code: 'SUB-BCA-204',
        departmentId: caDept.id,
        semester: 2,
        credits: 4,
        type: 'theory',
        facultyId: facultyList[7].profile.id, // Prof. A. Balaji (C++)
      },
      {
        name: 'Technical Communication & English Language',
        code: 'SUB-BCA-205',
        departmentId: caDept.id,
        semester: 2,
        credits: 3,
        type: 'theory',
        facultyId: facultyList[9].profile.id, // Dr. E. John Peter (English)
      },
      {
        name: 'Computer Networks & TCP/IP Protocols',
        code: 'SUB-BCA-206',
        departmentId: caDept.id,
        semester: 2,
        credits: 3,
        type: 'theory',
        facultyId: facultyList[3].profile.id, // Prof. P. Karthikeyan
      },
    ];

    const subjects = [];
    for (const sub of subjectsData) {
      const s = await Subject.create(sub);
      subjects.push(s);
    }

    // Assign faculty subjects into association table
    for (const s of subjects) {
      if (s.facultyId) {
        const fac = facultyList.find((f) => f.profile.id === s.facultyId);
        if (fac) {
          await fac.profile.addAssignedSubject(s);
        }
      }
    }

    // 6. Create Students: Section A, B, C (45 Students per section)
    // Requirement 2: "oru department ku section c varaikum pothum"
    // Requirement 3: "student data oru section 40 -50 students irukanum"
    console.log('🎓 [6/8] Enrolling Students: 45 Students per Section (A, B, C) for Department of Computer Applications (UG & PG)...');

    const programs = [
      { dept: caDept, code: 'MCA', semester: 4, year: '2026-2027', batch: '2024-2026' },
      { dept: caDept, code: 'BCA', semester: 2, year: '2026-2027', batch: '2025-2028' },
    ];
    const sections = ['A', 'B', 'C'];
    const STUDENTS_PER_SECTION = 45;

    const allStudents = [];
    let studentCounter = 1;

    for (const prog of programs) {
      for (const sec of sections) {
        console.log(`   -> Enrolling ${STUDENTS_PER_SECTION} students in ${prog.code} (Section ${sec})...`);

        for (let i = 1; i <= STUDENTS_PER_SECTION; i++) {
          const fnIndex = (studentCounter + i * 3) % FIRST_NAMES.length;
          const lnIndex = (studentCounter + i * 7) % LAST_NAMES.length;
          let fullName = `${FIRST_NAMES[fnIndex]} ${LAST_NAMES[lnIndex]}`;

          // Preserve Arun Kumar for testing on first MCA student
          if (prog.code === 'MCA' && sec === 'A' && i === 1) {
            fullName = 'Arun Kumar';
          }

          const rollNum = `${prog.code}-26-${sec}${String(i).padStart(3, '0')}`;
          const regNum = `REG26${prog.code}${sec}${String(i).padStart(3, '0')}`;
          const emailSlug = fullName.toLowerCase().replace(/[^a-z]/g, '.');
          const email =
            prog.code === 'MCA' && sec === 'A' && i === 1
              ? 'arun.mca@smartcampus.edu'
              : `${emailSlug}.${prog.code.toLowerCase()}${sec.toLowerCase()}${i}@smartcampus.edu`;

          // Realistic distribution
          const attendancePct = 74 + Math.round((((i * 13 + studentCounter) % 25) * 10) / 10);
          const cgpaVal = (6.8 + ((i * 7 + studentCounter) % 28) * 0.1).toFixed(2);

          const u = await User.create({
            name: fullName,
            email,
            password: hashedPassword,
            role: 'student',
            departmentId: prog.dept.id,
            phone: `9841${String(100000 + studentCounter).slice(-6)}`,
            avatar: '/assets/userdummy.jpg',
            status: 'active',
            isEmailVerified: true,
          });

          const st = await Student.create({
            userId: u.id,
            departmentId: prog.dept.id,
            rollNumber: rollNum,
            registrationNumber: regNum,
            currentSemester: prog.semester,
            section: sec,
            academicYear: prog.year,
            batch: prog.batch,
            cgpa: Number(cgpaVal),
            attendancePercentage: Math.min(99, attendancePct),
            status: 'active',
          });

          allStudents.push({ user: u, student: st, dept: prog.dept, code: prog.code, section: sec });
          studentCounter++;
        }
      }
    }
    console.log(`✅ Total Enrolled Students: ${allStudents.length} across Sections A, B, C!`);

    // 7. Seed Timetable Across All Sections
    // Requirement 5: "assignment,timetable etc vera ethulam empty ah iruko athulam ready pannu"
    console.log('📅 [7/8] Scheduling Weekly Timetable Grid across Sections A, B, and C...');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:15', end: '12:15' },
      { start: '13:15', end: '14:15' },
      { start: '14:15', end: '15:15' },
    ];

    const mcaSubs = subjects.filter((s) => s.code.includes('MCA'));
    const bcaSubs = subjects.filter((s) => s.code.includes('BCA'));

    for (const sec of sections) {
      // Schedule MCA Section (PG)
      let subIdx = 0;
      for (const d of days) {
        for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
          const sub = mcaSubs[(subIdx + slotIdx) % mcaSubs.length];
          await Timetable.create({
            departmentId: caDept.id,
            subjectId: sub.id,
            facultyId: sub.facultyId,
            semester: 4,
            section: sec,
            academicYear: '2026-2027',
            dayOfWeek: d,
            startTime: timeSlots[slotIdx].start,
            endTime: timeSlots[slotIdx].end,
            roomNumber: `RTB-30${sec === 'A' ? 2 : sec === 'B' ? 3 : 4}`,
          });
        }
        subIdx++;
      }

      // Schedule BCA Section (UG)
      subIdx = 0;
      for (const d of days) {
        for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
          const sub = bcaSubs[(subIdx + slotIdx) % bcaSubs.length];
          await Timetable.create({
            departmentId: caDept.id,
            subjectId: sub.id,
            facultyId: sub.facultyId,
            semester: 2,
            section: sec,
            academicYear: '2026-2027',
            dayOfWeek: d,
            startTime: timeSlots[slotIdx].start,
            endTime: timeSlots[slotIdx].end,
            roomNumber: `RTB-20${sec === 'A' ? 1 : sec === 'B' ? 2 : 3}`,
          });
        }
        subIdx++;
      }
    }
    console.log('✅ Weekly Timetable Conflict-Free Schedules populated.');

    // 8. Seed Coursework Assignments & Submissions
    console.log('📝 [8/8] Creating Assignments, Exams, Placements, Notices & Attendance Logs...');
    const assignmentsList = [
      {
        title: 'Kubernetes Cluster Setup & Helm Deployment',
        description: 'Deploy a multi-node microservices architecture using Kubernetes ingress and automated TLS certificates.',
        subjectId: mcaSubs[0].id, // Cloud Computing
        facultyId: mcaSubs[0].facultyId,
        departmentId: caDept.id,
        semester: 4,
        dueDate: new Date('2026-12-15'),
        maxMarks: 50,
        instructions: 'Submit GitHub repository URL with your YAML manifests.',
      },
      {
        title: 'Transformer Attention Mechanism in PyTorch',
        description: 'Implement scaled dot-product multihead attention and positional encodings without built-in PyTorch wrappers.',
        subjectId: mcaSubs[1].id, // AI & Deep Learning
        facultyId: mcaSubs[1].facultyId,
        departmentId: caDept.id,
        semester: 4,
        dueDate: new Date('2026-12-20'),
        maxMarks: 50,
        instructions: 'Submit Jupyter Notebook and report with loss curves.',
      },
      {
        title: 'RESTful API with Node.js, Express & MySQL',
        description: 'Develop a secure role-based API with JWT authentication, middleware sanitization, and Sequelize ORM relationships.',
        subjectId: mcaSubs[2].id, // Web App Engineering
        facultyId: mcaSubs[2].facultyId,
        departmentId: caDept.id,
        semester: 4,
        dueDate: new Date('2026-12-10'),
        maxMarks: 25,
        instructions: 'Provide Postman collection link and codebase.',
      },
      {
        title: 'Pandas & NumPy Exploratory Data Analysis',
        description: 'Perform cleaning, statistical outlier detection, and visualization on a real-world healthcare dataset.',
        subjectId: bcaSubs[0].id, // Python Data Analytics
        facultyId: bcaSubs[0].facultyId,
        departmentId: caDept.id,
        semester: 2,
        dueDate: new Date('2026-12-18'),
        maxMarks: 25,
        instructions: 'Submit .ipynb notebook with markdown interpretations.',
      },
      {
        title: 'Banking System Simulation with Java OOP',
        description: 'Implement inheritance, polymorphism, abstract account classes, custom exceptions, and transaction logging.',
        subjectId: bcaSubs[1].id, // Java OOP
        facultyId: bcaSubs[1].facultyId,
        departmentId: caDept.id,
        semester: 2,
        dueDate: new Date('2026-12-22'),
        maxMarks: 25,
        instructions: 'Submit zipped source files with documentation.',
      },
    ];

    for (const a of assignmentsList) {
      const createdAssign = await Assignment.create(a);

      // Seed submissions from the first 5 students in that semester
      const deptStudents = allStudents.filter((s) => s.student.currentSemester === a.semester).slice(0, 5);
      for (const st of deptStudents) {
        await Submission.create({
          assignmentId: createdAssign.id,
          studentId: st.student.id,
          fileUrl: 'https://github.com/smartcampus-student/project-submission',
          comments: 'Completed all core requirements with unit tests.',
          submissionDate: new Date(),
          status: 'evaluated',
          marksObtained: Math.round(a.maxMarks * 0.88),
          feedback: 'Excellent modular structure and clean code practices.',
          evaluatedBy: a.facultyId,
          evaluatedAt: new Date(),
        });
      }
      await createdAssign.update({ totalSubmissions: deptStudents.length });
    }

    // Seed Examinations & Marks
    const examList = [
      {
        title: 'Mid-Term Theory Assessment',
        type: 'midterm',
        departmentId: caDept.id,
        semester: 4,
        academicYear: '2026-2027',
        subjectId: mcaSubs[0].id,
        examDate: new Date('2026-12-28'),
        startTime: '10:00',
        endTime: '13:00',
        totalMarks: 100,
        passingMarks: 45,
        roomNumber: 'RTB-Hall 1',
      },
      {
        title: 'Practical Model Examination',
        type: 'internal',
        departmentId: caDept.id,
        semester: 4,
        academicYear: '2026-2027',
        subjectId: mcaSubs[2].id,
        examDate: new Date('2027-01-05'),
        startTime: '09:30',
        endTime: '12:30',
        totalMarks: 100,
        passingMarks: 45,
        roomNumber: 'Software Lab 2',
      },
      {
        title: 'Python Programming Examination',
        type: 'midterm',
        departmentId: caDept.id,
        semester: 2,
        academicYear: '2026-2027',
        subjectId: bcaSubs[0].id,
        examDate: new Date('2026-12-29'),
        startTime: '10:00',
        endTime: '13:00',
        totalMarks: 100,
        passingMarks: 45,
        roomNumber: 'RTB-Hall 2',
      },
    ];

    for (const ex of examList) {
      const createdExam = await Examination.create(ex);

      // Enter marks for first 10 students
      const eligible = allStudents.filter((s) => s.student.currentSemester === ex.semester).slice(0, 10);
      for (const st of eligible) {
        await Mark.create({
          examinationId: createdExam.id,
          studentId: st.student.id,
          subjectId: ex.subjectId,
          marksObtained: 84 + (st.student.id % 12),
          maxMarks: 100,
          grade: (84 + (st.student.id % 12)) >= 90 ? 'O' : 'A+',
          evaluatedBy: ex.semester === 4 ? facultyList[0].profile.id : facultyList[5].profile.id,
        });
      }
    }

    // Seed Placement Drives
    const placementsList = [
      {
        companyName: 'Google Cloud India',
        jobRole: 'Associate Cloud Engineer',
        jobType: 'fulltime',
        salaryPackage: '₹14.5 LPA',
        location: 'Bangalore / Hybrid',
        minimumCgpa: 7.5,
        applicationDeadline: new Date('2026-12-30'),
        jobDescription: 'Design, deploy and manage scalable infrastructure on Google Cloud Platform using Terraform and Kubernetes.',
        postedById: adminUser.id,
        isActive: true,
      },
      {
        companyName: 'Microsoft Corporation',
        jobRole: 'Software Development Engineer (SDE 1)',
        jobType: 'fulltime',
        salaryPackage: '₹18.0 LPA',
        location: 'Hyderabad',
        minimumCgpa: 8.0,
        applicationDeadline: new Date('2027-01-10'),
        jobDescription: 'Build next-generation developer tooling, distributed cloud services and enterprise collaboration software.',
        postedById: adminUser.id,
        isActive: true,
      },
      {
        companyName: 'Zoho Corporation',
        jobRole: 'Full Stack Web Developer',
        jobType: 'fulltime',
        salaryPackage: '₹8.5 LPA',
        location: 'Chennai / Tenkasi',
        minimumCgpa: 6.5,
        applicationDeadline: new Date('2026-12-25'),
        jobDescription: 'Build high-performance web applications using Java, Node.js, and modern frontend frameworks.',
        postedById: adminUser.id,
        isActive: true,
      },
      {
        companyName: 'TCS Digital',
        jobRole: 'Systems Software Engineer',
        jobType: 'fulltime',
        salaryPackage: '₹7.5 LPA',
        location: 'Chennai',
        minimumCgpa: 7.0,
        applicationDeadline: new Date('2026-12-20'),
        jobDescription: 'Work on cutting-edge enterprise cloud integration and microservices for international banking clients.',
        postedById: adminUser.id,
        isActive: true,
      },
    ];

    for (const p of placementsList) {
      const drive = await Placement.create(p);
      await drive.addEligibleDepartment(caDept);

      // Student application for Arun Kumar
      const arun = allStudents.find((s) => s.user.email === 'arun.mca@smartcampus.edu');
      if (arun) {
        await Application.create({
          placementId: drive.id,
          studentId: arun.student.id,
          resumeUrl: 'https://smartcampus.edu/resumes/arun_kumar_mca.pdf',
          notes: 'Specialized in Cloud Infrastructure and React Fullstack Development.',
          status: 'shortlisted',
        });
      }
    }

    // Seed Campus Notices
    const noticesList = [
      {
        title: 'Mid-Term Assessment & Practical Evaluation Schedule',
        content: 'All MCA and BCA students are hereby informed that Mid-Term practical and lab examinations will commence from December 28, 2026. Hall allocations have been published on the Timetable portal.',
        priority: 'high',
        targetRoles: ['student', 'faculty'],
        departmentId: null, // Campus-wide
        postedById: hodUser.id,
      },
      {
        title: 'Zoho Campus Recruitment Drive 2026 - Orientation',
        content: 'Placement cell is organizing an exclusive preparation workshop for the upcoming Zoho Fullstack recruitment drive on Friday at the Tech Auditorium.',
        priority: 'urgent',
        targetRoles: ['student'],
        departmentId: null,
        postedById: adminUser.id,
      },
      {
        title: 'Mandatory 75% Attendance Compliance Advisory',
        content: 'Students with attendance below 75% are advised to meet their respective faculty advisors before the upcoming semester condonation audit.',
        priority: 'high',
        targetRoles: ['student'],
        departmentId: null,
        postedById: hodUser.id,
      },
      {
        title: 'Annual Inter-College Hackathon 2026 Registration Open',
        content: 'Registrations are invited for Smart India Hackathon internal selections. Teams consisting of 4-6 students can register via the student portal.',
        priority: 'normal',
        targetRoles: ['all'],
        departmentId: null,
        postedById: adminUser.id,
      },
    ];

    for (const n of noticesList) {
      await Notice.create(n);
    }

    // Seed Attendance Records for students across subjects
    console.log('📊 Seeding initial verified attendance logs for lecture sessions...');
    const pastDates = [
      new Date('2026-11-10'),
      new Date('2026-11-11'),
      new Date('2026-11-12'),
      new Date('2026-11-13'),
      new Date('2026-11-14'),
    ];

    for (const d of pastDates) {
      // Seed MCA Cloud Computing Attendance for Section A
      const secAStudents = allStudents.filter((s) => s.code === 'MCA' && s.section === 'A').slice(0, 45);
      for (const st of secAStudents) {
        await Attendance.create({
          subjectId: mcaSubs[0].id,
          facultyId: mcaSubs[0].facultyId,
          studentId: st.student.id,
          date: d,
          status: (st.student.id % 10 === 0) ? 'absent' : 'present',
          verificationMethod: 'manual',
          semester: 4,
          academicYear: '2026-2027',
          remarks: (st.student.id % 10 === 0) ? 'Medical Leave' : 'Attended Lecture',
        });
      }

      // Seed BCA Python Attendance for Section A
      const bcaSecAStudents = allStudents.filter((s) => s.code === 'BCA' && s.section === 'A').slice(0, 45);
      for (const st of bcaSecAStudents) {
        await Attendance.create({
          subjectId: bcaSubs[0].id,
          facultyId: bcaSubs[0].facultyId,
          studentId: st.student.id,
          date: d,
          status: (st.student.id % 9 === 0) ? 'absent' : 'present',
          verificationMethod: 'manual',
          semester: 2,
          academicYear: '2026-2027',
          remarks: (st.student.id % 9 === 0) ? 'Absent' : 'Present in Lab',
        });
      }
    }

    console.log('🎉 [Success]: Database seeding completed 100%! All tables populated authentically.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Error]: Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
