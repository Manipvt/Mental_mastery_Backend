const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

// @desc    Get all students
// @route   GET /api/v1/users/students
// @access  Private/Admin
exports.getAllStudents = asyncHandler(async (req, res) => {
  const filters = {
    branch: req.query.branch,
    year: req.query.year,
    section: req.query.section,
    isActive: req.query.isActive,
  };

  const students = await userService.getAllStudents(filters);

  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Get single student
// @route   GET /api/v1/users/students/:id
// @access  Private/Admin
exports.getStudent = asyncHandler(async (req, res) => {
  const student = await userService.getStudentById(req.params.id);

  res.status(200).json({
    success: true,
    data: student,
  });
});

// @desc    Create student
// @route   POST /api/v1/users/students
// @access  Private/Admin
exports.createStudent = asyncHandler(async (req, res) => {
  const studentData = {
    rollNumber: req.body.rollNumber,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    branch: req.body.branch,
    year: req.body.year,
    section: req.body.section,
  };

  const student = await userService.createStudent(studentData);

  res.status(201).json({
    success: true,
    data: student,
  });
});

// @desc    Update student
// @route   PUT /api/v1/users/students/:id
// @access  Private/Admin
exports.updateStudent = asyncHandler(async (req, res) => {
  const studentData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    branch: req.body.branch,
    year: req.body.year,
    section: req.body.section,
    isActive: req.body.isActive,
  };

  const student = await userService.updateStudent(req.params.id, studentData);

  res.status(200).json({
    success: true,
    data: student,
  });
});

// @desc    Delete student
// @route   DELETE /api/v1/users/students/:id
// @access  Private/Admin
exports.deleteStudent = asyncHandler(async (req, res) => {
  await userService.deleteStudent(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
  });
});

// @desc    Bulk create students
// @route   POST /api/v1/users/students/bulk
// @access  Private/Admin
exports.bulkCreateStudents = asyncHandler(async (req, res) => {
  const studentsData = req.body.students;

  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of students',
    });
  }

  const students = await userService.bulkCreateStudents(studentsData);

  res.status(201).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    Toggle student status
// @route   PATCH /api/v1/users/students/:id/toggle-status
// @access  Private/Admin
exports.toggleStudentStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const student = await userService.toggleStudentStatus(req.params.id, isActive);

  res.status(200).json({
    success: true,
    data: student,
  });
});

// @desc    Get student statistics
// @route   GET /api/v1/users/students/stats
// @access  Private/Admin
exports.getStudentStats = asyncHandler(async (req, res) => {
  const stats = await userService.getStudentStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get all admins
// @route   GET /api/v1/users/admins
// @access  Private/Admin
exports.getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await userService.getAllAdmins();

  res.status(200).json({
    success: true,
    count: admins.length,
    data: admins,
  });
});

// @desc    Create admin
// @route   POST /api/v1/users/admins
// @access  Private/Admin
exports.createAdmin = asyncHandler(async (req, res) => {
  const adminData = {
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };

  const admin = await userService.createAdmin(adminData);

  res.status(201).json({
    success: true,
    data: admin,
  });
});