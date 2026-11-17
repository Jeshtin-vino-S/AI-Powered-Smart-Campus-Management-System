import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET_KEY = process.env.QR_SECRET;

// In-memory active attendance sessions registry
const activeSessions = new Map();

export const createAttendanceSession = async ({
  sessionId,
  subjectId,
  facultyId,
  departmentId,
  semester,
  section,
  validityMinutes = 15,
}) => {
  const expiresAt = Date.now() + validityMinutes * 60 * 1000;
  
  const sessionData = {
    sessionId,
    subjectId: subjectId.toString(),
    facultyId: facultyId.toString(),
    departmentId: departmentId.toString(),
    semester: Number(semester),
    section,
    createdAt: Date.now(),
    expiresAt,
    isActive: true,
  };

  activeSessions.set(sessionId, sessionData);

  // Generate dynamic payload for QR code
  const tokenPayload = generateDynamicQRToken(sessionId);
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(tokenPayload));

  return {
    ...sessionData,
    tokenPayload,
    qrDataUrl,
  };
};

export const generateDynamicQRToken = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (!session || !session.isActive || Date.now() > session.expiresAt) {
    return null;
  }

  // Rotating timestamp window (valid for 30 seconds per token)
  const windowTime = Math.floor(Date.now() / 30000); // 30 sec time slice
  const payloadStr = `${sessionId}:${session.subjectId}:${windowTime}`;
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadStr)
    .digest('hex');

  return {
    sessionId,
    subjectId: session.subjectId,
    timestamp: Date.now(),
    timeSlice: windowTime,
    signature,
  };
};

export const verifyQRToken = (scannedData) => {
  let parsed;
  try {
    parsed = typeof scannedData === 'string' ? JSON.parse(scannedData) : scannedData;
  } catch (err) {
    return { valid: false, message: 'Invalid QR code format' };
  }

  const { sessionId, subjectId, timeSlice, signature } = parsed;

  if (!sessionId || !subjectId || !signature) {
    return { valid: false, message: 'Missing token parameters in QR code' };
  }

  const session = activeSessions.get(sessionId);
  if (!session) {
    return { valid: false, message: 'Attendance session not found or already closed' };
  }

  if (!session.isActive) {
    return { valid: false, message: 'Attendance session has been closed by faculty' };
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(sessionId);
    return { valid: false, message: 'Attendance session has expired' };
  }

  // Check window signature (allow current or immediate previous 30s window to avoid edge-of-second failures)
  const currentWindow = Math.floor(Date.now() / 30000);
  const isValidSlice =
    timeSlice === currentWindow || timeSlice === currentWindow - 1;

  if (!isValidSlice) {
    return { valid: false, message: 'QR Code has expired. Please scan the current live QR code.' };
  }

  const expectedCurrent = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${sessionId}:${subjectId}:${timeSlice}`)
    .digest('hex');

  if (signature !== expectedCurrent) {
    return { valid: false, message: 'Tampered or invalid QR code signature' };
  }

  return {
    valid: true,
    session,
  };
};

export const endAttendanceSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isActive = false;
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
};

export const getSessionInfo = (sessionId) => {
  return activeSessions.get(sessionId) || null;
};
