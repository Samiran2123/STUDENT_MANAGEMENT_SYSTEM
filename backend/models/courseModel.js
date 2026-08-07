const { query } = require('../config/db');

const CourseModel = {
  /**
   * Create a course
   */
  create: async ({ course_name, course_code, semester, department, credits, teacher_id }) => {
    const sql = `
      INSERT INTO courses (course_name, course_code, semester, department, credits, teacher_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await query(sql, [course_name, course_code, semester, department, credits, teacher_id || null]);
    return rows[0];
  },

  /**
   * Find all courses with teacher info
   */
  findAll: async ({ department, semester, teacher_id, limit = 50, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`c.department = $${idx++}`); params.push(department); }
    if (semester)   { conditions.push(`c.semester = $${idx++}`);   params.push(semester); }
    if (teacher_id) { conditions.push(`c.teacher_id = $${idx++}`); params.push(teacher_id); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT c.*, u.name AS teacher_name, t.department AS teacher_department
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY c.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count courses
   */
  count: async ({ department, semester, teacher_id } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department) { conditions.push(`department = $${idx++}`); params.push(department); }
    if (semester)   { conditions.push(`semester = $${idx++}`);   params.push(semester); }
    if (teacher_id) { conditions.push(`teacher_id = $${idx++}`); params.push(teacher_id); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM courses ${whereClause}`;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find course by ID (with teacher info)
   */
  findById: async (id) => {
    const sql = `
      SELECT c.*, u.name AS teacher_name, t.department AS teacher_department, t.designation
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Find courses assigned to a teacher
   */
  findByTeacherId: async (teacherId) => {
    const sql = `
      SELECT c.*, u.name AS teacher_name
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE c.teacher_id = $1
      ORDER BY c.semester ASC
    `;
    const { rows } = await query(sql, [teacherId]);
    return rows;
  },

  /**
   * Update course by ID
   */
  update: async (id, fields) => {
    const allowed = ['course_name', 'semester', 'department', 'credits', 'teacher_id'];
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
      UPDATE courses SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Assign teacher to course
   */
  assignTeacher: async (courseId, teacherId) => {
    const sql = `
      UPDATE courses SET teacher_id = $1
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await query(sql, [teacherId, courseId]);
    return rows[0] || null;
  },

  /**
   * Delete course by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM courses WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = CourseModel;
