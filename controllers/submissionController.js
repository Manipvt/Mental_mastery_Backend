const asyncHandler = require('../utils/asyncHandler');
const submissionService = require('../services/submissionService');

// @desc    Submit code
// @route   POST /api/v1/submissions
// @access  Private/Student
exports.submitCode = asyncHandler(async (req, res) => {
  const submissionData = {
    assignmentId: req.body.assignmentId,
    problemId: req.body.problemId,
    code: req.body.code,
    language: req.body.language,
  };

  const submission = await submissionService.submitCode(submissionData, req.user.id);

  res.status(201).json({
    success: true,
    data: submission,
    message: 'Code submitted successfully. Evaluation in progress...',
  });
});

// @desc    Get submission by ID
// @route   GET /api/v1/submissions/:id
// @access  Private
exports.getSubmission = asyncHandler(async (req, res) => {
  const studentId = req.user.type === 'student' ? req.user.id : null;
  const submission = await submissionService.getSubmissionById(
    req.params.id,
    studentId
  );

  res.status(200).json({
    success: true,
    data: submission,
  });
});

// @desc    Get current student's submissions
// @route   GET /api/v1/submissions/student/me
// @access  Private/Student
exports.getMySubmissions = asyncHandler(async (req, res) => {
  const filters = {
    assignmentId: req.query.assignmentId,
    status: req.query.status,
  };

  const submissions = await submissionService.getStudentSubmissions(
    req.user.id,
    filters
  );

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

// @desc    Get submissions by assignment
// @route   GET /api/v1/submissions/assignment/:assignmentId
// @access  Private/Admin
exports.getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getAssignmentSubmissions(
    req.params.assignmentId
  );

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

// @desc    Get submissions for a specific problem
// @route   GET /api/v1/submissions/problem/:problemId
// @access  Private/Student
exports.getProblemSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getProblemSubmissions(
    req.user.id,
    req.params.problemId
  );

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions,
  });
});

// @desc    Get leaderboard for assignment
// @route   GET /api/v1/submissions/leaderboard/:assignmentId
// @access  Private
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await submissionService.getLeaderboard(req.params.assignmentId);

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard,
  });
});

// @desc    Get student progress for assignment
// @route   GET /api/v1/submissions/progress/:assignmentId
// @access  Private/Student
exports.getMyProgress = asyncHandler(async (req, res) => {
  const progress = await submissionService.getStudentProgress(
    req.user.id,
    req.params.assignmentId
  );

  res.status(200).json({
    success: true,
    data: progress,
  });
});

// @desc    Get student progress (Admin view)
// @route   GET /api/v1/submissions/progress/:assignmentId/:studentId
// @access  Private/Admin
exports.getStudentProgress = asyncHandler(async (req, res) => {
  const progress = await submissionService.getStudentProgress(
    req.params.studentId,
    req.params.assignmentId
  );

  res.status(200).json({
    success: true,
    data: progress,
  });
});

// @desc    Rerun submission (for debugging/re-evaluation)
// @route   POST /api/v1/submissions/:id/rerun
// @access  Private/Admin
exports.rerunSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.rerunSubmission(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Mark a problem as solved (trusted path from client after local verification)
// @route   POST /api/v1/submissions/mark-solved
// @access  Private/Student
exports.markSolved = asyncHandler(async (req, res) => {
  const submissionData = {
    assignmentId: req.body.assignmentId,
    problemId: req.body.problemId,
    language: req.body.language,
    code: req.body.code,
  };

  const submission = await submissionService.markSolved(submissionData, req.user.id);

  res.status(201).json({
    success: true,
    data: submission,
  });
});