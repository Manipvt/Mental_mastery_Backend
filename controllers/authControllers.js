const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

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

// @desc    Update passwords (temporary endpoint)
// @route   POST /api/v1/auth/update-passwords
// @access  Public (temporary - remove after use)
exports.updatePasswords = asyncHandler(async (req, res, next) => {
  try {
    console.log('Updating passwords...');
    
    // Update admin password
    const adminHash = await bcrypt.hash('Admin@123', 10);
    await query(
      'UPDATE users SET password = $1 WHERE roll_number = $2 AND role = $3',
      [adminHash, 'ADMIN001', 'admin']
    );
    console.log('Admin password updated');
    
    // Update student passwords
    const students = [
      { rollNumber: 'CSE2021001' },
      { rollNumber: 'CSE2021002' },
      { rollNumber: 'CSE2021003' }
    ];
    
    for (const student of students) {
      const hash = await bcrypt.hash(student.rollNumber, 10);
      await query(
        'UPDATE users SET password = $1 WHERE roll_number = $2 AND role = $3',
        [hash, student.rollNumber, 'student']
      );
      console.log(`Updated password for ${student.rollNumber}`);
    }
    
    console.log('All passwords updated successfully!');
    
    res.status(200).json({
      success: true,
      message: 'Passwords updated successfully! Admin: Admin@123, Students: use roll_number as password',
    });
  } catch (error) {
    console.error('Error updating passwords:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating passwords',
    });
  }
});