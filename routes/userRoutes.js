const express = require('express');
const {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  toggleStudentStatus,
  getStudentStats,
  getAllAdmins,
  createAdmin,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roles');
const {
  createStudentValidator,
  updateStudentValidator,
  createAdminValidator,
} = require('../validators/userValidator');
const { validate } = require('../utils/validator');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(isAdmin);

// Student routes
router
  .route('/students')
  .get(getAllStudents)
  .post(createStudentValidator, validate, createStudent);

router.get('/students/stats', getStudentStats);

router.post('/students/bulk', bulkCreateStudents);

router
  .route('/students/:id')
  .get(getStudent)
  .put(updateStudentValidator, validate, updateStudent)
  .delete(deleteStudent);

router.patch('/students/:id/toggle-status', toggleStudentStatus);

// Admin routes
router
  .route('/admins')
  .get(getAllAdmins)
  .post(createAdminValidator, validate, createAdmin);

module.exports = router;