const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT || 5432,
});

let tokens = { admin: '', teacher: '', student: '' };
let ids = { admin: null, teacher: null, student: null };

// Fetch Wrapper
const fetchAPI = async (endpoint, method, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { response: { status: res.status, data } };
  }
  return { data };
};

// Utility to assert and log
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
};

const runAudit = async () => {
  console.log('🚀 Starting End-to-End QA Audit...\n');
  
  try {
    // 1. Check DB Connection
    await pool.query('SELECT 1');
    console.log('✅ DB Connection Successful');

    // Generate unique random strings for this test run
    const timestamp = Date.now();
    const studentEmail = `qa_student_${timestamp}@test.com`;
    const teacherEmail = `qa_teacher_${timestamp}@test.com`;
    const adminEmail = `qa_admin_${timestamp}@test.com`;

    // --- REGISTRATION WORKFLOWS ---
    console.log('\n--- 1. REGISTRATION WORKFLOWS ---');
    
    // Register Admin
    let res = await fetchAPI('/auth/register', 'POST', {
      name: 'QA Admin', email: adminEmail, password: 'Password123!', role: 'admin'
    });
    assert(res.data.success, 'Admin registration successful');
    tokens.admin = res.data.data.token;
    ids.admin = res.data.data.user.id;

    // Register Teacher
    res = await fetchAPI('/auth/register', 'POST', {
      name: 'QA Teacher', email: teacherEmail, password: 'Password123!', role: 'teacher', department: 'Science'
    });
    assert(res.data.success, 'Teacher registration successful');
    tokens.teacher = res.data.data.token;
    ids.teacher = res.data.data.user.id;

    // Register Student
    res = await fetchAPI('/auth/register', 'POST', {
      name: 'QA Student', email: studentEmail, password: 'Password123!', role: 'student', department: 'Science'
    });
    assert(res.data.success, 'Student registration successful');
    tokens.student = res.data.data.token;
    ids.student = res.data.data.user.id;

    // --- DB SYNC VERIFICATION ---
    let dbUser = await pool.query('SELECT role FROM users WHERE id = $1', [ids.student]);
    let dbStudentEntry = await pool.query('SELECT admission_status FROM students WHERE user_id = $1', [ids.student]);
    assert(dbUser.rows[0].role === 'student' && dbStudentEntry.rows[0].admission_status === 'pending', 'Student created with pending status in DB');


    // --- ADMISSION APPROVAL WORKFLOW ---
    console.log('\n--- 2. ADMISSION APPROVAL WORKFLOW ---');
    
    // Admin gets pending admissions
    res = await fetchAPI('/erp/pending-admissions', 'GET', null, tokens.admin);
    assert(res.data.success, 'Admin fetches pending admissions');
    const pendingStudent = res.data.data.find(s => s.user_id === ids.student);
    assert(pendingStudent, 'Newly registered student found in pending admissions');

    const studentId = pendingStudent.id;

    // Fetch existing Academic Year, Class, and Section
    const yearRes = await fetchAPI('/erp/academic-years', 'GET', null, tokens.admin);
    const yearId = yearRes.data.data[0].id;

    const classRes = await fetchAPI('/erp/classes', 'GET', null, tokens.admin);
    if (!classRes.data.data || classRes.data.data.length === 0) throw new Error('No classes found in DB');
    const classId = classRes.data.data[0].id;

    const sectionRes = await fetchAPI(`/erp/sections/${classId}`, 'GET', null, tokens.admin);
    const sectionId = sectionRes.data.data[0].id;

    // Admin approves student
    res = await fetchAPI(`/erp/admissions/${studentId}/approve`, 'PUT', {
      class_id: classId, section_id: sectionId
    }, tokens.admin);
    assert(res.data.success, 'Admin approves student admission');

    // Verify PostgreSQL State
    const dbStudent = await pool.query('SELECT admission_status, roll_number, student_code, class_id FROM students WHERE id = $1', [studentId]);
    assert(dbStudent.rows[0].admission_status === 'approved', 'DB admission_status updated to approved');
    assert(dbStudent.rows[0].roll_number === `CL${classId}SEC${sectionId}-${studentId}`, 'DB roll_number generated correctly');
    assert(dbStudent.rows[0].student_code === `STU${yearId}-${studentId}`, 'DB student_code generated correctly');
    assert(dbStudent.rows[0].class_id === classId, 'DB class_id assigned');


    // --- ACADEMIC WORKFLOW (ATTENDANCE & MARKS) ---
    console.log('\n--- 3. ACADEMIC WORKFLOW ---');
    
    // Fetch an existing course and assign it to the new teacher
    const courseRes = await fetchAPI('/courses', 'GET', null, tokens.admin);
    const courseId = courseRes.data.data[0].id;
    let dbTeacher = await pool.query('SELECT id FROM teachers WHERE user_id = $1', [ids.teacher]);
    const teacherProfileId = dbTeacher.rows[0].id;
    await pool.query('UPDATE courses SET teacher_id = $1 WHERE id = $2', [teacherProfileId, courseId]);

    // Teacher posts attendance
    res = await fetchAPI('/attendance', 'POST', {
      student_id: studentId, course_id: courseId, date: '2026-08-01', status: 'present'
    }, tokens.teacher);
    assert(res.data.success, 'Teacher posts attendance');

    // Teacher posts marks
    res = await fetchAPI('/marks', 'POST', {
      student_id: studentId, course_id: courseId, exam_type: 'midterm', marks: 85, total_marks: 100, comments: 'Good'
    }, tokens.teacher);
    assert(res.data.success, 'Teacher posts marks');

    // Student fetches marks
    res = await fetchAPI(`/marks?student_id=${studentId}`, 'GET', null, tokens.student);
    assert(res.data.success && res.data.data.length > 0, 'Student views marks successfully');


    // --- CLEANUP ---
    console.log('\n--- 4. QA CLEANUP ---');
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['qa_%@test.com']);
    console.log('✅ QA test data cleaned up successfully.');

    console.log('\n🎉 ALL QA AUDIT TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\n❌ QA AUDIT FAILED');
    if (err.response) {
      console.error(`API Error: [${err.response.status}] ${err.response.data.message || err.response.statusText}`);
      if (err.response.data.errors) console.error(err.response.data.errors);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runAudit();
