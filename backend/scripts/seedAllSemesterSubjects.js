import { Subject, Department, Faculty } from '../models/index.js';

const seedAllSubjects = async () => {
  try {
    const dept = await Department.findOne({ where: { code: 'CA' } });
    if (!dept) {
      console.error('Department CA not found');
      process.exit(1);
    }

    const newSubjects = [
      // Semester 1 (BCA Sem 1)
      {
        name: 'Problem Solving & C Programming',
        code: 'SUB-BCA-101',
        departmentId: dept.id,
        semester: 1,
        credits: 4,
        type: 'theory',
        syllabus: 'Algorithm design, flowcharts, pointers, structures, dynamic memory, file handling.',
        facultyId: 9, // Prof. A. Balaji
      },
      {
        name: 'Digital Logic & Computer Architecture',
        code: 'SUB-BCA-102',
        departmentId: dept.id,
        semester: 1,
        credits: 4,
        type: 'theory',
        syllabus: 'Boolean algebra, logic gates, combinational circuits, sequential circuits, ALU.',
        facultyId: 5, // Prof. P. Karthikeyan
      },
      {
        name: 'Discrete Mathematics & Optimization',
        code: 'SUB-BCA-103',
        departmentId: dept.id,
        semester: 1,
        credits: 4,
        type: 'theory',
        syllabus: 'Set theory, propositional logic, graph theory, combinatorics, recurrence relations.',
        facultyId: 1, // Dr. K. Ramesh
      },
      {
        name: 'Communicative English & Professional Skills',
        code: 'SUB-BCA-104',
        departmentId: dept.id,
        semester: 1,
        credits: 3,
        type: 'theory',
        syllabus: 'Technical writing, resume building, presentation skills, business communication.',
        facultyId: 11, // Dr. E. John Peter
      },
      {
        name: 'C Programming & Linux CLI Lab',
        code: 'SUB-BCA-105',
        departmentId: dept.id,
        semester: 1,
        credits: 2,
        type: 'practical',
        syllabus: 'GCC compiler, GDB debugging, bash scripting, file permissions, shell automation.',
        facultyId: 9, // Prof. A. Balaji
      },

      // Semester 3 (BCA Sem 3)
      {
        name: 'Web Technologies & Frontend Frameworks',
        code: 'SUB-BCA-301',
        departmentId: dept.id,
        semester: 3,
        credits: 4,
        type: 'theory',
        syllabus: 'HTML5, CSS3 Tailwind, modern JavaScript ES6+, React component architecture.',
        facultyId: 10, // Prof. V. Priya
      },
      {
        name: 'Operating Systems & System Programming',
        code: 'SUB-BCA-302',
        departmentId: dept.id,
        semester: 3,
        credits: 4,
        type: 'theory',
        syllabus: 'Process scheduling, deadlocks, virtual memory management, file systems, IPC.',
        facultyId: 6, // Prof. S. Divya
      },
      {
        name: 'Software Engineering Principles & Agile',
        code: 'SUB-BCA-303',
        departmentId: dept.id,
        semester: 3,
        credits: 4,
        type: 'theory',
        syllabus: 'SDLC, Agile Scrum, UML modeling, automated test suites, CI/CD foundations.',
        facultyId: 2, // Dr. S. Vignesh
      },
      {
        name: 'Advanced Database & NoSQL Systems',
        code: 'SUB-BCA-304',
        departmentId: dept.id,
        semester: 3,
        credits: 3,
        type: 'theory',
        syllabus: 'Transactions ACID, indexing, query optimization, MongoDB document store.',
        facultyId: 4, // Dr. R. Suresh
      },
      {
        name: 'Web Application Development Lab',
        code: 'SUB-BCA-305',
        departmentId: dept.id,
        semester: 3,
        credits: 2,
        type: 'practical',
        syllabus: 'Fullstack SPA development with React, Node.js REST API, and MySQL.',
        facultyId: 10, // Prof. V. Priya
      },

      // Semester 5 (BCA Sem 5)
      {
        name: 'Mobile App Development with Flutter',
        code: 'SUB-BCA-501',
        departmentId: dept.id,
        semester: 5,
        credits: 4,
        type: 'theory',
        syllabus: 'Dart fundamentals, Flutter widget tree, state management, REST API integration.',
        facultyId: 10, // Prof. V. Priya
      },
      {
        name: 'Cyber Security & Network Defense',
        code: 'SUB-BCA-502',
        departmentId: dept.id,
        semester: 5,
        credits: 4,
        type: 'theory',
        syllabus: 'Cryptography, network firewalls, vulnerability assessment, penetration testing.',
        facultyId: 2, // Dr. S. Vignesh
      },
      {
        name: 'Cloud Infrastructure & DevOps Pipelines',
        code: 'SUB-BCA-503',
        departmentId: dept.id,
        semester: 5,
        credits: 4,
        type: 'theory',
        syllabus: 'Docker containers, Kubernetes orchestration, GitHub Actions CI/CD.',
        facultyId: 6, // Prof. S. Divya
      },
      {
        name: 'Data Warehousing & Business Analytics',
        code: 'SUB-BCA-504',
        departmentId: dept.id,
        semester: 5,
        credits: 3,
        type: 'theory',
        syllabus: 'ETL pipelines, star schemas, OLAP cubes, Tableau dashboard visualization.',
        facultyId: 7, // Prof. K. Saravanan
      },

      // Semester 6 (BCA Sem 6)
      {
        name: 'Enterprise Cloud Systems & Microservices',
        code: 'SUB-BCA-601',
        departmentId: dept.id,
        semester: 6,
        credits: 4,
        type: 'theory',
        syllabus: 'Microservices architecture, API gateways, event-driven streaming with Kafka.',
        facultyId: 2, // Dr. S. Vignesh
      },
      {
        name: 'Machine Learning Foundations & Python',
        code: 'SUB-BCA-602',
        departmentId: dept.id,
        semester: 6,
        credits: 4,
        type: 'theory',
        syllabus: 'Supervised regression, classification, clustering, Scikit-Learn pipelines.',
        facultyId: 3, // Prof. M. Anitha
      },
      {
        name: 'Industry Capstone Project & Viva',
        code: 'SUB-BCA-603',
        departmentId: dept.id,
        semester: 6,
        credits: 8,
        type: 'practical',
        syllabus: 'Industry-grade application deployment, technical thesis, live demonstration.',
        facultyId: 1, // Dr. K. Ramesh
      },
    ];

    for (const sub of newSubjects) {
      const exists = await Subject.findOne({ where: { code: sub.code } });
      if (!exists) {
        await Subject.create(sub);
        console.log(`Created subject: ${sub.code} - ${sub.name} (Sem ${sub.semester})`);
      } else {
        console.log(`Subject already exists: ${sub.code}`);
      }
    }

    console.log('✅ All semester subjects seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding subjects:', err);
    process.exit(1);
  }
};

seedAllSubjects();
