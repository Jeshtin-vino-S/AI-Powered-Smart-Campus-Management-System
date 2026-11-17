# AI-Powered Smart Campus Management System — Backend API

Production-ready MERN stack backend built with **Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT Authentication, and Google Gemini AI**.

---

## 🚀 Key Features Implemented

1. **Role-Based Access Control (RBAC)**: Secure access control for **Admin**, **HOD**, **Faculty**, and **Student** with JWT authentication and bcrypt password hashing.
2. **QR-Based Smart Attendance**:
   - Faculty creates time-limited attendance sessions with dynamic HMAC-SHA256 signature tokens.
   - Dynamic token rotation every 30 seconds prevents QR sharing.
   - Student QR scan verification with duplicate prevention and real-time Socket.IO attendance counter.
   - Manual attendance logging for batch classes.
3. **AI Academic Risk Prediction & Performance Analysis**:
   - Evaluates attendance rates, exam marks, and assignment completion.
   - Quantified risk score (0-100) and risk level classification (`low`, `medium`, `high`).
   - Generates actionable academic recommendations and Gemini-powered decision-support summaries.
4. **AI Campus Assistant**:
   - Interactive chatbot powered by Google Gemini API.
   - Responds strictly using authorized student records (attendance %, upcoming exams, pending assignments, CGPA, college notices).
5. **Smart Placement Matching**:
   - Analyzes student CGPA against company requirements.
   - Semantic skill matching between student skillset and placement criteria.
   - AI candidate assessment and interview readiness recommendations.
6. **Automatic Timetable Generator & Conflict Detection**:
   - Detects room clashes, faculty double-booking, and section period overlap.
   - Automated conflict-free timetable scheduling engine.
7. **Assignment & Examination Portal**:
   - Faculty assignment publishing with file attachments.
   - Student solution submission with deadline tracking (flags late submissions).
   - Examination mark entry, automatic letter grade calculation (`O`, `A+`, `A`, `B+`, `B`, `C`, `F`), and CGPA re-computation.
8. **Digital Notice Board & Real-Time Alerts**:
   - Multi-role broadcasting via Socket.IO rooms.
   - In-app notification bell drawer with unread badges.
9. **Faculty Workload & Departmental Analytics**:
   - HOD dashboard with weekly teaching hours, credit distribution, and semester health metrics.

---

