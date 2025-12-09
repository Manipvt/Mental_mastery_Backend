const { query } = require('../config/db');

class Submission {
  static async findById(id) {
    const result = await query(
      `SELECT s.*, u.name as student_name, u.roll_number, 
              p.title as problem_title, a.title as assignment_title
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN problems p ON s.problem_id = p.id
       LEFT JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByStudentAndProblem(studentId, problemId) {
    const result = await query(
      `SELECT * FROM submissions 
       WHERE user_id = $1 AND problem_id = $2 
       ORDER BY submitted_at DESC`,
      [studentId, problemId]
    );
    return result.rows;
  }

  static async findByStudent(studentId, filters = {}) {
    let sql = `SELECT s.*, p.title as problem_title, a.title as assignment_title
               FROM submissions s
               LEFT JOIN problems p ON s.problem_id = p.id
               LEFT JOIN assignments a ON s.assignment_id = a.id
               WHERE s.user_id = $1`;
    const params = [studentId];
    let paramCount = 2;

    if (filters.assignmentId) {
      sql += ` AND s.assignment_id = $${paramCount}`;
      params.push(filters.assignmentId);
      paramCount++;
    }

    if (filters.status) {
      sql += ` AND s.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    sql += ' ORDER BY s.submitted_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async findByAssignment(assignmentId) {
    const result = await query(
      `SELECT s.*, u.name as student_name, u.roll_number, p.title as problem_title
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN problems p ON s.problem_id = p.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async create(submissionData) {
    const result = await query(
      `INSERT INTO submissions (user_id, assignment_id, problem_id, code, language, status, judge0_token) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        submissionData.studentId || submissionData.userId,
        submissionData.assignmentId,
        submissionData.problemId,
        submissionData.code,
        submissionData.language,
        submissionData.status || 'pending',
        submissionData.judge0Token || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, submissionData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (submissionData.status) {
      fields.push(`status = $${paramCount}`);
      params.push(submissionData.status);
      paramCount++;
    }

    if (submissionData.score !== undefined) {
      fields.push(`score = $${paramCount}`);
      params.push(submissionData.score);
      paramCount++;
    }

    if (submissionData.executionTime !== undefined) {
      fields.push(`execution_time = $${paramCount}`);
      params.push(submissionData.executionTime);
      paramCount++;
    }

    if (submissionData.memoryUsed !== undefined) {
      fields.push(`memory_used = $${paramCount}`);
      params.push(submissionData.memoryUsed);
      paramCount++;
    }

    if (submissionData.testCasesPassed !== undefined) {
      fields.push(`test_cases_passed = $${paramCount}`);
      params.push(submissionData.testCasesPassed);
      paramCount++;
    }

    if (submissionData.totalTestCases !== undefined) {
      fields.push(`total_test_cases = $${paramCount}`);
      params.push(submissionData.totalTestCases);
      paramCount++;
    }

    if (submissionData.errorMessage !== undefined) {
      fields.push(`error_message = $${paramCount}`);
      params.push(submissionData.errorMessage);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE submissions SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async getLeaderboard(assignmentId) {
    const result = await query(
      `SELECT u.roll_number, u.name, 
              SUM(s.score) as total_score,
              COUNT(DISTINCT s.problem_id) as problems_solved,
              MAX(s.submitted_at) as last_submission
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.assignment_id = $1 AND s.status = 'accepted'
       GROUP BY u.id, u.roll_number, u.name
       ORDER BY total_score DESC, last_submission ASC`,
      [assignmentId]
    );
    return result.rows;
  }

  static async getStudentProgress(studentId, assignmentId) {
    const result = await query(
      `SELECT 
         COUNT(DISTINCT p.id) as total_problems,
         COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.problem_id END) as solved_problems,
         SUM(CASE WHEN s.status = 'accepted' THEN s.score ELSE 0 END) as total_score
       FROM problems p
       LEFT JOIN submissions s ON p.id = s.problem_id AND s.user_id = $1
       WHERE p.assignment_id = $2`,
      [studentId, assignmentId]
    );
    return result.rows[0];
  }

  static async countByStudent(studentId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM submissions WHERE user_id = $1',
      [studentId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Submission;