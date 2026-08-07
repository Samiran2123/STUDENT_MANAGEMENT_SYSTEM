const { query } = require('../config/db');

const StudentModel = {
  /**
   * Create a student profile
   */
  create: async (data) => {
    const {
      user_id, roll_number, department, semester, year,
      gender, dob, address, photo, guardian_name, guardian_phone, status,
    } = data;
    const sql = `
      INSERT INTO students
        (user_id, roll_number, department, semester, year, gender, dob, address, photo, guardian_name, guardian_phone, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      user_id, roll_number, department, semester, year,
      gender, dob, address, photo, guardian_name, guardian_phone, status || 'active',
    ]);
    return rows[0];
  },

  /**
   * Find all students with joined user info
   */
  findAll: async ({ department, semester, status, limit = 50, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`s.department = $${idx++}`); params.push(department); }
    if (semester)   { conditions.push(`s.semester = $${idx++}`);   params.push(semester); }
    if (status)     { conditions.push(`s.status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT s.*, u.name, u.email, u.phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count students with optional filters
   */
  count: async ({ department, semester, status } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`department = $${idx++}`); params.push(department); }
    if (semester)   { conditions.push(`semester = $${idx++}`);   params.push(semester); }
    if (status)     { conditions.push(`status = $${idx++}`);     params.push(status); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM students ${whereClause}`;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find student by ID (with user info)
   */
  findById: async (id) => {
    const sql = `
      SELECT s.*, u.name, u.email, u.phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find student by user_id
   */
  findByUserId: async (userId) => {
    const sql = `
      SELECT s.*, u.name, u.email, u.phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
    `;
    const { rows } = await query(sql, [userId]);
    return rows[0] || null;
  },

  /**
   * Find student by roll number
   */
  findByRollNumber: async (rollNumber) => {
    const sql = `SELECT * FROM students WHERE roll_number = $1`;
    const { rows } = await query(sql, [rollNumber]);
    return rows[0] || null;
  },

  /**
   * Update student by ID
   */
  update: async (id, fields) => {
    const allowed = [
      'roll_number', 'department', 'semester', 'year', 'gender',
      'dob', 'address', 'photo', 'guardian_name', 'guardian_phone', 'status',
    ];
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
      UPDATE students SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete student by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM students WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Get students enrolled in a specific course
   */
  findByCourse: async (courseId) => {
    const sql = `
      SELECT DISTINCT s.*, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN attendance a ON a.student_id = s.id
      WHERE a.course_id = $1
    `;
    const { rows } = await query(sql, [courseId]);
    return rows;
  },
};

module.exports = StudentModel;
