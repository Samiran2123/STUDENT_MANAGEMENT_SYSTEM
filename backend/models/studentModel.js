const { query } = require('../config/db');

const StudentModel = {
  /**
   * Create a student profile
   */
  create: async (data) => {
    const {
      user_id, roll_number, degree, department, semester, year,
      academic_year_id, class_id, section_id,
      gender, dob, address, photo, guardian_name, guardian_phone, status, admission_status
    } = data;
    const sql = `
      INSERT INTO students
        (user_id, roll_number, degree, department, semester, year, academic_year_id, class_id, section_id, gender, dob, address, photo, guardian_name, guardian_phone, status, admission_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      user_id, roll_number || null, degree || null, department || null,
      semester || null, year || null, academic_year_id || null, class_id || null, section_id || null,
      gender || null, dob || null, address || null, photo || null, guardian_name || null, guardian_phone || null,
      status || 'inactive', admission_status || 'pending',
    ]);
    return rows[0];
  },

  /**
   * Find all students with joined user, class, section info
   */
  findAll: async ({ department, semester, status, class_id, section_id, degree, academic_year_id, search, limit = 50, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department)       { conditions.push(`s.department = $${idx++}`);       params.push(department); }
    if (semester)         { conditions.push(`s.semester = $${idx++}`);         params.push(semester); }
    if (status)           { conditions.push(`s.status = $${idx++}`);           params.push(status); }
    if (class_id)         { conditions.push(`s.class_id = $${idx++}`);         params.push(class_id); }
    if (section_id)       { conditions.push(`s.section_id = $${idx++}`);       params.push(section_id); }
    if (degree)           { conditions.push(`s.degree = $${idx++}`);           params.push(degree); }
    if (academic_year_id) { conditions.push(`s.academic_year_id = $${idx++}`); params.push(academic_year_id); }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR s.roll_number ILIKE $${idx} OR s.student_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT s.*, u.name, u.email, u.phone,
             c.name AS class_name,
             sec.name AS section_name,
             ay.year_name AS academic_year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
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
  count: async ({ department, semester, status, class_id, section_id, degree, academic_year_id, search } = {}) => {
    const params = [];
    const conditions = [];
    let idx = 1;

    if (department)       { conditions.push(`s.department = $${idx++}`);       params.push(department); }
    if (semester)         { conditions.push(`s.semester = $${idx++}`);         params.push(semester); }
    if (status)           { conditions.push(`s.status = $${idx++}`);           params.push(status); }
    if (class_id)         { conditions.push(`s.class_id = $${idx++}`);         params.push(class_id); }
    if (section_id)       { conditions.push(`s.section_id = $${idx++}`);       params.push(section_id); }
    if (degree)           { conditions.push(`s.degree = $${idx++}`);           params.push(degree); }
    if (academic_year_id) { conditions.push(`s.academic_year_id = $${idx++}`); params.push(academic_year_id); }
    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR s.roll_number ILIKE $${idx} OR s.student_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT COUNT(*) AS total 
      FROM students s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `;
    const { rows } = await query(sql, params);
    return parseInt(rows[0].total, 10);
  },

  /**
   * Find student by ID (with user, class, section info)
   */
  findById: async (id) => {
    const sql = `
      SELECT s.*, u.name, u.email, u.phone,
             c.name AS class_name,
             sec.name AS section_name,
             ay.year_name AS academic_year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
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
      SELECT s.*, u.name, u.email, u.phone,
             c.name AS class_name,
             sec.name AS section_name,
             ay.year_name AS academic_year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
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
      'class_id', 'section_id', 'degree', 'academic_year_id', 'student_code'
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
      SELECT DISTINCT s.*, u.name, u.email, s.roll_number, s.student_code
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN attendance a ON a.student_id = s.id
      WHERE a.course_id = $1
    `;
    const { rows } = await query(sql, [courseId]);
    return rows;
  },

  /**
   * Get subjects assigned to a student
   */
  getAssignedSubjects: async (studentId) => {
    const sql = `
      SELECT s.id, s.name, s.code
      FROM subjects s
      JOIN student_subjects ss ON s.id = ss.subject_id
      WHERE ss.student_id = $1
    `;
    const { rows } = await query(sql, [studentId]);
    return rows;
  },
};

module.exports = StudentModel;
