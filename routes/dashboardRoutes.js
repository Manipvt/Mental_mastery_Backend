const express = require('express');
const {
  getStudentStats,
  getStudentAssignmentDetails,
  getAdminStats,
  getAdminAssignmentDashboard,
  getProblemStats,
  getUserReport,
  getAllStudentsReport,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');
const { isAdmin, isStudent } = require('../middlewares/roles');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student dashboard routes
router.get('/student/stats', isStudent, getStudentStats);
router.get('/student/assignment/:assignmentId', isStudent, getStudentAssignmentDetails);

// Admin dashboard routes
router.get('/admin/stats', isAdmin, getAdminStats);
router.get('/admin/assignment/:assignmentId', isAdmin, getAdminAssignmentDashboard);
router.get('/admin/problem/:problemId', isAdmin, getProblemStats);
router.get('/admin/user/:studentId/report', isAdmin, getUserReport);
router.get('/admin/students', isAdmin, getAllStudentsReport);

module.exports = router;