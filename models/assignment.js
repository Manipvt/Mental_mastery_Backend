const { query } = require('../config/db');

class Assignment {
  static async findAll(filters = {}) {
    let sql = `
      SELECT a.*, u.name as created_by_name, u.roll_number as created_by_roll 
      FROM assignments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.isActive !== undefined) {
      sql += ` AND a.is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    sql += ' ORDER BY a.created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT a.*, u.name as created_by_name, u.roll_number as created_by_roll
       FROM assignments a 
       LEFT JOIN users u ON a.created_by = u.id 
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async create(assignmentData) {
    const result = await query(
      `INSERT INTO assignments (title, description, start_time, end_time, duration_minutes, is_active, allow_multiple_submissions, max_violations, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        assignmentData.title,
        assignmentData.description,
        assignmentData.startTime,
        assignmentData.endTime,
        assignmentData.durationMinutes,
        assignmentData.isActive !== undefined ? assignmentData.isActive : true,
        assignmentData.allowMultipleSubmissions || false,
        assignmentData.maxViolations || 5,
        assignmentData.createdBy
      ]
    );
    return result.rows[0];
  }

  static async update(id, assignmentData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (assignmentData.title) {
      fields.push(`title = $${paramCount}`);
      params.push(assignmentData.title);
      paramCount++;
    }

    if (assignmentData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      params.push(assignmentData.description);
      paramCount++;
    }

    if (assignmentData.startTime) {
      fields.push(`start_time = $${paramCount}`);
      params.push(assignmentData.startTime);
      paramCount++;
    }

    if (assignmentData.endTime) {
      fields.push(`end_time = $${paramCount}`);
      params.push(assignmentData.endTime);
      paramCount++;
    }

    if (assignmentData.durationMinutes) {
      fields.push(`duration_minutes = $${paramCount}`);
      params.push(assignmentData.durationMinutes);
      paramCount++;
    }

    if (assignmentData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      params.push(assignmentData.isActive);
      paramCount++;
    }

    if (assignmentData.allowMultipleSubmissions !== undefined) {
      fields.push(`allow_multiple_submissions = $${paramCount}`);
      params.push(assignmentData.allowMultipleSubmissions);
      paramCount++;
    }

    if (assignmentData.maxViolations !== undefined) {
      fields.push(`max_violations = $${paramCount}`);
      params.push(assignmentData.maxViolations);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE assignments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM assignments WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async getActiveAssignments() {
    const result = await query(
      `SELECT * FROM assignments 
       WHERE is_active = true 
       AND start_time <= CURRENT_TIMESTAMP 
       AND end_time >= CURRENT_TIMESTAMP 
       ORDER BY start_time ASC`
    );
    return result.rows;
  }

  static async getUpcomingAssignments() {
    const result = await query(
      `SELECT * FROM assignments 
       WHERE is_active = true 
       AND start_time > CURRENT_TIMESTAMP 
       ORDER BY start_time ASC`
    );
    return result.rows;
  }

  static async count() {
    const result = await query('SELECT COUNT(*) as count FROM assignments');
    return parseInt(result.rows[0].count);
  }
}

module.exports = Assignment;