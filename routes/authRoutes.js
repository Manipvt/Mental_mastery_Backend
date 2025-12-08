const express = require('express');
const {
  studentLogin,
  adminLogin,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');
const { studentLoginValidator, adminLoginValidator } = require('../validators/authValidator');
const { validate } = require('../utils/validator');

const router = express.Router();

router.post('/student/login', loginLimiter, studentLoginValidator, validate, studentLogin);
router.post('/admin/login', loginLimiter, adminLoginValidator, validate, adminLogin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;