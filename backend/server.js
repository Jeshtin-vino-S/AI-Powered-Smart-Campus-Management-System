import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import './models/index.js';
import { initSocket } from './services/socketService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const server = http.createServer(app);

// Connect to MySQL
connectDB();

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});
initSocket(io);

// Security & Utility Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AI-Powered Smart Campus Management Backend API',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`[Server Running]: AI Smart Campus Management System API on port ${PORT}`);
});

export { app, server, io };
