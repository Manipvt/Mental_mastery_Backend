const { query } = require('../config/db');

class Student {
  static async findByRollNumber(rollNumber) {
    const result = await query(
      'SELECT id, roll_number, name, email, password, role, is_active, created_at, updated_at FROM users WHERE UPPER(roll_number) = UPPER($1) AND role = $2',
      [rollNumber, 'student']
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, roll_number, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT id, roll_number, name, email, role, is_active, created_at, updated_at FROM users WHERE role = $1';
    const params = ['student'];
    let paramCount = 2;

    if (filters.isActive !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
      paramCount++;
    }

    sql += ' ORDER BY roll_number ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  static async create(studentData) {
    const result = await query(
      `INSERT INTO users (roll_number, name, email, password, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, roll_number, name, email, role, created_at, updated_at`,
      [
        studentData.rollNumber,
        studentData.name,
        studentData.email,
        studentData.password,
        'student'
      ]
    );
    return result.rows[0];
  }

  static async update(id, studentData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (studentData.name) {
      fields.push(`name = $${paramCount}`);
      params.push(studentData.name);
      paramCount++;
    }

    if (studentData.email) {
      fields.push(`email = $${paramCount}`);
      params.push(studentData.email);
      paramCount++;
    }

    if (studentData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      params.push(studentData.isActive);
      paramCount++;
    }

    if (studentData.password) {
      fields.push(`password = $${paramCount}`);
      params.push(studentData.password);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} AND role = 'student'
       RETURNING id, roll_number, name, email, role, is_active, updated_at`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id',
      [id, 'student']
    );
    return result.rows[0];
  }

  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE role = $1';
    const params = ['student'];
    let paramCount = 2;

    if (filters.branch) {
      sql += ` AND branch = $${paramCount}`;
      params.push(filters.branch);
      paramCount++;
    }

    if (filters.year) {
      sql += ` AND year = $${paramCount}`;
      params.push(filters.year);
      paramCount++;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  static async bulkCreate(studentsData) {
    const values = studentsData.map((student, index) => {
      const offset = index * 8;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
    }).join(', ');

    const params = studentsData.flatMap(s => [
      s.rollNumber, s.name, s.email, s.password, s.branch, s.year, s.section, 'student'
    ]);

    const result = await query(
      `INSERT INTO users (roll_number, name, email, password, branch, year, section, role) 
       VALUES ${values} 
       RETURNING id, roll_number, name, email, branch, year, section`,
      params
    );
    return result.rows;
  }
}

module.exports = Student;