## 📁 Backend Directory Architecture

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection handler
│   └── cloudinary.js         # Cloudinary configuration & fallback
├── controllers/
│   ├── authController.js         # Register, Login, Me, Profile update, Password change
│   ├── userController.js         # User management, filtering, activation, faculty & student lists
│   ├── departmentController.js   # Department CRUD, HOD assignment, capacity stats
│   ├── subjectController.js      # Subject CRUD, faculty allocation, syllabus
│   ├── attendanceController.js   # QR session start, live token refresh, QR scan, manual log, reports
│   ├── timetableController.js    # Conflict detection, slot CRUD, auto-generator
│   ├── assignmentController.js   # Assignment creation, student submission, grading
│   ├── examController.js         # Exam scheduling, marks entry, marksheets, results
│   ├── placementController.js    # Job postings, student application, AI match evaluation
│   ├── noticeController.js       # Campus digital notice board & socket broadcasts
│   ├── notificationController.js # User notifications, unread count, read-all, clear
│   ├── analyticsController.js    # Admin, HOD, and Faculty KPI metrics & charts data
│   └── aiController.js           # Risk prediction, campus chatbot, placement matcher
├── middleware/
│   ├── authMiddleware.js     # JWT token verification & profile attachment
│   ├── roleMiddleware.js     # RBAC role authorization
│   └── uploadMiddleware.js   # Multer file storage & Cloudinary upload helper
├── models/
│   ├── User.js               # Base credentials, role, avatar, status
│   ├── Department.js         # Name, code, HOD reference, capacity
│   ├── Student.js            # Roll number, semester, section, CGPA, attendance %, skills
│   ├── Faculty.js            # Employee ID, designation, workload hours, assigned subjects
│   ├── Subject.js            # Code, credits, theory/practical, syllabus
│   ├── Attendance.js         # Subject, faculty, student, date, status, session token, QR/manual
│   ├── Timetable.js          # Dept, sem, section, day, timeSlot, subject, faculty, room
│   ├── Assignment.js         # Title, description, due date, max marks, attachment
│   ├── Submission.js         # Student submission file, marks obtained, feedback, status
│   ├── Examination.js        # Title, type, date, time, totalMarks, passingMarks, room
│   ├── Mark.js               # Exam, student, marksObtained, grade, remarks
│   ├── Placement.js          # Company, role, salary, skills, deadline, eligibility
│   ├── Application.js        # Student application, resume, status, AI match snapshot
│   ├── Notice.js             # Title, content, priority, target roles, department
│   ├── Notification.js       # Recipient, title, message, type, isRead, link
│   └── AcademicReport.js     # Student AI risk level, score, factors, recommendations
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── departmentRoutes.js
│   ├── subjectRoutes.js
│   ├── attendanceRoutes.js
│   ├── timetableRoutes.js
│   ├── assignmentRoutes.js
│   ├── examRoutes.js
│   ├── placementRoutes.js
│   ├── noticeRoutes.js
│   ├── notificationRoutes.js
│   ├── analyticsRoutes.js
│   └── aiRoutes.js
├── services/
│   ├── aiService.js          # Google Gemini API integration & analytical fallback
│   ├── qrService.js          # Time-limited dynamic QR code generation & HMAC verification
│   └── socketService.js      # Socket.IO room handling & real-time events
├── utils/
│   └── helpers.js
├── .env.example
├── package.json
└── server.js
```

---

## 🔑 Environment Configuration (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart_campus
JWT_SECRET=smart_campus_jwt_super_secret_key_prod_2026
QR_SECRET=smart_campus_qr_attendance_signature_secret_2026
GEMINI_API_KEY=your_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

*(Note: If you are using MongoDB Atlas, replace `MONGO_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_campus?retryWrites=true&w=majority`)*

---

## 👥 Pre-Configured Demo Accounts (Ready to Test)

All demo accounts share the password: **`Password@123`**

| Role | Name | Email | Password | Department / Context |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Arthur Vance | `admin@campus.edu` | `Password@123` | College-wide Administrator |
| **HOD** | Prof. Marcus Holloway | `hod.cse@campus.edu` | `Password@123` | Head of Dept, Computer Science |
| **Faculty** | Dr. Robert Miller | `robert.miller@campus.edu` | `Password@123` | Associate Professor (AI & ML) |
| **Faculty** | Prof. Sarah Jenkins | `sarah.jenkins@campus.edu` | `Password@123` | Assistant Professor (Cloud & DB) |
| **Student** | Alex Johnson | `alex.student@campus.edu` | `Password@123` | CSE Sem 6, Section A (CGPA: 8.85) |
| **Student (At-Risk)** | Michael Brown | `michael.student@campus.edu` | `Password@123` | CSE Sem 6, Section A (CGPA: 5.20, Low Att.) |

---

## 🛠️ How to Run Backend

### Start the Backend Server
```bash
cd backend
npm start
# or for live reload with nodemon:
npm run dev
```
The server will start at `http://localhost:5000`.

---

## 📡 Complete REST API Endpoint Reference

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Register user (student, faculty, hod, admin)
- `POST /api/auth/login` — Login with email & password, returns JWT token & user profile
- `GET /api/auth/me` *(Protected)* — Get current authenticated user profile
- `PUT /api/auth/profile` *(Protected)* — Update profile (name, phone, avatar, skills, bio)
- `PUT /api/auth/change-password` *(Protected)* — Change user password

