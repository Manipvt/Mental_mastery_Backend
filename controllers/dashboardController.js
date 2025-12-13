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
  const { query } = require('../config/db');
  
  // Get total counts
  const totalAssignments = await Assignment.count();
  const totalStudents = await Student.count();
  const activeStudents = await Student.count({ isActive: true });

  // Get active and upcoming assignments
  const activeAssignments = await Assignment.getActiveAssignments();
  const upcomingAssignments = await Assignment.getUpcomingAssignments();

  // Get total problems count
  const problemsResult = await query('SELECT COUNT(*) as count FROM problems');
  const totalProblems = parseInt(problemsResult.rows[0].count);

  // Get recent submissions with student info (last 10)
  const recentSubmissionsResult = await query(
    `SELECT s.*, u.name as student_name, u.roll_number, 
            p.title as problem_title, a.title as assignment_title
     FROM submissions s
     LEFT JOIN users u ON s.user_id = u.id
     LEFT JOIN problems p ON s.problem_id = p.id
     LEFT JOIN assignments a ON s.assignment_id = a.id
     ORDER BY s.submitted_at DESC
     LIMIT 10`
  );
  const recentSubmissions = recentSubmissionsResult.rows;

  // Get all submissions for stats
  const allSubmissionsResult = await query('SELECT status FROM submissions');
  const allSubmissions = allSubmissionsResult.rows;

  // Calculate submission stats
  const totalSubmissions = allSubmissions.length;
  const acceptedSubmissions = allSubmissions.filter(
    s => s.status === 'accepted'
  ).length;
  const pendingSubmissions = allSubmissions.filter(
    s => s.status === 'pending'
  ).length;

  // Get violation stats (all violations)
  const violationsResult = await query('SELECT COUNT(*) as count FROM violations');
  const totalViolations = parseInt(violationsResult.rows[0].count);

  res.status(200).json({
    success: true,
    data: {
      totalAssignments,
      activeAssignments: activeAssignments.length,
      upcomingAssignments: upcomingAssignments.length,
      totalProblems,
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      totalSubmissions,
      acceptedSubmissions,
      pendingSubmissions,
      totalViolations,
      recentAssignments: [...activeAssignments, ...upcomingAssignments].slice(0, 5),
      recentSubmissions,
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
  const uniqueStudents = [...new Set(submissions.map(s => s.user_id))];

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
    `SELECT s.*, u.roll_number, u.name as student_name
     FROM submissions s
     JOIN users u ON s.user_id = u.id
     WHERE s.problem_id = $1
     ORDER BY s.submitted_at DESC`,
    [problemId]
  );

  const submissions = submissionsResult.rows;

  // Calculate stats
  const stats = {
    totalSubmissions: submissions.length,
    uniqueStudents: [...new Set(submissions.map(s => s.user_id))].length,
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

// @desc    Get user report (student performance report)
// @route   GET /api/v1/dashboard/admin/user/:studentId/report
// @access  Private/Admin
exports.getUserReport = asyncHandler(async (req, res) => {
  const { query } = require('../config/db');
  const studentId = req.params.studentId;

  // Get student info
  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Get all submissions for this student
  const submissions = await Submission.findByStudent(studentId);
  
  // Get accepted submissions (problems solved)
  const acceptedSubmissions = submissions.filter(s => s.status === 'accepted');
  const uniqueSolvedProblems = [...new Set(acceptedSubmissions.map(s => s.problem_id))];
  
  // Get all assignments
  const allAssignments = await Assignment.findAll({ isActive: true });
  
  // Calculate assignment completion
  const assignmentProgress = [];
  for (const assignment of allAssignments) {
    const progress = await Submission.getStudentProgress(studentId, assignment.id);
    const problems = await Problem.findByAssignmentId(assignment.id);
    const solvedProblems = await Submission.findAcceptedProblemsByStudent(studentId, assignment.id);
    
    assignmentProgress.push({
      assignmentId: assignment.id,
      title: assignment.title,
      totalProblems: problems.length,
      solvedProblems: solvedProblems.length,
      isCompleted: problems.length > 0 && solvedProblems.length === problems.length,
      progress: problems.length > 0 ? (solvedProblems.length / problems.length) * 100 : 0,
      ...progress,
    });
  }

  const completedAssignments = assignmentProgress.filter(a => a.isCompleted).length;

  // Get violations
  const violations = await Violation.findByStudent(studentId);
  
  // Group violations by type
  const violationsByType = violations.reduce((acc, v) => {
    const type = v.violation_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Get violation details with assignment info
  const violationDetails = violations.map(v => ({
    id: v.id,
    type: v.violation_type,
    description: v.description,
    severity: v.severity,
    detectedAt: v.detected_at,
    assignmentTitle: v.assignment_title,
    metadata: v.metadata ? (typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata) : null,
  }));

  // Calculate statistics
  const stats = {
    totalProblemsSolved: uniqueSolvedProblems.length,
    totalSubmissions: submissions.length,
    acceptedSubmissions: acceptedSubmissions.length,
    totalAssignments: allAssignments.length,
    completedAssignments,
    totalViolations: violations.length,
    violationTypes: violationsByType,
    submissionSuccessRate: submissions.length > 0 
      ? ((acceptedSubmissions.length / submissions.length) * 100).toFixed(2) 
      : 0,
  };

  res.status(200).json({
    success: true,
    data: {
      student: {
        id: student.id,
        rollNumber: student.roll_number,
        name: student.name,
        email: student.email,
        isActive: student.is_active,
      },
      stats,
      assignmentProgress,
      violations: violationDetails,
      recentSubmissions: submissions.slice(0, 10),
    },
  });
});

// @desc    Get all students with summary stats
// @route   GET /api/v1/dashboard/admin/students
// @access  Private/Admin
exports.getAllStudentsReport = asyncHandler(async (req, res) => {
  const { query } = require('../config/db');
  
  // Get all active students
  const students = await Student.findAll({ isActive: true });
  
  // Get summary stats for each student
  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      const submissions = await Submission.findByStudent(student.id);
      const acceptedSubmissions = submissions.filter(s => s.status === 'accepted');
      const uniqueSolvedProblems = [...new Set(acceptedSubmissions.map(s => s.problem_id))];
      const violations = await Violation.findByStudent(student.id);
      
      // Get assignment completion count
      const allAssignments = await Assignment.findAll({ isActive: true });
      let completedCount = 0;
      for (const assignment of allAssignments) {
        const solvedProblems = await Submission.findAcceptedProblemsByStudent(student.id, assignment.id);
        const problems = await Problem.findByAssignmentId(assignment.id);
        if (problems.length > 0 && solvedProblems.length === problems.length) {
          completedCount++;
        }
      }

      return {
        id: student.id,
        rollNumber: student.roll_number,
        name: student.name,
        email: student.email,
        stats: {
          problemsSolved: uniqueSolvedProblems.length,
          assignmentsCompleted: completedCount,
          totalSubmissions: submissions.length,
          violationsCount: violations.length,
        },
      };
    })
  );

  res.status(200).json({
    success: true,
    count: studentsWithStats.length,
    data: studentsWithStats,
  });
});