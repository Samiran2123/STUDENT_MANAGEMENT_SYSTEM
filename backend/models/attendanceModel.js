const { query } = require('../config/db');

const AttendanceModel = {
  /**
   * Insert single attendance record
   */
  create: async ({ student_id, course_id, teacher_id, date, status }) => {
    const sql = `
      INSERT INTO attendance (student_id, course_id, teacher_id, date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await query(sql, [student_id, course_id, teacher_id, date, status]);
    return rows[0];
  },

  /**
   * Bulk insert attendance records in a single query
   */
  bulkCreate: async (records, course_id, teacher_id, date) => {
    if (!records.length) return [];
    const values = [];
    const params = [];
    records.forEach(({ student_id, status }, i) => {
      const base = i * 5;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(student_id, course_id, teacher_id, date, status);
    });

    const sql = `
      INSERT INTO attendance (student_id, course_id, teacher_id, date, status)
      VALUES ${values.join(', ')}
      ON CONFLICT (student_id, course_id, date) DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    `;
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Get all attendance records with filters
   */
  findAll: async ({ student_id, course_id, teacher_id, date, date_from, date_to, class_id, section_id, status, search, limit = 100, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (student_id)  { conditions.push(`a.student_id = $${idx++}`);  params.push(student_id); }
    if (course_id)   { conditions.push(`a.course_id = $${idx++}`);   params.push(course_id); }
    if (teacher_id)  { conditions.push(`a.teacher_id = $${idx++}`);  params.push(teacher_id); }
    if (date)        { conditions.push(`a.date = $${idx++}`);        params.push(date); }
    if (date_from)   { conditions.push(`a.date >= $${idx++}`);       params.push(date_from); }
    if (date_to)     { conditions.push(`a.date <= $${idx++}`);       params.push(date_to); }
    if (class_id)    { conditions.push(`s.class_id = $${idx++}`);    params.push(class_id); }
    if (section_id)  { conditions.push(`s.section_id = $${idx++}`);  params.push(section_id); }
    if (status)      { conditions.push(`a.status = $${idx++}`);      params.push(status); }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR s.roll_number ILIKE $${idx} OR c.course_name ILIKE $${idx} OR c.course_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        a.*,
        u.name AS student_name,
        s.roll_number,
        s.student_code,
        s.class_id,
        s.section_id,
        cls.name AS class_name,
        sec.name AS section_name,
        c.course_name,
        c.course_code
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN classes cls ON s.class_id = cls.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      ${whereClause}
      ORDER BY a.date DESC, a.id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Count attendance records with filters
   */
  count: async ({ student_id, course_id, teacher_id, date, date_from, date_to, class_id, section_id, status, search } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (student_id)  { conditions.push(`a.student_id = $${idx++}`);  params.push(student_id); }
    if (course_id)   { conditions.push(`a.course_id = $${idx++}`);   params.push(course_id); }
    if (teacher_id)  { conditions.push(`a.teacher_id = $${idx++}`);  params.push(teacher_id); }
    if (date)        { conditions.push(`a.date = $${idx++}`);        params.push(date); }
    if (date_from)   { conditions.push(`a.date >= $${idx++}`);       params.push(date_from); }
    if (date_to)     { conditions.push(`a.date <= $${idx++}`);       params.push(date_to); }
    if (class_id)    { conditions.push(`s.class_id = $${idx++}`);    params.push(class_id); }
    if (section_id)  { conditions.push(`s.section_id = $${idx++}`);  params.push(section_id); }
    if (status)      { conditions.push(`a.status = $${idx++}`);      params.push(status); }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR s.roll_number ILIKE $${idx} OR c.course_name ILIKE $${idx} OR c.course_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT COUNT(*) AS total
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      ${whereClause}
    `;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find attendance by ID
   */
  findById: async (id) => {
    const sql = `
      SELECT a.*, u.name AS student_name, s.roll_number, c.course_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  /**
   * Update attendance status
   */
  update: async (id, status) => {
    const sql = `
      UPDATE attendance SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await query(sql, [status, id]);
    return rows[0] || null;
  },

  /**
   * Get attendance summary for a student in a course
   */
  getSummary: async (studentId, courseId) => {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'present') AS present,
        COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
        COUNT(*) FILTER (WHERE status = 'late')    AS late,
        COUNT(*) FILTER (WHERE status = 'excused') AS excused,
        ROUND(
          COUNT(*) FILTER (WHERE status IN ('present','late')) * 100.0 / NULLIF(COUNT(*), 0), 2
        ) AS attendance_percentage
      FROM attendance
      WHERE student_id = $1 AND course_id = $2
    `;
    const { rows } = await query(sql, [studentId, courseId]);
    return rows[0];
  },

  /**
   * Get full student attendance analytics (overall + course breakdown)
   */
  getStudentFullReport: async (studentId) => {
    // 1. Overall Summary
    const summarySql = `
      SELECT
        COUNT(*) AS total_classes,
        COUNT(*) FILTER (WHERE status = 'present') AS present,
        COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
        COUNT(*) FILTER (WHERE status = 'late')    AS late,
        COUNT(*) FILTER (WHERE status = 'excused') AS excused,
        COALESCE(ROUND(
          COUNT(*) FILTER (WHERE status IN ('present','late')) * 100.0 / NULLIF(COUNT(*), 0), 1
        ), 0) AS attendance_percentage
      FROM attendance
      WHERE student_id = $1
    `;
    const summaryRes = await query(summarySql, [studentId]);
    const summary = summaryRes.rows[0] || {
      total_classes: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_percentage: 0
    };

    // 2. Course-wise Breakdown
    const coursesSql = `
      SELECT
        c.id AS course_id,
        c.course_name,
        c.course_code,
        COUNT(a.id) AS total,
        COUNT(a.id) FILTER (WHERE a.status = 'present') AS present,
        COUNT(a.id) FILTER (WHERE a.status = 'absent')  AS absent,
        COUNT(a.id) FILTER (WHERE a.status = 'late')    AS late,
        COUNT(a.id) FILTER (WHERE a.status = 'excused') AS excused,
        COALESCE(ROUND(
          COUNT(a.id) FILTER (WHERE a.status IN ('present','late')) * 100.0 / NULLIF(COUNT(a.id), 0), 1
        ), 0) AS percentage
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1
      GROUP BY c.id, c.course_name, c.course_code
      ORDER BY c.course_name ASC
    `;
    const coursesRes = await query(coursesSql, [studentId]);

    return {
      summary,
      courses: coursesRes.rows,
    };
  },

  /**
   * Delete attendance record
   */
  delete: async (id) => {
    const sql = `DELETE FROM attendance WHERE id = $1 RETURNING id`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
};

module.exports = AttendanceModel;
