const asyncHandler = require('../utils/asyncHandler');
const assignmentService = require('../services/assignmentService');

// @desc    Get all assignments
// @route   GET /api/v1/assignments
// @access  Private
exports.getAllAssignments = asyncHandler(async (req, res) => {
  const filters = {
    isActive: req.query.isActive,
  };

  const assignments = await assignmentService.getAllAssignments(filters);

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Get single assignment
// @route   GET /api/v1/assignments/:id
// @access  Private (Admin or Student)
exports.getAssignment = asyncHandler(async (req, res) => {
  // Always include problems for better UX
  const includeProblems = req.query.includeProblems !== 'false';
  const assignment = await assignmentService.getAssignmentById(
    req.params.id,
    includeProblems
  );

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// @desc    Create assignment
// @route   POST /api/v1/assignments
// @access  Private/Admin
exports.createAssignment = asyncHandler(async (req, res) => {
  const assignmentData = {
    title: req.body.title,
    description: req.body.description,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    durationMinutes: req.body.durationMinutes,
    isActive: req.body.isActive,
    allowMultipleSubmissions: req.body.allowMultipleSubmissions,
    maxViolations: req.body.maxViolations,
  };

  const assignment = await assignmentService.createAssignment(
    assignmentData,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: assignment,
  });
});

// @desc    Update assignment
// @route   PUT /api/v1/assignments/:id
// @access  Private/Admin
exports.updateAssignment = asyncHandler(async (req, res) => {
  const assignmentData = {
    title: req.body.title,
    description: req.body.description,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    durationMinutes: req.body.durationMinutes,
    isActive: req.body.isActive,
    allowMultipleSubmissions: req.body.allowMultipleSubmissions,
    maxViolations: req.body.maxViolations,
  };

  const assignment = await assignmentService.updateAssignment(
    req.params.id,
    assignmentData
  );

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// @desc    Delete assignment
// @route   DELETE /api/v1/assignments/:id
// @access  Private/Admin
exports.deleteAssignment = asyncHandler(async (req, res) => {
  await assignmentService.deleteAssignment(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});

// @desc    Get active assignments
// @route   GET /api/v1/assignments/active
// @access  Private
exports.getActiveAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getActiveAssignments();

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Get upcoming assignments
// @route   GET /api/v1/assignments/upcoming
// @access  Private
exports.getUpcomingAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getUpcomingAssignments();

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Toggle assignment status
// @route   PATCH /api/v1/assignments/:id/toggle-status
// @access  Private/Admin
exports.toggleAssignmentStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const assignment = await assignmentService.toggleAssignmentStatus(
    req.params.id,
    isActive
  );

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// @desc    Get assignment statistics
// @route   GET /api/v1/assignments/:id/stats
// @access  Private/Admin
exports.getAssignmentStats = asyncHandler(async (req, res) => {
  const stats = await assignmentService.getAssignmentStats(req.params.id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get student's assignments with progress
// @route   GET /api/v1/assignments/student/me
// @access  Private/Student
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getStudentAssignments(req.user.id);

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Check assignment access
// @route   GET /api/v1/assignments/:id/check-access
// @access  Private/Student
exports.checkAssignmentAccess = asyncHandler(async (req, res) => {
  const result = await assignmentService.checkAssignmentAccess(
    req.user.id,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});