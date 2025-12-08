const { query } = require('../config/db');

class Violation {
  static async create(violationData) {
    const result = await query(
      `INSERT INTO violations (student_id, assignment_id, violation_type, description, severity, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        violationData.studentId,
        violationData.assignmentId,
        violationData.violationType,
        violationData.description || null,
        violationData.severity || 'medium',
        violationData.metadata ? JSON.stringify(violationData.metadata) : null
      ]
    );
    return result.rows[0];
  }

  static async findByStudent(studentId, assignmentId = null) {
    let sql = `SELECT v.*, a.title as assignment_title 
               FROM violations v
               LEFT JOIN assignments a ON v.assignment_id = a.id
               WHERE v.student_id = $1`;
    const params = [studentId];

    if (assignmentId) {
      sql += ' AND v.assignment_id = $2';
      params.push(assignmentId);
    }

    sql += ' ORDER BY v.detected_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async findByAssignment(assignmentId) {
    const result = await query(
      `SELECT v.*, st.roll_number, st.name as student_name
       FROM violations v
       LEFT JOIN students st ON v.student_id = st.id
       WHERE v.assignment_id = $1
       ORDER BY v.detected_at DESC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async countByStudent(studentId, assignmentId) {
    const result = await query(
      `SELECT COUNT(*) as count 
       FROM violations 
       WHERE student_id = $1 AND assignment_id = $2`,
      [studentId, assignmentId]
    );
    return parseInt(result.rows[0].count);
  }

  static async getViolationsSummary(assignmentId) {
    const result = await query(
      `SELECT 
         violation_type,
         COUNT(*) as count,
         COUNT(DISTINCT student_id) as affected_students
       FROM violations
       WHERE assignment_id = $1
       GROUP BY violation_type
       ORDER BY count DESC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async getHighRiskStudents(assignmentId, threshold = 3) {
    const result = await query(
      `SELECT 
         st.roll_number,
         st.name,
         COUNT(v.id) as violation_count,
         MAX(v.detected_at) as last_violation
       FROM violations v
       JOIN students st ON v.student_id = st.id
       WHERE v.assignment_id = $1
       GROUP BY st.id, st.roll_number, st.name
       HAVING COUNT(v.id) >= $2
       ORDER BY violation_count DESC`,
      [assignmentId, threshold]
    );
    return result.rows;
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM violations WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Violation;