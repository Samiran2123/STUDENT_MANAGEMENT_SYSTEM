const { query } = require('../config/db');

const UserModel = {
  /**
   * Create a new user
   */
  create: async ({ name, email, password, phone, role }) => {
    const sql = `
      INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `;
    const { rows } = await query(sql, [name, email, password, phone, role]);
    return rows[0];
  },

  /**
   * Find user by email (with password for login)
   */
  findByEmail: async (email) => {
    const sql = `SELECT * FROM users WHERE email = $1`;
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  /**
   * Find user by ID (without password)
   */
  findById: async (id) => {
    const sql = `
      SELECT id, name, email, phone, role, created_at
      FROM users WHERE id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Get all users with optional role filter
   */
  findAll: async ({ role, limit = 50, offset = 0 } = {}) => {
    let sql = `
      SELECT id, name, email, phone, role, created_at
      FROM users
    `;
    const params = [];
    if (role) {
      params.push(role);
      sql += ` WHERE role = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count users (with optional role filter)
   */
  count: async (role = null) => {
    let sql = `SELECT COUNT(*) AS total FROM users`;
    const params = [];
    if (role) {
      params.push(role);
      sql += ` WHERE role = $1`;
    }
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Update user by ID
   */
  update: async (id, fields) => {
    const setClauses = [];
    const params = [];
    let idx = 1;

    if (fields.name !== undefined)     { setClauses.push(`name = $${idx++}`);     params.push(fields.name); }
    if (fields.phone !== undefined)    { setClauses.push(`phone = $${idx++}`);    params.push(fields.phone); }
    if (fields.password !== undefined) { setClauses.push(`password = $${idx++}`); params.push(fields.password); }

    if (!setClauses.length) return null;

    params.push(id);
    const sql = `
      UPDATE users SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, email, phone, role, created_at
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete user by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM users WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Check if email already exists
   */
  emailExists: async (email) => {
    const sql = `SELECT id FROM users WHERE email = $1`;
    const { rows } = await query(sql, [email]);
    return rows.length > 0;
  },
};

module.exports = UserModel;
