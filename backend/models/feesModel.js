const { query } = require('../config/db');

const FeesModel = {
  /**
   * Create a fee record
   */
  create: async ({ student_id, amount, status, payment_date, payment_method }) => {
    const sql = `
      INSERT INTO fees (student_id, amount, status, payment_date, payment_method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      student_id, amount, status || 'pending', payment_date || null, payment_method || null,
    ]);
    return rows[0];
  },

  /**
   * Find all fees with student info
   */
  findAll: async ({ student_id, status, limit = 50, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (student_id) { conditions.push(`f.student_id = $${idx++}`); params.push(student_id); }
    if (status)     { conditions.push(`f.status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT f.*, u.name AS student_name, s.roll_number, s.department
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count fees
   */
  count: async ({ student_id, status } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (student_id) { conditions.push(`student_id = $${idx++}`); params.push(student_id); }
    if (status)     { conditions.push(`status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM fees ${whereClause}`;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find fee by ID
   */
  findById: async (id) => {
    const sql = `
      SELECT f.*, u.name AS student_name, s.roll_number, s.department
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE f.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Get fee summary for a student (total, paid, pending)
   */
  getStudentSummary: async (studentId) => {
    const sql = `
      SELECT
        COUNT(*) AS total_records,
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount,
        COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) AS overdue_amount
      FROM fees
      WHERE student_id = $1
    `;
    const { rows } = await query(sql, [studentId]);
    return rows[0];
  },

  /**
   * Update fee by ID
   */
  update: async (id, fields) => {
    const allowed = ['amount', 'status', 'payment_date', 'payment_method'];
    const setClauses = [];
    const params = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        params.push(fields[key]);
      }
    }

    if (!setClauses.length) return null;

    params.push(id);
    const sql = `
      UPDATE fees SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete fee record
   */
  delete: async (id) => {
    const sql = `DELETE FROM fees WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = FeesModel;
