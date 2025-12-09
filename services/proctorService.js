const Violation = require('../models/violation');
const AssignmentSession = require('../models/assignmentSession');
const Assignment = require('../models/assignment');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/logger');

class ProctorService {
  async startSession(studentId, assignmentId, metadata = {}) {
    // Check if assignment exists and is accessible
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    if (!assignment.is_active) {
      throw new ErrorResponse('Assignment is not active', 403);
    }

    const now = new Date();
    const startTime = new Date(assignment.start_time);
    const endTime = new Date(assignment.end_time);

    if (now < startTime) {
      throw new ErrorResponse('Assignment has not started yet', 403);
    }

    if (now > endTime) {
      throw new ErrorResponse('Assignment has ended', 403);
    }

    // Check if session already exists
    let session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (session) {
      if (session.is_locked) {
        throw new ErrorResponse('Your session is locked due to violations', 403);
      }

      if (session.is_submitted) {
        throw new ErrorResponse('You have already submitted this assignment', 403);
      }

      // Return existing session
      return session;
    }

    // Create new session
    session = await AssignmentSession.create({
      studentId,
      assignmentId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    logger.info(`Session started for student ${studentId} on assignment ${assignmentId}`);

    return session;
  }

  async recordViolation(violationData, studentId) {
    // Validate assignment
    const assignment = await Assignment.findById(violationData.assignmentId);
    if (!assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Get or create session
    let session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      violationData.assignmentId
    );

    if (!session) {
      throw new ErrorResponse('Session not found. Please start the assignment first', 403);
    }

    if (session.is_locked) {
      throw new ErrorResponse('Session is already locked', 403);
    }

    // Create violation record
    const violation = await Violation.create({
      ...violationData,
      studentId,
    });

    // Increment violation count in session
    session = await AssignmentSession.incrementViolationCount(
      studentId,
      violationData.assignmentId
    );

    logger.warn(
      `Violation recorded: ${violationData.violationType} for student ${studentId} on assignment ${violationData.assignmentId}`
    );

    // Auto-lock if violations exceed threshold
    const maxViolations = assignment.max_violations || 5;
    
    if (session.violation_count >= maxViolations) {
      await AssignmentSession.lockSession(studentId, violationData.assignmentId);
      
      logger.warn(
        `Session locked for student ${studentId} on assignment ${violationData.assignmentId} due to ${session.violation_count} violations`
      );

      return {
        violation,
        sessionLocked: true,
        message: `Session locked due to ${session.violation_count} violations. Maximum allowed: ${maxViolations}`,
        violationCount: session.violation_count,
        maxViolations,
      };
    }

    return {
      violation,
      sessionLocked: false,
      violationCount: session.violation_count,
      maxViolations,
      remainingViolations: maxViolations - session.violation_count,
    };
  }

  async getViolations(studentId, assignmentId = null) {
    return await Violation.findByStudent(studentId, assignmentId);
  }

  async getAssignmentViolations(assignmentId) {
    return await Violation.findByAssignment(assignmentId);
  }

  async getViolationsSummary(assignmentId) {
    const summary = await Violation.getViolationsSummary(assignmentId);
    const highRiskStudents = await Violation.getHighRiskStudents(assignmentId, 3);

    return {
      summary,
      highRiskStudents,
      totalHighRiskStudents: highRiskStudents.length,
    };
  }

  async getHighRiskStudents(assignmentId, threshold = 3) {
    return await Violation.getHighRiskStudents(assignmentId, threshold);
  }

  async endSession(studentId, assignmentId) {
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (!session) {
      throw new ErrorResponse('Session not found', 404);
    }

    if (session.is_locked) {
      throw new ErrorResponse('Session is locked and cannot be ended normally', 403);
    }

    if (session.is_submitted) {
      throw new ErrorResponse('Session already ended', 400);
    }

    const updatedSession = await AssignmentSession.update(session.id, {
      endedAt: new Date(),
      isSubmitted: true,
    });

    logger.info(`Session ended for student ${studentId} on assignment ${assignmentId}`);

    return updatedSession;
  }

  async getSessionInfo(studentId, assignmentId) {
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (!session) {
      return null;
    }

    const assignment = await Assignment.findById(assignmentId);
    const violations = await Violation.findByStudent(studentId, assignmentId);

    return {
      session,
      violationCount: session.violation_count,
      maxViolations: assignment.max_violations,
      isLocked: session.is_locked,
      isSubmitted: session.is_submitted,
      violations,
    };
  }

  async getActiveSessions(assignmentId) {
    return await AssignmentSession.getActiveSessions(assignmentId);
  }

  async getSessionStats(assignmentId) {
    return await AssignmentSession.getSessionStats(assignmentId);
  }

  async unlockSession(studentId, assignmentId, adminId) {
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (!session) {
      throw new ErrorResponse('Session not found', 404);
    }

    if (!session.is_locked) {
      throw new ErrorResponse('Session is not locked', 400);
    }

    const updatedSession = await AssignmentSession.update(session.id, {
      isLocked: false,
    });

    logger.info(
      `Session unlocked by admin ${adminId} for student ${studentId} on assignment ${assignmentId}`
    );

    return updatedSession;
  }

  async lockSession(studentId, assignmentId, adminId, reason = null) {
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (!session) {
      throw new ErrorResponse('Session not found', 404);
    }

    if (session.is_locked) {
      throw new ErrorResponse('Session is already locked', 400);
    }

    const updatedSession = await AssignmentSession.lockSession(studentId, assignmentId);

    // Record violation if reason provided
    if (reason) {
      await Violation.create({
        studentId,
        assignmentId,
        violationType: 'manual_lock',
        description: `Manually locked by admin: ${reason}`,
        severity: 'high',
        metadata: { adminId, reason },
      });
    }

    logger.info(
      `Session manually locked by admin ${adminId} for student ${studentId} on assignment ${assignmentId}`
    );

    return updatedSession;
  }

  async clearViolations(studentId, assignmentId, adminId) {
    const violations = await Violation.findByStudent(studentId, assignmentId);

    for (const violation of violations) {
      await Violation.delete(violation.id);
    }

    // Reset violation count in session
    const session = await AssignmentSession.findByStudentAndAssignment(
      studentId,
      assignmentId
    );

    if (session) {
      await AssignmentSession.update(session.id, {
        violationCount: 0,
      });
    }

    logger.info(
      `Violations cleared by admin ${adminId} for student ${studentId} on assignment ${assignmentId}`
    );

    return {
      message: 'Violations cleared successfully',
      clearedCount: violations.length,
    };
  }
}

module.exports = new ProctorService();