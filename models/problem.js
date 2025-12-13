const { query } = require('../config/db');

class Problem {
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM problems WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.assignmentId !== undefined) {
      if (filters.assignmentId === null) {
        sql += ` AND assignment_id IS NULL`;
      } else {
        sql += ` AND assignment_id = $${paramCount}`;
        params.push(filters.assignmentId);
        paramCount++;
      }
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM problems WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByAssignmentId(assignmentId) {
    // Ensure assignmentId is an integer for proper database comparison
    const assignmentIdInt = parseInt(assignmentId, 10);
    if (isNaN(assignmentIdInt)) {
      return [];
    }
    const result = await query(
      'SELECT * FROM problems WHERE assignment_id = $1 ORDER BY order_index ASC',
      [assignmentIdInt]
    );
    return result.rows;
  }

  static async create(problemData) {
    // Ensure assignmentId is an integer or null
    let assignmentId = null;
    if (problemData.assignmentId) {
      const assignmentIdInt = parseInt(problemData.assignmentId, 10);
      if (!isNaN(assignmentIdInt)) {
        assignmentId = assignmentIdInt;
      }
    }

    const result = await query(
      `INSERT INTO problems (assignment_id, title, description, difficulty, points, time_limit, memory_limit, order_index, constraints, input_format, output_format) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        assignmentId,
        problemData.title,
        problemData.description,
        problemData.difficulty || 'medium',
        problemData.points || 10,
        problemData.timeLimit || 2000,
        problemData.memoryLimit || 256000,
        problemData.orderIndex || 0,
        problemData.constraints || null,
        problemData.inputFormat || null,
        problemData.outputFormat || null
      ]
    );
    return result.rows[0];
  }

  static async update(id, problemData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (problemData.title) {
      fields.push(`title = $${paramCount}`);
      params.push(problemData.title);
      paramCount++;
    }

    if (problemData.description) {
      fields.push(`description = $${paramCount}`);
      params.push(problemData.description);
      paramCount++;
    }

    if (problemData.difficulty) {
      fields.push(`difficulty = $${paramCount}`);
      params.push(problemData.difficulty);
      paramCount++;
    }

    if (problemData.points) {
      fields.push(`points = $${paramCount}`);
      params.push(problemData.points);
      paramCount++;
    }

    if (problemData.timeLimit) {
      fields.push(`time_limit = $${paramCount}`);
      params.push(problemData.timeLimit);
      paramCount++;
    }

    if (problemData.memoryLimit) {
      fields.push(`memory_limit = $${paramCount}`);
      params.push(problemData.memoryLimit);
      paramCount++;
    }

    if (problemData.orderIndex !== undefined) {
      fields.push(`order_index = $${paramCount}`);
      params.push(problemData.orderIndex);
      paramCount++;
    }

    if (problemData.assignmentId !== undefined) {
      if (problemData.assignmentId === null) {
        fields.push(`assignment_id = NULL`);
      } else {
        // Ensure assignmentId is an integer
        const assignmentIdInt = parseInt(problemData.assignmentId, 10);
        if (!isNaN(assignmentIdInt)) {
          fields.push(`assignment_id = $${paramCount}`);
          params.push(assignmentIdInt);
          paramCount++;
        }
      }
    }

    if (problemData.constraints !== undefined) {
      fields.push(`constraints = $${paramCount}`);
      params.push(problemData.constraints);
      paramCount++;
    }

    if (problemData.inputFormat !== undefined) {
      fields.push(`input_format = $${paramCount}`);
      params.push(problemData.inputFormat);
      paramCount++;
    }

    if (problemData.outputFormat !== undefined) {
      fields.push(`output_format = $${paramCount}`);
      params.push(problemData.outputFormat);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE problems SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM problems WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async countByAssignment(assignmentId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM problems WHERE assignment_id = $1',
      [assignmentId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Problem;