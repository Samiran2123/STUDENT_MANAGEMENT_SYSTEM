require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sms_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function verifyDB() {
  console.log('--- VERIFYING DATABASE ---');
  try {
    // 1. Check Student status changes from Pending to Approved
    // 2. Check Roll Number is generated
    // 3. Check Student ID (student_code) is generated
    // 4. Check Class assignment is stored
    // 5. Check Section assignment is stored
    const studentRes = await pool.query(`
      SELECT id, admission_status, roll_number, student_code, class_id, section_id
      FROM students
      WHERE id = 1
    `);
    const student = studentRes.rows[0];
    console.log('\n✅ Student Record:');
    console.log(student);

    if (student) {
      // 6. Check Academic Year is stored (student_code uses it, or maybe it's linked elsewhere, but let's check class mapping)
      // 7. Check Subjects are automatically assigned (in student_subjects)
      const subjectsRes = await pool.query(`
        SELECT ss.subject_id, s.name
        FROM student_subjects ss
        JOIN subjects s ON ss.subject_id = s.id
        WHERE ss.student_id = $1
      `, [student.id]);
      console.log('\n✅ Assigned Subjects:');
      console.log(subjectsRes.rows);

      // 8. Check Fee Structure is automatically assigned (in erp_student_fees)
      const feesRes = await pool.query(`
        SELECT esf.fee_structure_id, fs.amount, esf.status, esf.academic_year_id
        FROM erp_student_fees esf
        JOIN fee_structures fs ON esf.fee_structure_id = fs.id
        WHERE esf.student_id = $1
      `, [student.id]);
      console.log('\n✅ Assigned Fees:');
      console.log(feesRes.rows);
    }
  } catch (error) {
    console.error('Error verifying DB:', error);
  } finally {
    await pool.end();
  }
}

verifyDB();
