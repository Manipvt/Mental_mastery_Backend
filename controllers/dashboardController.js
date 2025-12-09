const asyncHandler = require('../utils/asyncHandler');
const Assignment = require('../models/assignment');
const Problem = require('../models/problem');
const Submission = require('../models/submission');
const Violation = require('../models/violation');
const Student = require('../models/student');
const AssignmentSession = require('../models/assignmentSession');

// @desc    Get student dashboard statistics
// @route   GET /api/v1/dashboard/student/stats
// @access  Private/Student
exports.getStudentStats = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  // Get total assignments
  const allAssignments = await Assignment.findAll({ isActive: true });
  
  // Get active assignments
  const activeAssignments = await Assignment.getActiveAssignments();
  
  // Get upcoming assignments
  const upcomingAssignments = await Assignment.getUpcomingAssignments();

  // Get total submissions
  const totalSubmissions = await Submission.countByStudent(studentId);

  // Get submissions with stats
  const submissions = await Submission.findByStudent(studentId);
  const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;

  // Get violations
  const violations = await Violation.findByStudent(studentId);

  // Calculate assignment progress
  const assignmentProgress = [];
  for (const assignment of allAssignments) {
    const progress = await Submission.getStudentProgress(studentId, assignment.id);
    assignmentProgress.push({
      assignmentId: assignment.id,
      title: assignment.title,
      ...progress,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalAssignments: allAssignments.length,
      activeAssignments: activeAssignments.length,
      upcomingAssignments: upcomingAssignments.length,
      totalSubmissions,
      acceptedSubmissions,
      totalViolations: violations.length,
      assignmentProgress,
      recentSubmissions: submissions.slice(0, 10),
    },
  });
});

// @desc    Get student assignment details
// @route   GET /api/v1/dashboard/student/assignment/:assignmentId
// @access  Private/Student
exports.getStudentAssignmentDetails = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const assignmentId = req.params.assignmentId;

  // Get assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Get problems
  const problems = await Problem.findByAssignmentId(assignmentId);

  // Get student progress
  const progress = await Submission.getStudentProgress(studentId, assignmentId);

  // Get session info
  const session = await AssignmentSession.findByStudentAndAssignment(
    studentId,
    assignmentId
  );

  // Get submissions
  const submissions = await Submission.findByStudent(studentId, { assignmentId });

  // Get violations
  const violations = await Violation.findByStudent(studentId, assignmentId);

  res.status(200).json({
    success: true,
    data: {
      assignment,
      problems,
      progress,
      session,
      submissions,
      violations,
    },
  });
});

// @desc    Get admin dashboard statistics
// @route   GET /api/v1/dashboard/admin/stats
// @access  Private/Admin
exports.getAdminStats = asyncHandler(async (req, res) => {
  // Get total counts
  const totalAssignments = await Assignment.count();
  const totalStudents = await Student.count();
  const activeStudents = await Student.count({ isActive: true });

  // Get active and upcoming assignments
  const activeAssignments = await Assignment.getActiveAssignments();
  const upcomingAssignments = await Assignment.getUpcomingAssignments();

  // Get recent submissions (last 100)
  const recentSubmissions = await Submission.findByStudent(null, {});

  // Calculate submission stats
  const totalSubmissions = recentSubmissions.length;
  const acceptedSubmissions = recentSubmissions.filter(
    s => s.status === 'accepted'
  ).length;
  const pendingSubmissions = recentSubmissions.filter(
    s => s.status === 'pending'
  ).length;

  // Get violation stats
  const recentViolations = await Violation.findByStudent(null);

  res.status(200).json({
    success: true,
    data: {
      totalAssignments,
      activeAssignments: activeAssignments.length,
      upcomingAssignments: upcomingAssignments.length,
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      totalSubmissions,
      acceptedSubmissions,
      pendingSubmissions,
      totalViolations: recentViolations.length,
      recentAssignments: [...activeAssignments, ...upcomingAssignments].slice(0, 5),
    },
  });
});

// @desc    Get admin assignment dashboard
// @route   GET /api/v1/dashboard/admin/assignment/:assignmentId
// @access  Private/Admin
exports.getAdminAssignmentDashboard = asyncHandler(async (req, res) => {
  const assignmentId = req.params.assignmentId;

  // Get assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Assignment not found',
    });
  }

  // Get problems
  const problems = await Problem.findByAssignmentId(assignmentId);

  // Get submissions
  const submissions = await Submission.findByAssignment(assignmentId);

  // Calculate submission stats
  const submissionStats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'accepted').length,
    wrong: submissions.filter(s => s.status === 'wrong_answer').length,
    pending: submissions.filter(s => s.status === 'pending').length,
    error: submissions.filter(s => 
      ['runtime_error', 'compilation_error', 'time_limit_exceeded'].includes(s.status)
    ).length,
  };

  // Get unique students
  const uniqueStudents = [...new Set(submissions.map(s => s.student_id))];

  // Get leaderboard
  const leaderboard = await Submission.getLeaderboard(assignmentId);

  // Get violations
  const violations = await Violation.findByAssignment(assignmentId);
  const violationsSummary = await Violation.getViolationsSummary(assignmentId);

  // Get active sessions
  const activeSessions = await AssignmentSession.getActiveSessions(assignmentId);
  const sessionStats = await AssignmentSession.getSessionStats(assignmentId);

  // Get high risk students
  const highRiskStudents = await Violation.getHighRiskStudents(assignmentId, 3);

  res.status(200).json({
    success: true,
    data: {
      assignment,
      problems,
      submissionStats,
      participatingStudents: uniqueStudents.length,
      leaderboard: leaderboard.slice(0, 10),
      violations: {
        total: violations.length,
        summary: violationsSummary,
        highRiskStudents,
      },
      sessions: {
        active: activeSessions.length,
        stats: sessionStats,
      },
    },
  });
});

// @desc    Get problem statistics
// @route   GET /api/v1/dashboard/admin/problem/:problemId
// @access  Private/Admin
exports.getProblemStats = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId;

  // Get problem
  const problem = await Problem.findById(problemId);
  if (!problem) {
    return res.status(404).json({
      success: false,
      message: 'Problem not found',
    });
  }

  // Get all submissions for this problem
  const { query } = require('../config/db');
  const submissionsResult = await query(
    `SELECT s.*, st.roll_number, st.name as student_name
     FROM submissions s
     JOIN students st ON s.student_id = st.id
     WHERE s.problem_id = $1
     ORDER BY s.submitted_at DESC`,
    [problemId]
  );

  const submissions = submissionsResult.rows;

  // Calculate stats
  const stats = {
    totalSubmissions: submissions.length,
    uniqueStudents: [...new Set(submissions.map(s => s.student_id))].length,
    accepted: submissions.filter(s => s.status === 'accepted').length,
    wrongAnswer: submissions.filter(s => s.status === 'wrong_answer').length,
    runtimeError: submissions.filter(s => s.status === 'runtime_error').length,
    compilationError: submissions.filter(s => s.status === 'compilation_error').length,
    timeLimitExceeded: submissions.filter(s => s.status === 'time_limit_exceeded').length,
  };

  res.status(200).json({
    success: true,
    data: {
      problem,
      stats,
      recentSubmissions: submissions.slice(0, 20),
    },
  });
});