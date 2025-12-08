const { query } = require('../config/db');

class AssignmentSession {
  static async findByStudentAndAssignment(studentId, assignmentId) {
    const result = await query(
      'SELECT * FROM assignment_sessions WHERE student_id = $1 AND assignment_id = $2',
      [studentId, assignmentId]
    );
    return result.rows[0];
  }

  static async create(sessionData) {
    const result = await query(
      `INSERT INTO assignment_sessions (student_id, assignment_id, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        sessionData.studentId,
        sessionData.assignmentId,
        sessionData.ipAddress || null,
        sessionData.userAgent || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, sessionData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (sessionData.endedAt !== undefined) {
      fields.push(`ended_at = $${paramCount}`);
      params.push(sessionData.endedAt);
      paramCount++;
    }

    if (sessionData.isLocked !== undefined) {
      fields.push(`is_locked = $${paramCount}`);
      params.push(sessionData.isLocked);
      paramCount++;
    }

    if (sessionData.isSubmitted !== undefined) {
      fields.push(`is_submitted = $${paramCount}`);
      params.push(sessionData.isSubmitted);
      paramCount++;
    }

    if (sessionData.violationCount !== undefined) {
      fields.push(`violation_count = $${paramCount}`);
      params.push(sessionData.violationCount);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE assignment_sessions SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async incrementViolationCount(studentId, assignmentId) {
    const result = await query(
      `UPDATE assignment_sessions 
       SET violation_count = violation_count + 1 
       WHERE student_id = $1 AND assignment_id = $2 
       RETURNING *`,
      [studentId, assignmentId]
    );
    return result.rows[0];
  }

  static async lockSession(studentId, assignmentId) {
    const result = await query(
      `UPDATE assignment_sessions 
       SET is_locked = true, ended_at = CURRENT_TIMESTAMP 
       WHERE student_id = $1 AND assignment_id = $2 
       RETURNING *`,
      [studentId, assignmentId]
    );
    return result.rows[0];
  }

  static async getActiveSessions(assignmentId) {
    const result = await query(
      `SELECT ass.*, st.roll_number, st.name as student_name
       FROM assignment_sessions ass
       JOIN students st ON ass.student_id = st.id
       WHERE ass.assignment_id = $1 
         AND ass.is_locked = false 
         AND ass.ended_at IS NULL
       ORDER BY ass.started_at DESC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async getSessionStats(assignmentId) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_sessions,
         COUNT(CASE WHEN is_locked = true THEN 1 END) as locked_sessions,
         COUNT(CASE WHEN is_submitted = true THEN 1 END) as submitted_sessions,
         AVG(violation_count) as avg_violations
       FROM assignment_sessions
       WHERE assignment_id = $1`,
      [assignmentId]
    );
    return result.rows[0];
  }
}

module.exports = AssignmentSession;