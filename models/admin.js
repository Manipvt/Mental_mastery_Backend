const { query } = require('../config/db');

class Admin {
  static async findByUsername(identifier) {
    // First try to find by roll_number (which is what we use for admin login)
    const result = await query(
      'SELECT * FROM users WHERE (roll_number = $1 OR email = $1) AND role = $2',
      [identifier, 'admin']
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT id, name, email, roll_number, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND role = $2',
        [id, 'admin']
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in Admin.findById:', error);
      throw error;
    }
  }

  static async findByRollNumber(rollNumber) {
    try {
      console.log(`Searching for admin with roll_number: ${rollNumber}`);
      const result = await query(
        'SELECT * FROM users WHERE roll_number = $1 AND role = $2',
        [rollNumber, 'admin']
      );
      console.log(`Found admin:`, result.rows[0] ? 'Yes' : 'No');
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByRollNumber:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT id, roll_number, name, email, role, is_active, created_at, updated_at FROM users WHERE role = $1';
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
      `INSERT INTO users (roll_number, name, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, roll_number, name, email, role, created_at`,
      [adminData.rollNumber || adminData.roll_number, adminData.name, adminData.email, adminData.password, 'admin']
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
       RETURNING id, roll_number, name, email, role, is_active`,
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
