const express = require('express');
const {
  submitCode,
  getSubmission,
  getMySubmissions,
  getAssignmentSubmissions,
  getProblemSubmissions,
  getLeaderboard,
  getMyProgress,
  getStudentProgress,
  rerunSubmission,
} = require('../controllers/submissionController');
const { protect } = require('../middlewares/auth');
const { isAdmin, isStudent } = require('../middlewares/roles');
const { submissionLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/', isStudent, submissionLimiter, submitCode);
router.get('/student/me', isStudent, getMySubmissions);
router.get('/problem/:problemId', isStudent, getProblemSubmissions);
router.get('/progress/:assignmentId', isStudent, getMyProgress);

// Public/shared routes
router.get('/leaderboard/:assignmentId', getLeaderboard);
router.get('/:id', getSubmission);

// Admin routes
router.get('/assignment/:assignmentId', isAdmin, getAssignmentSubmissions);
router.get('/progress/:assignmentId/:studentId', isAdmin, getStudentProgress);
router.post('/:id/rerun', isAdmin, rerunSubmission);

module.exports = router;