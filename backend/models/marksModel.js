const { query } = require('../config/db');

const MarksModel = {
  /**
   * Add marks for a student
   */
  create: async ({ student_id, course_id, teacher_id, exam_type, marks, total_marks }) => {
    const sql = `
      INSERT INTO marks (student_id, course_id, teacher_id, exam_type, marks, total_marks)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await query(sql, [student_id, course_id, teacher_id, exam_type, marks, total_marks]);
    return rows[0];
  },

  /**
   * Get marks with filters
   */
  findAll: async ({ student_id, course_id, teacher_id, exam_type, limit = 100, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (student_id) { conditions.push(`m.student_id = $${idx++}`); params.push(student_id); }
    if (course_id)  { conditions.push(`m.course_id = $${idx++}`);  params.push(course_id); }
    if (teacher_id) { conditions.push(`m.teacher_id = $${idx++}`); params.push(teacher_id); }
    if (exam_type)  { conditions.push(`m.exam_type = $${idx++}`);  params.push(exam_type); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        m.*,
        u.name AS student_name,
        s.roll_number,
        c.course_name,
        c.course_code,
        ROUND(m.marks * 100.0 / NULLIF(m.total_marks, 0), 2) AS percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON m.course_id = c.id
      ${whereClause}
      ORDER BY m.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Find marks by ID
   */
  findById: async (id) => {
    const sql = `
      SELECT m.*, u.name AS student_name, s.roll_number, c.course_name,
             ROUND(m.marks * 100.0 / NULLIF(m.total_marks, 0), 2) AS percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE m.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Get marks report for a student across all courses
   */
  getStudentReport: async (studentId) => {
    const sql = `
      SELECT
        c.course_name,
        c.course_code,
        m.exam_type,
        m.marks,
        m.total_marks,
        ROUND(m.marks * 100.0 / NULLIF(m.total_marks, 0), 2) AS percentage
      FROM marks m
      JOIN courses c ON m.course_id = c.id
      WHERE m.student_id = $1
      ORDER BY c.course_name, m.exam_type
    `;
    const { rows } = await query(sql, [studentId]);
    return rows;
  },

  /**
   * Update marks by ID
   */
  update: async (id, fields) => {
    const allowed = ['exam_type', 'marks', 'total_marks'];
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
      UPDATE marks SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows[0] || null;
  },

  /**
   * Delete marks by ID
   */
  delete: async (id) => {
    const sql = `DELETE FROM marks WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = MarksModel;
