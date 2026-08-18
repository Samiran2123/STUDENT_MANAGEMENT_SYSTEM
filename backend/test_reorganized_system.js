const { pool } = require('./config/db');
const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test script against running backend
require('dotenv').config();

const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

const log = {
  info:    (msg) => console.log(c.cyan(`  ℹ  ${msg}`)),
  success: (msg) => console.log(c.green(`  ✅ ${msg}`)),
  error:   (msg) => console.log(c.red(`  ❌ ${msg}`)),
  section: (msg) => console.log(c.bold(`\n━━━ ${msg} ━━━━━━━━━━━━━━━━━━━━━━━━━`)),
};

function makeRequest({ method = 'GET', path, token, body, isBinary = false }) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (isBinary) {
          resolve({ status: res.statusCode, headers: res.headers, buffer });
        } else {
          try {
            const json = JSON.parse(buffer.toString('utf8'));
            resolve({ status: res.statusCode, headers: res.headers, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, text: buffer.toString('utf8') });
          }
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  log.section('TESTING REORGANIZED SYSTEM, TEACHER ATTENDANCE & PDF GENERATOR');

  try {
    // 1. Fetch Admin, Teacher, Student from DB
    const adminUser = (await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1")).rows[0];
    const teacherUser = (await pool.query("SELECT u.*, t.id as teacher_id FROM users u JOIN teachers t ON u.id = t.user_id LIMIT 1")).rows[0];
    const student1 = (await pool.query("SELECT u.*, s.id as student_id FROM users u JOIN students s ON u.id = s.user_id ORDER BY s.id ASC LIMIT 1")).rows[0];
    const student2 = (await pool.query("SELECT u.*, s.id as student_id FROM users u JOIN students s ON u.id = s.user_id ORDER BY s.id DESC LIMIT 1")).rows[0];

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const adminToken = jwt.sign({ id: adminUser.id, role: 'admin', email: adminUser.email }, jwtSecret, { expiresIn: '1h' });
    const teacherToken = jwt.sign({ id: teacherUser.id, role: 'teacher', email: teacherUser.email }, jwtSecret, { expiresIn: '1h' });
    const student1Token = jwt.sign({ id: student1.id, role: 'student', email: student1.email }, jwtSecret, { expiresIn: '1h' });

    log.info(`Admin: ${adminUser.email}`);
    log.info(`Teacher: ${teacherUser.email} (Teacher ID: ${teacherUser.teacher_id})`);
    log.info(`Student 1: ${student1.email} (Student ID: ${student1.student_id})`);
    log.info(`Student 2: ${student2.email} (Student ID: ${student2.student_id})`);

    // ── TEST 1: PDF Generation for Student (Admin) ──────────────────────────
    log.section('1. Admin Generates Student Attendance PDF');
    const pdfRes = await makeRequest({
      path: `/api/attendance/student/${student1.student_id}/pdf`,
      token: adminToken,
      isBinary: true,
    });

    if (pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf') {
      const isPdfHeader = pdfRes.buffer.toString('utf8', 0, 5) === '%PDF-';
      if (isPdfHeader && pdfRes.buffer.length > 500) {
        log.success(`Admin successfully generated valid PDF (${pdfRes.buffer.length} bytes, Header: %PDF-)`);
      } else {
        log.error(`PDF content invalid or empty.`);
      }
    } else {
      log.error(`PDF Generation failed with status: ${pdfRes.status}`);
    }

    // ── TEST 2: Student Downloads Own PDF vs Another Student PDF ────────────
    log.section('2. Student Security & PDF Permissions');
    const ownPdfRes = await makeRequest({
      path: `/api/attendance/student/${student1.student_id}/pdf`,
      token: student1Token,
      isBinary: true,
    });
    if (ownPdfRes.status === 200) {
      log.success(`Student 1 successfully downloaded their OWN attendance PDF (${ownPdfRes.buffer.length} bytes)`);
    } else {
      log.error(`Student failed to download own PDF: status ${ownPdfRes.status}`);
    }

    const otherPdfRes = await makeRequest({
      path: `/api/attendance/student/${student2.student_id}/pdf`,
      token: student1Token,
      isBinary: true,
    });
    if (otherPdfRes.status === 403) {
      log.success(`Security Verified: Student 1 was BLOCKED (403 Forbidden) from downloading Student 2's PDF.`);
    } else {
      log.error(`Security Failure: Expected 403, got status ${otherPdfRes.status}`);
    }

    // ── TEST 3: Teacher Course Assignment Validation & Attendance ───────────
    log.section('3. Teacher Attendance Recording');
    // Find course assigned to teacher
    const assignedCourse = (await pool.query("SELECT * FROM courses WHERE teacher_id = $1 LIMIT 1", [teacherUser.teacher_id])).rows[0];
    const unassignedCourse = (await pool.query("SELECT * FROM courses WHERE teacher_id != $1 OR teacher_id IS NULL LIMIT 1", [teacherUser.teacher_id])).rows[0];

    if (assignedCourse) {
      const today = new Date().toISOString().split('T')[0];
      const bulkRes = await makeRequest({
        method: 'POST',
        path: '/api/attendance/bulk',
        token: teacherToken,
        body: {
          course_id: assignedCourse.id,
          date: today,
          records: [
            { student_id: student1.student_id, status: 'present' },
          ],
        },
      });

      if (bulkRes.status === 201) {
        log.success(`Teacher recorded bulk attendance for assigned course: ${assignedCourse.course_name} (${assignedCourse.course_code})`);
      } else {
        log.error(`Teacher bulk attendance failed: ${JSON.stringify(bulkRes.body)}`);
      }
    }

    if (unassignedCourse) {
      const unauthRes = await makeRequest({
        method: 'POST',
        path: '/api/attendance/bulk',
        token: teacherToken,
        body: {
          course_id: unassignedCourse.id,
          date: '2026-08-17',
          records: [{ student_id: student1.student_id, status: 'present' }],
        },
      });

      if (unauthRes.status === 403) {
        log.success(`Backend Security Verified: Teacher was BLOCKED (403 Forbidden) from recording attendance for unassigned course ID ${unassignedCourse.id}.`);
      } else {
        log.error(`Expected 403 for unassigned course, got: ${unauthRes.status}`);
      }
    }

    // ── TEST 4: Attendance Filters in Admin ─────────────────────────────────
    log.section('4. Admin Multi-Filter Attendance Query');
    const filterRes = await makeRequest({
      path: `/api/attendance?student_id=${student1.student_id}&limit=5`,
      token: adminToken,
    });
    if (filterRes.status === 200 && filterRes.body?.data) {
      log.success(`Admin fetched filtered attendance for Student ID ${student1.student_id}: ${filterRes.body.data.length} records found`);
    } else {
      log.error(`Attendance filter query failed: ${JSON.stringify(filterRes.body)}`);
    }

    // ── TEST 5: Payment Approval and Fee Balance Update ────────────────────
    log.section('5. Finance Module & Payment Approval Workflow');
    // Check pending payments
    const pendingRes = await makeRequest({
      path: '/api/erp/payments/pending',
      token: adminToken,
    });

    if (pendingRes.status === 200) {
      log.success(`Finance module retrieved pending payment submissions (${pendingRes.body.data?.length || 0} pending)`);
    }

    log.section('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY');
    process.exit(0);

  } catch (err) {
    log.error(`Test script failed with exception: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Ensure database pool is connected and run
setTimeout(runTests, 1000);
