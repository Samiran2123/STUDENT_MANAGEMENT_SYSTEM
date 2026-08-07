const { query } = require('../config/db');

const TeacherModel = {
  /**
   * Create a teacher profile
   */
  create: async (data) => {
    const { user_id, employee_id, department, designation, qualification, experience, photo, status } = data;
    const sql = `
      INSERT INTO teachers
        (user_id, employee_id, department, designation, qualification, experience, photo, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      user_id, employee_id, department, designation, qualification,
      experience || 0, photo, status || 'active',
    ]);
    return rows[0];
  },

  /**
   * Find all teachers with user info
   */
  findAll: async ({ department, status, limit = 50, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`t.department = $${idx++}`); params.push(department); }
    if (status)     { conditions.push(`t.status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT t.*, u.name, u.email, u.phone
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count teachers
   */
  count: async ({ department, status } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`department = $${idx++}`); params.push(department); }
    if (status)     { conditions.push(`status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM teachers ${whereClause}`;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find teacher by ID (with user info)
   */
  findById: async (id) => {
    const sql = `
      SELECT t.*, u.name, u.email, u.phone
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find teacher by user_id
   */
  findByUserId: async (userId) => {
    const sql = `
      SELECT t.*, u.name, u.email, u.phone
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = $1
    `;
    const { rows } = await query(sql, [userId]);
    return rows[0] || null;
  },

  /**
   * Update teacher by ID
   */
  update: async (id, fields) => {
    const allowed = ['department', 'designation', 'qualification', 'experience', 'photo', 'status'];
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
      UPDATE teachers SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete teacher by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM teachers WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Approve a pending teacher
   */
  approve: async (id) => {
    const sql = `
      UPDATE teachers SET status = 'active'
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = TeacherModel;