### 2. User Management (`/api/users`)
- `GET /api/users` *(Admin, HOD)* — Filter users by role, department, search, pagination
- `GET /api/users/:id` *(Protected)* — Get single user and detailed profile
- `GET /api/users/faculty/all` *(Protected)* — List faculty members with assigned subjects
- `GET /api/users/students/filter` *(Protected)* — Query students by department, semester, section
- `PATCH /api/users/:id/status` *(Admin)* — Toggle user active/deactivated status
- `DELETE /api/users/:id` *(Admin)* — Remove user and associated profile

### 3. Departments (`/api/departments`)
- `GET /api/departments` — List all departments with dynamic student & faculty counts
- `GET /api/departments/:id` — Department details
- `POST /api/departments` *(Admin)* — Create new department & assign HOD
- `PUT /api/departments/:id` *(Admin)* — Update department details
- `DELETE /api/departments/:id` *(Admin)* — Remove department

### 4. Subjects (`/api/subjects`)
- `GET /api/subjects` *(Protected)* — List subjects (filterable by department, semester, faculty)
- `POST /api/subjects` *(Admin, HOD)* — Create subject and assign teaching faculty
- `PUT /api/subjects/:id` *(Admin, HOD)* — Update subject syllabus, credits, or faculty
- `DELETE /api/subjects/:id` *(Admin, HOD)* — Remove subject

### 5. Smart QR & Manual Attendance (`/api/attendance`)
- `POST /api/attendance/session/start` *(Faculty, HOD)* — Start attendance session; returns initial dynamic QR code Data URL & session token
- `GET /api/attendance/session/:sessionId/token` *(Faculty, HOD)* — Live heartbeat endpoint returning the rotating 30-second HMAC token & real-time attendance count
- `POST /api/attendance/scan` *(Student)* — Student scans QR code; validates HMAC signature, timestamp, department/semester enrollment, and logs attendance
- `POST /api/attendance/manual` *(Faculty, HOD)* — Batch manual attendance marking (`present`, `absent`, `late`)
- `GET /api/attendance/my` *(Student)* — Student subject-wise attendance breakdown and percentage
- `GET /api/attendance/subject/:subjectId` *(Faculty, HOD, Admin)* — Full attendance report for a subject
- `POST /api/attendance/session/:sessionId/end` *(Faculty, HOD)* — Explicitly close an attendance session

### 6. Timetable & Conflict Engine (`/api/timetable`)
- `GET /api/timetable` *(Protected)* — Timetable grid by department, semester, section
- `POST /api/timetable` *(Admin, HOD)* — Schedule slot with automatic conflict detection (room clash, faculty clash, section period overlap)
- `POST /api/timetable/auto-generate` *(Admin, HOD)* — Automated conflict-free timetable generation
- `PUT /api/timetable/:id` *(Admin, HOD)* — Edit timetable entry with conflict checks
- `DELETE /api/timetable/:id` *(Admin, HOD)* — Remove timetable entry

### 7. Assignments & Submissions (`/api/assignments`)
- `GET /api/assignments` *(Protected)* — List assignments (filtered for student's semester or faculty's subjects)
- `GET /api/assignments/:id` *(Protected)* — Assignment details with student submission state
- `POST /api/assignments` *(Faculty, HOD)* — Create assignment with optional file attachment
- `POST /api/assignments/:id/submit` *(Student)* — Submit assignment document/file (flags late submissions)
- `GET /api/assignments/:id/submissions` *(Faculty, HOD, Admin)* — View all submissions for an assignment
- `PUT /api/assignments/submissions/:submissionId/grade` *(Faculty, HOD)* — Grade submission with marks and feedback
- `DELETE /api/assignments/:id` *(Faculty, Admin)* — Delete assignment

