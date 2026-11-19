import sequelize from '../config/db.js';
import User from './User.js';
import Department from './Department.js';
import Faculty from './Faculty.js';
import Student from './Student.js';
import Subject from './Subject.js';
import Attendance from './Attendance.js';
import Timetable from './Timetable.js';
import Assignment from './Assignment.js';
import Submission from './Submission.js';
import Examination from './Examination.js';
import Mark from './Mark.js';
import Placement from './Placement.js';
import Application from './Application.js';
import Notice from './Notice.js';
import Notification from './Notification.js';
import AcademicReport from './AcademicReport.js';

// --- Associations ---

// User <-> Department
User.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'SET NULL' });
Department.hasMany(User, { as: 'users', foreignKey: 'departmentId' });
Department.belongsTo(User, { as: 'hod', foreignKey: 'hodId', onDelete: 'SET NULL' });

// User <-> Faculty
User.hasOne(Faculty, { as: 'facultyProfile', foreignKey: 'userId', onDelete: 'CASCADE' });
Faculty.belongsTo(User, { as: 'user', foreignKey: 'userId', onDelete: 'CASCADE' });

// User <-> Student
User.hasOne(Student, { as: 'studentProfile', foreignKey: 'userId', onDelete: 'CASCADE' });
Student.belongsTo(User, { as: 'user', foreignKey: 'userId', onDelete: 'CASCADE' });

// Department <-> Faculty
Department.hasMany(Faculty, { as: 'facultyMembers', foreignKey: 'departmentId', onDelete: 'RESTRICT' });
Faculty.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'RESTRICT' });

// Department <-> Student
Department.hasMany(Student, { as: 'students', foreignKey: 'departmentId', onDelete: 'RESTRICT' });
Student.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'RESTRICT' });

// Faculty <-> Student (Mentor)
Faculty.hasMany(Student, { as: 'mentees', foreignKey: 'mentorId', onDelete: 'SET NULL' });
Student.belongsTo(Faculty, { as: 'mentor', foreignKey: 'mentorId', onDelete: 'SET NULL' });

// Department <-> Subject
Department.hasMany(Subject, { as: 'subjects', foreignKey: 'departmentId', onDelete: 'CASCADE' });
Subject.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'CASCADE' });

// Faculty <-> Subject (Primary & Many-to-Many Assigned)
Subject.belongsTo(Faculty, { as: 'faculty', foreignKey: 'facultyId', onDelete: 'SET NULL' });
Faculty.hasMany(Subject, { as: 'taughtSubjects', foreignKey: 'facultyId', onDelete: 'SET NULL' });
Faculty.belongsToMany(Subject, { through: 'faculty_assigned_subjects', as: 'assignedSubjects', foreignKey: 'facultyId' });
Subject.belongsToMany(Faculty, { through: 'faculty_assigned_subjects', as: 'assignedFaculties', foreignKey: 'subjectId' });

// Attendance Associations
Attendance.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId', onDelete: 'CASCADE' });
Attendance.belongsTo(Faculty, { as: 'faculty', foreignKey: 'facultyId', onDelete: 'CASCADE' });
Attendance.belongsTo(Student, { as: 'student', foreignKey: 'studentId', onDelete: 'CASCADE' });
Student.hasMany(Attendance, { as: 'attendances', foreignKey: 'studentId' });
Subject.hasMany(Attendance, { as: 'attendances', foreignKey: 'subjectId' });
Faculty.hasMany(Attendance, { as: 'conductedAttendances', foreignKey: 'facultyId' });

// Timetable Associations
Timetable.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'CASCADE' });
Timetable.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId', onDelete: 'CASCADE' });
Timetable.belongsTo(Faculty, { as: 'faculty', foreignKey: 'facultyId', onDelete: 'CASCADE' });
Faculty.hasMany(Timetable, { as: 'timetables', foreignKey: 'facultyId' });

// Assignment & Submission Associations
Assignment.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId', onDelete: 'CASCADE' });
Assignment.belongsTo(Faculty, { as: 'faculty', foreignKey: 'facultyId', onDelete: 'CASCADE' });
Assignment.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'CASCADE' });
Faculty.hasMany(Assignment, { as: 'assignments', foreignKey: 'facultyId' });
Assignment.hasMany(Submission, { as: 'submissions', foreignKey: 'assignmentId', onDelete: 'CASCADE' });
Submission.belongsTo(Assignment, { as: 'assignment', foreignKey: 'assignmentId', onDelete: 'CASCADE' });
Submission.belongsTo(Student, { as: 'student', foreignKey: 'studentId', onDelete: 'CASCADE' });
Submission.belongsTo(Faculty, { as: 'evaluator', foreignKey: 'evaluatedBy', onDelete: 'SET NULL' });
Student.hasMany(Submission, { as: 'submissions', foreignKey: 'studentId' });

// Examination & Mark Associations
Examination.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'CASCADE' });
Examination.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId', onDelete: 'CASCADE' });
Examination.hasMany(Mark, { as: 'marks', foreignKey: 'examinationId', onDelete: 'CASCADE' });
Mark.belongsTo(Examination, { as: 'examination', foreignKey: 'examinationId', onDelete: 'CASCADE' });
Mark.belongsTo(Student, { as: 'student', foreignKey: 'studentId', onDelete: 'CASCADE' });
Mark.belongsTo(Subject, { as: 'subject', foreignKey: 'subjectId', onDelete: 'CASCADE' });
Mark.belongsTo(Faculty, { as: 'evaluator', foreignKey: 'evaluatedBy', onDelete: 'CASCADE' });
Student.hasMany(Mark, { as: 'marks', foreignKey: 'studentId' });

// Placement & Application Associations
Placement.belongsTo(User, { as: 'postedBy', foreignKey: 'postedById', onDelete: 'CASCADE' });
Placement.hasMany(Application, { as: 'applications', foreignKey: 'placementId', onDelete: 'CASCADE' });
Application.belongsTo(Placement, { as: 'placement', foreignKey: 'placementId', onDelete: 'CASCADE' });
Application.belongsTo(Student, { as: 'student', foreignKey: 'studentId', onDelete: 'CASCADE' });
Student.hasMany(Application, { as: 'applications', foreignKey: 'studentId' });
Placement.belongsToMany(Department, { through: 'placement_departments', as: 'eligibleDepartments', foreignKey: 'placementId' });
Department.belongsToMany(Placement, { through: 'placement_departments', as: 'eligiblePlacements', foreignKey: 'departmentId' });

// Notice Associations
Notice.belongsTo(User, { as: 'postedBy', foreignKey: 'postedById', onDelete: 'CASCADE' });
Notice.belongsTo(Department, { as: 'department', foreignKey: 'departmentId', onDelete: 'CASCADE' });

// Notification Associations
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId', onDelete: 'CASCADE' });

// AcademicReport Associations
AcademicReport.belongsTo(Student, { as: 'student', foreignKey: 'studentId', onDelete: 'CASCADE' });
Student.hasMany(AcademicReport, { as: 'academicReports', foreignKey: 'studentId' });

export {
  sequelize,
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
};
export default sequelize;
