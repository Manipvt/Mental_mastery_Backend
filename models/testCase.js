const { query } = require('../config/db');

class TestCase {
  static async findById(id) {
    const result = await query(
      'SELECT * FROM test_cases WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByProblemId(problemId, includeHidden = false) {
    let sql = 'SELECT * FROM test_cases WHERE problem_id = $1';

    if (!includeHidden) {
      sql += ' AND is_hidden = false';
    }

    // order_index column does not exist in schema; fall back to id ordering
    sql += ' ORDER BY id ASC';

    const result = await query(sql, [problemId]);
    return result.rows;
  }

  static async getSampleTestCases(problemId) {
    const result = await query(
      'SELECT * FROM test_cases WHERE problem_id = $1 AND is_sample = true ORDER BY id ASC',
      [problemId]
    );
    return result.rows;
  }

  static async create(testCaseData) {
    const result = await query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, is_hidden, points) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        testCaseData.problemId,
        testCaseData.input,
        testCaseData.expectedOutput,
        testCaseData.isSample || false,
        testCaseData.isHidden || false,
        testCaseData.points || 1
      ]
    );
    return result.rows[0];
  }

  static async update(id, testCaseData) {
    const fields = [];
    const params = [];
    let paramCount = 1;

    if (testCaseData.input !== undefined) {
      fields.push(`input = $${paramCount}`);
      params.push(testCaseData.input);
      paramCount++;
    }

    if (testCaseData.expectedOutput !== undefined) {
      fields.push(`expected_output = $${paramCount}`);
      params.push(testCaseData.expectedOutput);
      paramCount++;
    }

    if (testCaseData.isSample !== undefined) {
      fields.push(`is_sample = $${paramCount}`);
      params.push(testCaseData.isSample);
      paramCount++;
    }

    if (testCaseData.isHidden !== undefined) {
      fields.push(`is_hidden = $${paramCount}`);
      params.push(testCaseData.isHidden);
      paramCount++;
    }

    if (testCaseData.points !== undefined) {
      fields.push(`points = $${paramCount}`);
      params.push(testCaseData.points);
      paramCount++;
    }

    if (fields.length === 0) {
      return null;
    }

    params.push(id);

    const result = await query(
      `UPDATE test_cases SET ${fields.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await query(
      'DELETE FROM test_cases WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  static async bulkCreate(testCasesData) {
    const values = testCasesData.map((tc, index) => {
      const offset = index * 6;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    }).join(', ');

    const params = testCasesData.flatMap(tc => [
      tc.problemId,
      tc.input,
      tc.expectedOutput,
      tc.isSample || false,
      tc.isHidden || false,
      tc.points || 1
    ]);

    const result = await query(
      `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, is_hidden, points) 
       VALUES ${values} 
       RETURNING *`,
      params
    );
    return result.rows;
  }

  static async countByProblem(problemId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM test_cases WHERE problem_id = $1',
      [problemId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = TestCase;