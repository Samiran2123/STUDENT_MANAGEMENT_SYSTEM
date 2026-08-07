const { query } = require('../config/db');

const AnnouncementModel = {
  /**
   * Create an announcement
   */
  create: async ({ title, description, created_by }) => {
    const sql = `
      INSERT INTO announcements (title, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await query(sql, [title, description, created_by]);
    return rows[0];
  },

  /**
   * Find all announcements with creator info
   */
  findAll: async ({ limit = 20, offset = 0 } = {}) => {
    const sql = `
      SELECT a.*, u.name AS created_by_name, u.role AS created_by_role
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await query(sql, [limit, offset]);
    return rows;
  },

  /**
   * Count all announcements
   */
  count: async () => {
    const sql = `SELECT COUNT(*) AS total FROM announcements`;
    const { rows } = await query(sql, []);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find announcement by ID
   */
  findById: async (id) => {
    const sql = `
      SELECT a.*, u.name AS created_by_name, u.role AS created_by_role
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Update announcement by ID
   */
  update: async (id, { title, description }) => {
    const setClauses = [];
    const params = [];
    let idx = 1;

    if (title !== undefined)       { setClauses.push(`title = $${idx++}`);       params.push(title); }
    if (description !== undefined) { setClauses.push(`description = $${idx++}`); params.push(description); }

    if (!setClauses.length) return null;

    params.push(id);
    const sql = `
      UPDATE announcements SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete announcement by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM announcements WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = AnnouncementModel;
