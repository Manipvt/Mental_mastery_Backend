const { query } = require('../config/db');

class User {
  static async findByRollNumber(rollNumber) {
    const result = await query(
      'SELECT * FROM users WHERE roll_number = $1',
      [rollNumber]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, roll_number, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT id, roll_number, name, email, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.role) {
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async create(userData) {
    const result = await query(
      `INSERT INTO users (roll_number, name, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, roll_number, name, email, role, created_at`,
      [userData.rollNumber, userData.name, userData.email, userData.password, userData.role || 'student']
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (userData.name) {
      fields.push(`name = $${paramCount}`);
      params.push(userData.name);
      paramCount++;
    }

    if (userData.email) {
      fields.push(`email = $${paramCount}`);
      params.push(userData.email);
      paramCount++;
    }

    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      params.push(userData.isActive);
      paramCount++;
    }

    if (userData.password) {
      fields.push(`password = $${paramCount}`);
      params.push(userData.password);
      paramCount++;
    }

    params.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, roll_number, name, email, role, is_active`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async countByRole(role) {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      [role]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = User;