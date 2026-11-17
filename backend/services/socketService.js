let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client authentication and room joining
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('join_role_room', ({ role, departmentId, semester }) => {
      if (role) {
        socket.join(`role_${role}`);
        if (departmentId) {
          socket.join(`dept_${departmentId}`);
        }
        if (semester) {
          socket.join(`sem_${semester}`);
        }
      }
    });

    socket.on('join_attendance_session', (sessionId) => {
      if (sessionId) {
        socket.join(`attendance_${sessionId}`);
      }
    });

    socket.on('leave_attendance_session', (sessionId) => {
      if (sessionId) {
        socket.leave(`attendance_${sessionId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};

export const emitToUser = (userId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (ioInstance) {
    ioInstance.to(`role_${role}`).emit(event, data);
  }
};

export const emitToDepartment = (departmentId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`dept_${departmentId}`).emit(event, data);
  }
};

export const emitToAttendanceSession = (sessionId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`attendance_${sessionId}`).emit(event, data);
  }
};

export const emitBroadcast = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
