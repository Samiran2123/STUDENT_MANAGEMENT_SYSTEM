const { query, getClient } = require('../config/db');

const ErpModel = {
  // Academic Years
  getAcademicYears: async () => {
    const { rows } = await query('SELECT * FROM academic_years ORDER BY id DESC');
    return rows;
  },
  getActiveAcademicYear: async () => {
    const { rows } = await query('SELECT * FROM academic_years WHERE is_active = true LIMIT 1');
    return rows[0];
  },

  // Degrees / Programs & Departments
  getPrograms: async () => {
    const { rows } = await query('SELECT DISTINCT degree FROM classes WHERE degree IS NOT NULL ORDER BY degree ASC');
    return rows.map(r => r.degree);
  },
  getDepartments: async () => {
    const { rows } = await query('SELECT DISTINCT department FROM classes WHERE department IS NOT NULL ORDER BY department ASC');
    return rows.map(r => r.department);
  },

  // Classes
  getClasses: async ({ degree, department } = {}) => {
    let sql = 'SELECT * FROM classes';
    const params = [];
    const conditions = [];

    if (degree) {
      params.push(degree);
      conditions.push(`degree = $${params.length}`);
    }
    if (department) {
      params.push(department);
      conditions.push(`department = $${params.length}`);
    }

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY id ASC';

    const { rows } = await query(sql, params);
    return rows;
  },

  // Sections
  getSectionsByClass: async (classId) => {
    if (!classId) {
      const { rows } = await query('SELECT * FROM sections ORDER BY id ASC');
      return rows;
    }
    const { rows } = await query('SELECT * FROM sections WHERE class_id = $1 ORDER BY id ASC', [classId]);
    return rows;
  },

  // Subjects
  getSubjects: async () => {
    const { rows } = await query('SELECT * FROM subjects ORDER BY name ASC');
    return rows;
  },
  getClassSubjects: async (classId) => {
    const sql = `
      SELECT s.* FROM subjects s
      JOIN class_subjects cs ON s.id = cs.subject_id
      WHERE cs.class_id = $1
    `;
    const { rows } = await query(sql, [classId]);
    return rows;
  },

  // Fee Structures
  getFeeStructures: async () => {
    const sql = `
      SELECT fs.*, c.name as class_name, ay.year_name
      FROM fee_structures fs
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON fs.academic_year_id = ay.id
      ORDER BY fs.id DESC
    `;
    const { rows } = await query(sql);
    return rows;
  },
  getFeeStructure: async (classId, academicYearId) => {
    const { rows } = await query(
      'SELECT fs.*, c.name as class_name FROM fee_structures fs JOIN classes c ON fs.class_id = c.id WHERE fs.class_id = $1 AND fs.academic_year_id = $2',
      [classId, academicYearId]
    );
    return rows[0];
  },

  // Student Admissions
  getPendingAdmissions: async () => {
    const sql = `
      SELECT s.id as student_id, s.user_id, s.admission_status, s.degree, s.department, s.semester,
             s.academic_year_id, s.class_id, s.section_id,
             u.created_at, u.name as user_name, u.email, u.phone,
             c.name as class_name, sec.name as section_name, ay.year_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE s.admission_status = 'pending'
      ORDER BY s.id DESC
    `;
    const { rows } = await query(sql);
    return rows;
  },
  
  approveStudentAdmission: async ({
    student_id, class_id, section_id, academic_year_id,
    degree, department, semester, year_level, roll_number, student_code, subject_ids
  }) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Fetch class details if degree/dept not specified
      const classRes = await client.query('SELECT * FROM classes WHERE id = $1', [class_id]);
      const cls = classRes.rows[0];
      const finalDegree = degree || cls?.degree || 'BCA';
      const finalDept = department || cls?.department || 'Computer Science';
      const finalSem = semester || 1;
      const currentYear = new Date().getFullYear();

      // Auto-generate Roll Number and Student Code if not explicitly passed
      const generatedCode = student_code || `${finalDegree.replace(/[^a-zA-Z0-9]/g, '')}${currentYear}${String(student_id).padStart(3, '0')}`;
      const generatedRoll = roll_number || `${finalDegree.replace(/[^a-zA-Z0-9]/g, '')}/${currentYear}/${String(student_id).padStart(3, '0')}`;

      // 1. Update Student Table
      await client.query(`
        UPDATE students 
        SET admission_status = 'approved',
            status = 'active',
            class_id = $1,
            section_id = $2,
            academic_year_id = $3,
            degree = $4,
            department = $5,
            semester = $6,
            year = $7,
            roll_number = $8,
            student_code = $9
        WHERE id = $10
      `, [class_id, section_id, academic_year_id, finalDegree, finalDept, finalSem, currentYear, generatedRoll, generatedCode, student_id]);

      // 2. Assign Subjects
      let targetSubjectIds = subject_ids;
      if (!targetSubjectIds || !targetSubjectIds.length) {
        const subRes = await client.query('SELECT subject_id FROM class_subjects WHERE class_id = $1', [class_id]);
        targetSubjectIds = subRes.rows.map(r => r.subject_id);
      }
      for (const subId of targetSubjectIds) {
        await client.query(`INSERT INTO student_subjects (student_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student_id, subId]);
      }

      // 3. Create Fee Ledger Record
      const feeRes = await client.query('SELECT * FROM fee_structures WHERE class_id = $1 AND academic_year_id = $2', [class_id, academic_year_id]);
      const feeStruct = feeRes.rows[0];
      if (feeStruct) {
        const totalAmt = parseFloat(feeStruct.amount) || 0;
        await client.query(`
          INSERT INTO erp_student_fees 
            (student_id, fee_structure_id, academic_year_id, total_amount, paid_amount, pending_amount, status)
          VALUES ($1, $2, $3, $4, 0, $4, 'pending')
          ON CONFLICT DO NOTHING
        `, [student_id, feeStruct.id, academic_year_id, totalAmt]);
      }

      await client.query('COMMIT');
      return { student_code: generatedCode, roll_number: generatedRoll };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  
  rejectStudentAdmission: async (studentId) => {
    await query(`
      UPDATE students 
      SET admission_status = 'rejected'
      WHERE id = $1
    `, [studentId]);
  },

  // Payments & Ledger
  createPayment: async ({ student_id, student_fee_id, amount, payment_method, transaction_reference }) => {
    const { rows } = await query(`
      INSERT INTO erp_payments (student_id, student_fee_id, amount, payment_method, transaction_reference, status)
      VALUES ($1, $2, $3, $4, $5, 'pending_approval')
      RETURNING *
    `, [student_id, student_fee_id, amount, payment_method || 'online', transaction_reference || `TXN-${Date.now()}`]);
    return rows[0];
  },

  getPendingPayments: async () => {
    const sql = `
      SELECT p.*, u.name as student_name, u.email as student_email, s.student_code, s.roll_number
      FROM erp_payments p
      JOIN students s ON p.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY p.id DESC
    `;
    const { rows } = await query(sql);
    return rows;
  },

  approvePayment: async (paymentId, adminUserId) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const payRes = await client.query('SELECT * FROM erp_payments WHERE id = $1', [paymentId]);
      const payment = payRes.rows[0];
      if (!payment) throw new Error('Payment record not found');
      if (payment.status === 'approved') throw new Error('Payment already approved');

      // Update Payment status
      await client.query(`
        UPDATE erp_payments 
        SET status = 'approved', approved_by = $1
        WHERE id = $2
      `, [adminUserId, paymentId]);

      // Update Fee Ledger
      const feeRes = await client.query('SELECT * FROM erp_student_fees WHERE id = $1', [payment.student_fee_id]);
      const feeLedger = feeRes.rows[0];

      if (feeLedger) {
        const newPaid = (parseFloat(feeLedger.paid_amount) || 0) + parseFloat(payment.amount);
        const total = parseFloat(feeLedger.total_amount) || 0;
        const newPending = Math.max(0, total - newPaid);
        const newStatus = newPending <= 0 ? 'paid' : (newPaid > 0 ? 'partially_paid' : 'pending');

        await client.query(`
          UPDATE erp_student_fees
          SET paid_amount = $1, pending_amount = $2, status = $3
          WHERE id = $4
        `, [newPaid, newPending, newStatus, feeLedger.id]);
      }

      await client.query('COMMIT');
      return payment;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  rejectPayment: async (paymentId) => {
    const { rows } = await query(`
      UPDATE erp_payments
      SET status = 'rejected'
      WHERE id = $1 RETURNING *
    `, [paymentId]);
    return rows[0];
  },

  getStudentFeeLedger: async (studentId) => {
    const sql = `
      SELECT sf.*, fs.description, fs.tuition_fee, fs.exam_fee, fs.library_fee, fs.other_fee,
             c.name as class_name, ay.year_name
      FROM erp_student_fees sf
      JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON sf.academic_year_id = ay.id
      WHERE sf.student_id = $1
      ORDER BY sf.id DESC
    `;
    const { rows } = await query(sql, [studentId]);
    return rows;
  },

  getStudentPayments: async (studentId) => {
    const sql = `
      SELECT * FROM erp_payments
      WHERE student_id = $1
      ORDER BY id DESC
    `;
    const { rows } = await query(sql, [studentId]);
    return rows;
  }
};

module.exports = ErpModel;

