const express = require('express');
const {
  startSession,
  recordViolation,
  getMyViolations,
  getAssignmentViolations,
  getViolationsSummary,
  getHighRiskStudents,
  endSession,
  getSessionInfo,
  getActiveSessions,
  getSessionStats,
  unlockSession,
  lockSession,
  clearViolations,
} = require('../controllers/proctorController');
const { protect } = require('../middlewares/auth');
const { isAdmin, isStudent } = require('../middlewares/roles');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/start-session', isStudent, startSession);
router.post('/violation', isStudent, recordViolation);
router.post('/end-session', isStudent, endSession);
router.get('/violations/me', isStudent, getMyViolations);
router.get('/session/:assignmentId', isStudent, getSessionInfo);

// Admin routes
router.get('/violations/assignment/:assignmentId', isAdmin, getAssignmentViolations);
router.get('/violations/summary/:assignmentId', isAdmin, getViolationsSummary);
router.get('/high-risk/:assignmentId', isAdmin, getHighRiskStudents);
router.get('/sessions/active/:assignmentId', isAdmin, getActiveSessions);
router.get('/sessions/stats/:assignmentId', isAdmin, getSessionStats);
router.post('/unlock-session', isAdmin, unlockSession);
router.post('/lock-session', isAdmin, lockSession);
router.post('/clear-violations', isAdmin, clearViolations);

module.exports = router;