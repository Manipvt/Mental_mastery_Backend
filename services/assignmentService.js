const Assignment = require('../models/assignment');
const Problem = require('../models/problem');
const Submission = require('../models/submission');
const ErrorResponse = require('../utils/errorResponse');

class AssignmentService {
  async getAllAssignments(filters = {}) {
    return await Assignment.findAll(filters);
  }

  async getAssignmentById(id, includeProblems = false) {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    if (includeProblems) {
      const problems = await Problem.findByAssignmentId(id);
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
    const assignment = await Assignment.findById(id);
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

    return await Assignment.update(id, assignmentData);
  }

  async deleteAssignment(id) {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Check if there are submissions
    const submissions = await Submission.findByAssignment(id);
    if (submissions.length > 0) {
      throw new ErrorResponse(
        'Cannot delete assignment with existing submissions',
        400
      );
    }

    return await Assignment.delete(id);
  }

  async getActiveAssignments() {
    return await Assignment.getActiveAssignments();
  }

  async getUpcomingAssignments() {
    return await Assignment.getUpcomingAssignments();
  }

  async toggleAssignmentStatus(id, isActive) {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    return await Assignment.update(id, { isActive });
  }

  async getAssignmentStats(id) {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    const problems = await Problem.findByAssignmentId(id);
    const submissions = await Submission.findByAssignment(id);

    const uniqueStudents = new Set(submissions.map(s => s.student_id));
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