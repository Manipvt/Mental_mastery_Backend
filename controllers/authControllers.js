const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

// @desc    Student login
// @route   POST /api/v1/auth/student/login
// @access  Public
exports.studentLogin = asyncHandler(async (req, res, next) => {
  const { rollNumber, password } = req.body;

  const result = await authService.studentLogin(rollNumber, password);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Admin login
// @route   POST /api/v1/auth/admin/login
// @access  Public
exports.adminLogin = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  const result = await authService.adminLogin(username, password);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await authService.getProfile(req.user.id, req.user.type);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});