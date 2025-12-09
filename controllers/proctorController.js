const asyncHandler = require('../utils/asyncHandler');
const proctorService = require('../services/proctorService');

// @desc    Start assignment session
// @route   POST /api/v1/proctor/start-session
// @access  Private/Student
exports.startSession = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;
  
  const metadata = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  const session = await proctorService.startSession(
    req.user.id,
    assignmentId,
    metadata
  );

  res.status(200).json({
    success: true,
    data: session,
    message: 'Session started successfully',
  });
});

// @desc    Record violation
// @route   POST /api/v1/proctor/violation
// @access  Private/Student
exports.recordViolation = asyncHandler(async (req, res) => {
  const violationData = {
    assignmentId: req.body.assignmentId,
    violationType: req.body.violationType,
    description: req.body.description,
    severity: req.body.severity,
    metadata: req.body.metadata,
  };

  const result = await proctorService.recordViolation(violationData, req.user.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Get my violations
// @route   GET /api/v1/proctor/violations/me
// @access  Private/Student
exports.getMyViolations = asyncHandler(async (req, res) => {
  const assignmentId = req.query.assignmentId || null;
  const violations = await proctorService.getViolations(req.user.id, assignmentId);

  res.status(200).json({
    success: true,
    count: violations.length,
    data: violations,
  });
});

// @desc    Get violations by assignment (Admin)
// @route   GET /api/v1/proctor/violations/assignment/:assignmentId
// @access  Private/Admin
exports.getAssignmentViolations = asyncHandler(async (req, res) => {
  const violations = await proctorService.getAssignmentViolations(
    req.params.assignmentId
  );

  res.status(200).json({
    success: true,
    count: violations.length,
    data: violations,
  });
});

// @desc    Get violations summary
// @route   GET /api/v1/proctor/violations/summary/:assignmentId
// @access  Private/Admin
exports.getViolationsSummary = asyncHandler(async (req, res) => {
  const summary = await proctorService.getViolationsSummary(req.params.assignmentId);

  res.status(200).json({
    success: true,
    data: summary,
  });
});

// @desc    Get high risk students
// @route   GET /api/v1/proctor/high-risk/:assignmentId
// @access  Private/Admin
exports.getHighRiskStudents = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 3;
  const students = await proctorService.getHighRiskStudents(
    req.params.assignmentId,
    threshold
  );

  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

// @desc    End session
// @route   POST /api/v1/proctor/end-session
// @access  Private/Student
exports.endSession = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;

  const session = await proctorService.endSession(req.user.id, assignmentId);

  res.status(200).json({
    success: true,
    data: session,
    message: 'Session ended successfully',
  });
});

// @desc    Get session info
// @route   GET /api/v1/proctor/session/:assignmentId
// @access  Private/Student
exports.getSessionInfo = asyncHandler(async (req, res) => {
  const sessionInfo = await proctorService.getSessionInfo(
    req.user.id,
    req.params.assignmentId
  );

  res.status(200).json({
    success: true,
    data: sessionInfo,
  });
});

// @desc    Get active sessions
// @route   GET /api/v1/proctor/sessions/active/:assignmentId
// @access  Private/Admin
exports.getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await proctorService.getActiveSessions(req.params.assignmentId);

  res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

// @desc    Get session statistics
// @route   GET /api/v1/proctor/sessions/stats/:assignmentId
// @access  Private/Admin
exports.getSessionStats = asyncHandler(async (req, res) => {
  const stats = await proctorService.getSessionStats(req.params.assignmentId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Unlock session (Admin)
// @route   POST /api/v1/proctor/unlock-session
// @access  Private/Admin
exports.unlockSession = asyncHandler(async (req, res) => {
  const { studentId, assignmentId } = req.body;

  const session = await proctorService.unlockSession(
    studentId,
    assignmentId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: session,
    message: 'Session unlocked successfully',
  });
});

// @desc    Lock session (Admin)
// @route   POST /api/v1/proctor/lock-session
// @access  Private/Admin
exports.lockSession = asyncHandler(async (req, res) => {
  const { studentId, assignmentId, reason } = req.body;

  const session = await proctorService.lockSession(
    studentId,
    assignmentId,
    req.user.id,
    reason
  );

  res.status(200).json({
    success: true,
    data: session,
    message: 'Session locked successfully',
  });
});

// @desc    Clear violations (Admin)
// @route   POST /api/v1/proctor/clear-violations
// @access  Private/Admin
exports.clearViolations = asyncHandler(async (req, res) => {
  const { studentId, assignmentId } = req.body;

  const result = await proctorService.clearViolations(
    studentId,
    assignmentId,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});