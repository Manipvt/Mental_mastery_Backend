const Assignment = require('../models/assignment');
const Problem = require('../models/problem');
const Submission = require('../models/submission');
const ErrorResponse = require('../utils/errorResponse');

class AssignmentService {
  async getAllAssignments(filters = {}) {
    return await Assignment.findAll(filters);
  }

  async getAssignmentById(id, includeProblems = false) {
    // Ensure id is an integer
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      throw new ErrorResponse('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(idInt);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    if (includeProblems) {
      const problems = await Problem.findByAssignmentId(idInt);
      assignment.problems = problems;
      assignment.problemCount = problems.length;
    }

    return assignment;
  }

  async createAssignment(assignmentData, adminId) {
    // Validate dates
    const startTime = new Date(assignmentData.startTime);
    const endTime = new Date(assignmentData.endTime);

    if (endTime <= startTime) {
      throw new ErrorResponse('End time must be after start time', 400);
    }

    assignmentData.createdBy = adminId;
    return await Assignment.create(assignmentData);
  }

  async updateAssignment(id, assignmentData) {
    // Ensure id is an integer
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      throw new ErrorResponse('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(idInt);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Validate dates if both are provided
    if (assignmentData.startTime && assignmentData.endTime) {
      const startTime = new Date(assignmentData.startTime);
      const endTime = new Date(assignmentData.endTime);

      if (endTime <= startTime) {
        throw new ErrorResponse('End time must be after start time', 400);
      }
    }

    return await Assignment.update(idInt, assignmentData);
  }

  async deleteAssignment(id) {
    // Ensure id is an integer
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      throw new ErrorResponse('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(idInt);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Check if there are submissions
    const submissions = await Submission.findByAssignment(idInt);
    if (submissions.length > 0) {
      throw new ErrorResponse(
        'Cannot delete assignment with existing submissions. Please delete all submissions first.',
        400
      );
    }

    // Unassign all problems from this assignment before deleting
    // This prevents orphaned problems and allows clean deletion
    const problems = await Problem.findByAssignmentId(idInt);
    for (const problem of problems) {
      await Problem.update(problem.id, { assignmentId: null });
    }

    return await Assignment.delete(idInt);
  }

  async getActiveAssignments() {
    return await Assignment.getActiveAssignments();
  }

  async getUpcomingAssignments() {
    return await Assignment.getUpcomingAssignments();
  }

  async toggleAssignmentStatus(id, isActive) {
    // Ensure id is an integer
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      throw new ErrorResponse('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(idInt);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    return await Assignment.update(idInt, { isActive });
  }

  async getAssignmentStats(id) {
    // Ensure id is an integer
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      throw new ErrorResponse('Invalid assignment ID', 400);
    }

    const assignment = await Assignment.findById(idInt);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    const problems = await Problem.findByAssignmentId(idInt);
    const submissions = await Submission.findByAssignment(idInt);

    const uniqueStudents = new Set(submissions.map(s => s.user_id));
    const acceptedSubmissions = submissions.filter(s => s.status === 'accepted');

    return {
      assignment,
      problemCount: problems.length,
      totalSubmissions: submissions.length,
      uniqueStudents: uniqueStudents.size,
      acceptedSubmissions: acceptedSubmissions.length,
    };
  }

  async getStudentAssignments(studentId) {
    // Show all active assignments regardless of start/end time window
    const allAssignments = await Assignment.findAll({ isActive: true });
    const assignmentsWithProgress = [];

    for (const assignment of allAssignments) {
      const progress = await Submission.getStudentProgress(studentId, assignment.id);
      assignmentsWithProgress.push({
        ...assignment,
        progress,
      });
    }

    return assignmentsWithProgress;
  }

  async checkAssignmentAccess(studentId, assignmentId) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    const now = new Date();
    const startTime = new Date(assignment.start_time);
    const endTime = new Date(assignment.end_time);

    if (!assignment.is_active) {
      throw new ErrorResponse('Assignment is not active', 403);
    }

    if (now < startTime) {
      throw new ErrorResponse('Assignment has not started yet', 403);
    }

    if (now > endTime) {
      throw new ErrorResponse('Assignment has ended', 403);
    }

    return { hasAccess: true, assignment };
  }
}

module.exports = new AssignmentService();