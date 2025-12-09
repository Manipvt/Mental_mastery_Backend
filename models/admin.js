const { query } = require('../config/db');

class Admin {
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, 'admin']
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, username, name, email, role, is_active, created_at FROM users WHERE id = $1 AND role = $2',
      [id, 'admin']
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT id, username, name, email, role, is_active, created_at FROM users WHERE role = $1';
    const params = ['admin'];
    let paramCount = 2;

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async create(adminData) {
    const result = await query(
      `INSERT INTO users (username, name, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, name, email, role, created_at`,
      [adminData.username, adminData.name, adminData.email, adminData.password, 'admin']
    );
    return result.rows[0];
  }

  static async update(id, adminData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (adminData.name) {
      fields.push(`name = $${paramCount}`);
      params.push(adminData.name);
      paramCount++;
    }

    if (adminData.email) {
      fields.push(`email = $${paramCount}`);
      params.push(adminData.email);
      paramCount++;
    }

    if (adminData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      params.push(adminData.isActive);
      paramCount++;
    }

    if (adminData.password) {
      fields.push(`password = $${paramCount}`);
      params.push(adminData.password);
      paramCount++;
    }

    params.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} AND role = 'admin'
       RETURNING id, username, name, email, role, is_active`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id',
      [id, 'admin']
    );
    return result.rows[0];
  }

  static async count() {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = Admin;