### 8. Examinations & Results (`/api/exams`)
- `GET /api/exams` *(Protected)* — List exams (midterm, final, quiz, internal)
- `POST /api/exams` *(Faculty, HOD, Admin)* — Schedule new examination
- `POST /api/exams/:examId/marks` *(Faculty, HOD)* — Upload student marks batch; recomputes CGPA and grades
- `GET /api/exams/my-results` *(Student)* — Student view of marks, grades, and CGPA
- `GET /api/exams/:examId/results` *(Faculty, HOD, Admin)* — Class marksheet with highest, lowest, average, and pass rate

### 9. Placements & Career Portal (`/api/placements`)
- `GET /api/placements` *(Protected)* — Active job drives; if student, calculates AI skill match score and eligibility
- `GET /api/placements/:id` *(Protected)* — Placement details and student application status
- `POST /api/placements` *(Admin, HOD)* — Create placement drive (company, role, package, skills, deadline)
- `POST /api/placements/:id/apply` *(Student)* — Apply for placement with resume and skills snapshot
- `GET /api/placements/:id/applications` *(Admin, HOD)* — View applicants ranked with AI compatibility scores
- `PUT /api/placements/applications/:applicationId/status` *(Admin, HOD)* — Update status (`shortlisted`, `interviewing`, `selected`, `rejected`)
- `DELETE /api/placements/:id` *(Admin, HOD)* — Delete placement drive

### 10. Digital Notices (`/api/notices`)
- `GET /api/notices` *(Protected)* — View notices filtered by user role and department
- `POST /api/notices` *(Admin, HOD, Faculty)* — Publish notice with priority (`normal`, `high`, `urgent`) and broadcast via Socket.IO
- `DELETE /api/notices/:id` *(Admin, HOD)* — Delete notice

### 11. Notifications (`/api/notifications`)
- `GET /api/notifications` *(Protected)* — Fetch user notifications and unread badge count
- `PATCH /api/notifications/:id/read` *(Protected)* — Mark notification as read
- `PATCH /api/notifications/read-all` *(Protected)* — Mark all notifications as read
- `DELETE /api/notifications/clear` *(Protected)* — Delete read notifications

### 12. Analytics (`/api/analytics`)
- `GET /api/analytics/admin` *(Admin)* — College-wide metrics: total students, faculty, departments, placements, avg CGPA, attendance distribution
- `GET /api/analytics/hod` *(HOD, Admin)* — Department analytics, semester distribution, faculty teaching load hours & workload status
- `GET /api/analytics/faculty` *(Faculty, HOD)* — Assigned subjects, pending grading count, conducted attendance sessions

### 13. Advanced AI Features (`/api/ai`)
- `GET /api/ai/at-risk-students` *(Admin, HOD, Faculty)* — AI model identifying at-risk students with quantified scores, factors, recommendations, and Gemini summary
- `GET /api/ai/student-risk/:studentId` *(Protected)* — Specific student academic risk assessment
- `POST /api/ai/assistant/chat` *(Student)* — AI Campus Assistant chatbot using Gemini API querying authorized student database context
- `GET /api/ai/placement-match/:placementId` *(Student)* — AI skill compatibility evaluation against a job opening
- `GET /api/ai/department-summary` *(HOD, Admin)* — Gemini executive summary of departmental academic performance

---

## ⚡ Socket.IO Real-Time Events

- **Rooms**:
  - `user_<userId>` — Private notifications for specific user
  - `role_<role>` — Role-based broadcasts (`role_student`, `role_faculty`, etc.)
  - `dept_<deptId>` — Department announcements
  - `attendance_<sessionId>` — Live attendance monitoring room
- **Events Emitted**:
  - `new_notice_published` — Broadcasts new campus notice
  - `student_marked_attendance` — Real-time attendance increment on faculty screen
  - `attendance_session_closed` — Notifies students when session ends
  - `new_placement_drive` — Alerts students of new job openings
  - `assignment_graded` — Notifies student when submission is evaluated
  - `placement_status_changed` — Alerts student of application status changes
