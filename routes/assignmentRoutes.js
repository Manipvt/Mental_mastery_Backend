const express = require('express');
const {
  getAllAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getActiveAssignments,
  getUpcomingAssignments,
  toggleAssignmentStatus,
  getAssignmentStats,
  getMyAssignments,
  checkAssignmentAccess,
} = require('../controllers/assignmentController');
const { protect } = require('../middlewares/auth');
const { isAdmin, isStudent, hasRole } = require('../middlewares/roles');
const {
  createAssignmentValidator,
  updateAssignmentValidator,
} = require('../validators/assignmentValidator');
const { validate } = require('../utils/validator');

const router = express.Router();

// Public routes (require authentication)
router.use(protect);

// Student-specific routes
router.get('/student/me', isStudent, getMyAssignments);
router.get('/:id/check-access', isStudent, checkAssignmentAccess);

// Mixed access routes
router.get('/active', getActiveAssignments);
router.get('/upcoming', getUpcomingAssignments);

router
  .route('/')
  .get(getAllAssignments)
  .post(isAdmin, createAssignmentValidator, validate, createAssignment);

router
  .route('/:id')
  .get(getAssignment)
  .put(isAdmin, updateAssignmentValidator, validate, updateAssignment)
  .delete(isAdmin, deleteAssignment);

// Admin-only routes
router.patch('/:id/toggle-status', isAdmin, toggleAssignmentStatus);
router.get('/:id/stats', isAdmin, getAssignmentStats);

module.exports = router;