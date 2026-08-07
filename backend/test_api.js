/**
 * ================================================================
 * BACKEND API TEST SCRIPT
 * Student Management System — Complete API Verification
 * ================================================================
 * Run: node test_api.js
 * Requires: server running on localhost:5000
 * ================================================================
 */

require('dotenv').config();
const http = require('http');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// ─── Stored IDs across tests ─────────────────────────────────
let adminToken    = '';
let teacherToken  = '';
let studentToken  = '';
let adminUserId   = null;
let teacherUserId = null;
let studentUserId = null;
let teacherId     = null;
let studentId     = null;
let courseId      = null;
let attendanceId  = null;
let markId        = null;
let feeId         = null;
let announcementId = null;

// ─── Test tracker ─────────────────────────────────────────────
const results = { passed: [], failed: [], errors: [] };

// ─── HTTP helper ──────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: parseInt(process.env.PORT) || 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch (_) { json = raw; }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Test helper ──────────────────────────────────────────────
let testNum = 0;
async function test(name, fn) {
  testNum++;
  try {
    const result = await fn();
    if (result.pass) {
      results.passed.push({ id: testNum, name, status: result.status });
      console.log(`  ✅ [${testNum}] ${name} (${result.status})`);
    } else {
      results.failed.push({ id: testNum, name, status: result.status, reason: result.reason });
      console.log(`  ❌ [${testNum}] ${name} (${result.status}) — ${result.reason}`);
    }
  } catch (err) {
    results.errors.push({ id: testNum, name, error: err.message });
    console.log(`  💥 [${testNum}] ${name} — EXCEPTION: ${err.message}`);
  }
}

function pass(status)           { return { pass: true,  status }; }
function fail(status, reason)   { return { pass: false, status, reason }; }
function check(r, expectedStatus, extraCheck) {
  if (r.status !== expectedStatus) return fail(r.status, `Expected ${expectedStatus}, got ${r.status}. Body: ${JSON.stringify(r.body).substring(0, 200)}`);
  if (extraCheck) {
    const reason = extraCheck(r.body);
    if (reason) return fail(r.status, reason);
  }
  return pass(r.status);
}

// ─── Test suites ─────────────────────────────────────────────

async function runHealthCheck() {
  console.log('\n━━━ HEALTH CHECK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await test('GET /health — server is alive', async () => {
    const r = await request('GET', '/health');
    return check(r, 200, (b) => b.success !== true ? 'success field missing' : null);
  });
}

async function runAuthTests() {
  console.log('\n━━━ AUTH ENDPOINTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Register new users for this test run (use unique emails to avoid conflicts)
  const ts = Date.now();

  await test('POST /api/auth/register — new admin user', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Test Admin', email: `testadmin_${ts}@test.com`,
      password: 'Admin@123', role: 'admin',
    });
    if (r.status === 201) {
      adminToken    = r.body.data?.token;
      adminUserId   = r.body.data?.user?.id;
    }
    return check(r, 201, (b) => !b.data?.token ? 'token missing' : null);
  });

  await test('POST /api/auth/login — admin login', async () => {
    const r = await request('POST', '/api/auth/login', {
      email: 'admin@sms.edu', password: 'Admin@123',
    });
    if (r.status === 200) {
      adminToken  = r.body.data?.token;
      adminUserId = r.body.data?.user?.id;
    }
    return check(r, 200, (b) => !b.data?.token ? 'token missing' : null);
  });

  await test('POST /api/auth/login — teacher login', async () => {
    const r = await request('POST', '/api/auth/login', {
      email: 'r.sharma@sms.edu', password: 'Teacher@123',
    });
    if (r.status === 200) {
      teacherToken  = r.body.data?.token;
      teacherUserId = r.body.data?.user?.id;
    }
    return check(r, 200, (b) => !b.data?.token ? 'token missing' : null);
  });

  await test('POST /api/auth/login — student login', async () => {
    const r = await request('POST', '/api/auth/login', {
      email: 'aarav.singh@student.sms.edu', password: 'Student@123',
    });
    if (r.status === 200) {
      studentToken  = r.body.data?.token;
      studentUserId = r.body.data?.user?.id;
    }
    return check(r, 200, (b) => !b.data?.token ? 'token missing' : null);
  });

  await test('POST /api/auth/login — wrong password → 401', async () => {
    const r = await request('POST', '/api/auth/login', { email: 'admin@sms.edu', password: 'wrongpassword' });
    return check(r, 401);
  });

  await test('POST /api/auth/login — missing email → 422', async () => {
    const r = await request('POST', '/api/auth/login', { password: 'Admin@123' });
    return check(r, 422);
  });

  await test('POST /api/auth/register — duplicate email → 409', async () => {
    const r = await request('POST', '/api/auth/register', {
      name: 'Dup Admin', email: 'admin@sms.edu', password: 'Admin@123', role: 'admin',
    });
    return check(r, 409);
  });

  await test('GET /api/auth/profile — with valid token', async () => {
    const r = await request('GET', '/api/auth/profile', null, adminToken);
    return check(r, 200, (b) => !b.data?.email ? 'email missing from profile' : null);
  });

  await test('GET /api/auth/profile — without token → 401', async () => {
    const r = await request('GET', '/api/auth/profile');
    return check(r, 401);
  });

  await test('GET /api/auth/profile — invalid token → 401', async () => {
    const r = await request('GET', '/api/auth/profile', null, 'Bearer invalid.token.here');
    return check(r, 401);
  });

  await test('POST /api/auth/logout — valid token', async () => {
    const r = await request('POST', '/api/auth/logout', null, adminToken);
    return check(r, 200);
  });
}

async function runUserTests() {
  console.log('\n━━━ USERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('GET /api/users — admin gets all users', async () => {
    const r = await request('GET', '/api/users', null, adminToken);
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'data is not an array' : null);
  });

  await test('GET /api/users?role=student — filter by role', async () => {
    const r = await request('GET', '/api/users?role=student', null, adminToken);
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'data is not an array' : null);
  });

  await test('GET /api/users — teacher forbidden → 403', async () => {
    const r = await request('GET', '/api/users', null, teacherToken);
    return check(r, 403);
  });

  await test('GET /api/users/:id — admin gets user by ID', async () => {
    const r = await request('GET', `/api/users/${adminUserId}`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/users/999999 — not found → 404', async () => {
    const r = await request('GET', '/api/users/999999', null, adminToken);
    return check(r, 404);
  });

  await test('GET /api/users/abc — invalid ID → 422', async () => {
    const r = await request('GET', '/api/users/abc', null, adminToken);
    return check(r, 422);
  });
}

async function runTeacherTests() {
  console.log('\n━━━ TEACHERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('GET /api/teachers — admin gets all teachers', async () => {
    const r = await request('GET', '/api/teachers', null, adminToken);
    if (r.status === 200 && r.body.data?.length > 0) {
      teacherId = r.body.data[0].id;
    }
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/teachers/my-profile — teacher gets own profile', async () => {
    const r = await request('GET', '/api/teachers/my-profile', null, teacherToken);
    return check(r, 200, (b) => !b.data?.employee_id ? 'employee_id missing' : null);
  });

  await test('GET /api/teachers/:id — admin gets teacher by ID', async () => {
    const r = await request('GET', `/api/teachers/${teacherId}`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/teachers/999999 — not found → 404', async () => {
    const r = await request('GET', '/api/teachers/999999', null, adminToken);
    return check(r, 404);
  });

  await test('PUT /api/teachers/:id — admin updates teacher', async () => {
    const r = await request('PUT', `/api/teachers/${teacherId}`, { designation: 'Senior Professor' }, adminToken);
    return check(r, 200);
  });

  await test('PUT /api/teachers/:id/approve — admin approves teacher', async () => {
    const r = await request('PUT', `/api/teachers/${teacherId}/approve`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/teachers — student forbidden → 403', async () => {
    const r = await request('GET', '/api/teachers', null, studentToken);
    return check(r, 403);
  });
}

async function runStudentTests() {
  console.log('\n━━━ STUDENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('GET /api/students — admin gets all students', async () => {
    const r = await request('GET', '/api/students', null, adminToken);
    if (r.status === 200 && r.body.data?.length > 0) {
      studentId = r.body.data[0].id;
    }
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/students?department=Computer Science — filter', async () => {
    const r = await request('GET', '/api/students?department=Computer%20Science', null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/students/my-profile — student gets own profile', async () => {
    const r = await request('GET', '/api/students/my-profile', null, studentToken);
    return check(r, 200, (b) => !b.data?.roll_number ? 'roll_number missing' : null);
  });

  await test('GET /api/students/:id — admin gets student by ID', async () => {
    const r = await request('GET', `/api/students/${studentId}`, null, adminToken);
    return check(r, 200);
  });

  await test('PUT /api/students/:id — admin updates student', async () => {
    const r = await request('PUT', `/api/students/${studentId}`, { address: '123 Updated Street, Mumbai' }, adminToken);
    return check(r, 200);
  });

  await test('GET /api/students/999999 — not found → 404', async () => {
    const r = await request('GET', '/api/students/999999', null, adminToken);
    return check(r, 404);
  });
}

async function runCourseTests() {
  console.log('\n━━━ COURSES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('POST /api/courses — admin creates course', async () => {
    const ts = Date.now();
    const r = await request('POST', '/api/courses', {
      course_name: `Test Course ${ts}`,
      course_code: `TC${ts % 100000}`,
      semester: 3,
      department: 'Computer Science',
      credits: 3,
    }, adminToken);
    if (r.status === 201) courseId = r.body.data?.id;
    return check(r, 201, (b) => !b.data?.id ? 'id missing' : null);
  });

  await test('GET /api/courses — admin gets all courses', async () => {
    const r = await request('GET', '/api/courses', null, adminToken);
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/courses — teacher gets own courses', async () => {
    const r = await request('GET', '/api/courses', null, teacherToken);
    return check(r, 200);
  });

  await test('GET /api/courses — student gets all courses', async () => {
    const r = await request('GET', '/api/courses', null, studentToken);
    return check(r, 200);
  });

  await test('GET /api/courses/:id — admin gets course by ID', async () => {
    const r = await request('GET', `/api/courses/${courseId}`, null, adminToken);
    return check(r, 200);
  });

  await test('PUT /api/courses/:id — admin updates course', async () => {
    const r = await request('PUT', `/api/courses/${courseId}`, { credits: 4 }, adminToken);
    return check(r, 200);
  });

  await test('PUT /api/courses/:id/assign-teacher — assign teacher', async () => {
    const r = await request('PUT', `/api/courses/${courseId}/assign-teacher`, { teacher_id: teacherId }, adminToken);
    return check(r, 200);
  });

  await test('POST /api/courses — missing fields → 422', async () => {
    const r = await request('POST', '/api/courses', { course_name: 'Incomplete' }, adminToken);
    return check(r, 422);
  });

  await test('DELETE /api/courses/:id — admin deletes course', async () => {
    const r = await request('DELETE', `/api/courses/${courseId}`, null, adminToken);
    return check(r, 204);
  });
}

async function runAttendanceTests() {
  console.log('\n━━━ ATTENDANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('POST /api/attendance — admin records attendance', async () => {
    const r = await request('POST', '/api/attendance', {
      student_id: studentId,
      course_id: 1,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
    }, adminToken);
    if (r.status === 201) attendanceId = r.body.data?.id;
    // 201 = created, 409 = conflict (already exists for today) — both OK
    const ok = r.status === 201 || r.status === 409;
    if (!ok) return fail(r.status, `Unexpected status: ${JSON.stringify(r.body).substring(0,200)}`);
    if (r.status === 201) attendanceId = r.body.data?.id;
    return pass(r.status);
  });

  await test('GET /api/attendance — admin gets all attendance', async () => {
    const r = await request('GET', '/api/attendance', null, adminToken);
    if (r.status === 200 && r.body.data?.length > 0 && !attendanceId) {
      attendanceId = r.body.data[0].id;
    }
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/attendance — student gets own attendance', async () => {
    const r = await request('GET', '/api/attendance', null, studentToken);
    return check(r, 200);
  });

  await test('GET /api/attendance/:id — get by ID', async () => {
    if (!attendanceId) return { pass: false, status: 0, reason: 'No attendanceId available' };
    const r = await request('GET', `/api/attendance/${attendanceId}`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/attendance/summary/:studentId/:courseId', async () => {
    const r = await request('GET', `/api/attendance/summary/${studentId}/1`, null, adminToken);
    return check(r, 200, (b) => b.data?.total === undefined ? 'total missing' : null);
  });

  await test('PUT /api/attendance/:id — update status', async () => {
    if (!attendanceId) return { pass: false, status: 0, reason: 'No attendanceId available' };
    const r = await request('PUT', `/api/attendance/${attendanceId}`, { status: 'late' }, adminToken);
    return check(r, 200);
  });

  await test('POST /api/attendance/bulk — bulk attendance', async () => {
    const r = await request('POST', '/api/attendance/bulk', {
      course_id: 1,
      date: '2025-01-15',
      records: [
        { student_id: studentId, status: 'present' },
      ],
    }, adminToken);
    return check(r, 201);
  });

  await test('DELETE /api/attendance/:id — admin deletes record', async () => {
    if (!attendanceId) return { pass: false, status: 0, reason: 'No attendanceId available' };
    const r = await request('DELETE', `/api/attendance/${attendanceId}`, null, adminToken);
    return check(r, 204);
  });
}

async function runMarksTests() {
  console.log('\n━━━ MARKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('POST /api/marks — admin adds marks', async () => {
    const r = await request('POST', '/api/marks', {
      student_id: studentId,
      course_id: 2,
      exam_type: 'midterm',
      marks: 42,
      total_marks: 50,
    }, adminToken);
    if (r.status === 201) markId = r.body.data?.id;
    const ok = r.status === 201 || r.status === 409;
    if (!ok) return fail(r.status, JSON.stringify(r.body).substring(0,200));
    return pass(r.status);
  });

  await test('GET /api/marks — admin gets all marks', async () => {
    const r = await request('GET', '/api/marks', null, adminToken);
    if (r.status === 200 && r.body.data?.length > 0 && !markId) {
      markId = r.body.data[0].id;
    }
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/marks — student gets own marks', async () => {
    const r = await request('GET', '/api/marks', null, studentToken);
    return check(r, 200);
  });

  await test('GET /api/marks/:id — get mark by ID', async () => {
    if (!markId) return { pass: false, status: 0, reason: 'No markId available' };
    const r = await request('GET', `/api/marks/${markId}`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/marks/report/:studentId — marks report', async () => {
    const r = await request('GET', `/api/marks/report/${studentId}`, null, adminToken);
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'data not an array' : null);
  });

  await test('PUT /api/marks/:id — update marks', async () => {
    if (!markId) return { pass: false, status: 0, reason: 'No markId available' };
    const r = await request('PUT', `/api/marks/${markId}`, { marks: 45, total_marks: 50 }, adminToken);
    return check(r, 200);
  });

  await test('POST /api/marks — marks > total → 422', async () => {
    const r = await request('POST', '/api/marks', {
      student_id: studentId, course_id: 1,
      exam_type: 'quiz', marks: 100, total_marks: 20,
    }, adminToken);
    return check(r, 422);
  });

  await test('DELETE /api/marks/:id — admin deletes mark', async () => {
    if (!markId) return { pass: false, status: 0, reason: 'No markId available' };
    const r = await request('DELETE', `/api/marks/${markId}`, null, adminToken);
    return check(r, 204);
  });
}

async function runFeesTests() {
  console.log('\n━━━ FEES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('POST /api/fees — admin creates fee', async () => {
    const r = await request('POST', '/api/fees', {
      student_id: studentId,
      amount: 5000,
      status: 'pending',
    }, adminToken);
    if (r.status === 201) feeId = r.body.data?.id;
    return check(r, 201, (b) => !b.data?.id ? 'id missing' : null);
  });

  await test('GET /api/fees — admin gets all fees', async () => {
    const r = await request('GET', '/api/fees', null, adminToken);
    if (r.status === 200 && r.body.data?.length > 0 && !feeId) {
      feeId = r.body.data[0].id;
    }
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/fees — student gets own fees', async () => {
    const r = await request('GET', '/api/fees', null, studentToken);
    return check(r, 200);
  });

  await test('GET /api/fees/:id — get fee by ID', async () => {
    if (!feeId) return { pass: false, status: 0, reason: 'No feeId available' };
    const r = await request('GET', `/api/fees/${feeId}`, null, adminToken);
    return check(r, 200);
  });

  await test('GET /api/fees/summary/:studentId — fee summary', async () => {
    const r = await request('GET', `/api/fees/summary/${studentId}`, null, adminToken);
    return check(r, 200, (b) => b.data?.total_amount === undefined ? 'total_amount missing' : null);
  });

  await test('PUT /api/fees/:id — mark as paid', async () => {
    if (!feeId) return { pass: false, status: 0, reason: 'No feeId available' };
    const r = await request('PUT', `/api/fees/${feeId}`, {
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'online',
    }, adminToken);
    return check(r, 200);
  });

  await test('POST /api/fees — teacher forbidden → 403', async () => {
    const r = await request('POST', '/api/fees', { student_id: studentId, amount: 1000 }, teacherToken);
    return check(r, 403);
  });

  await test('DELETE /api/fees/:id — admin deletes fee', async () => {
    if (!feeId) return { pass: false, status: 0, reason: 'No feeId available' };
    const r = await request('DELETE', `/api/fees/${feeId}`, null, adminToken);
    return check(r, 204);
  });
}

async function runAnnouncementTests() {
  console.log('\n━━━ ANNOUNCEMENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('POST /api/announcements — admin creates announcement', async () => {
    const r = await request('POST', '/api/announcements', {
      title: 'Test Announcement API',
      description: 'This is a test announcement created by the API test script.',
    }, adminToken);
    if (r.status === 201) announcementId = r.body.data?.id;
    return check(r, 201, (b) => !b.data?.id ? 'id missing' : null);
  });

  await test('GET /api/announcements — admin gets all', async () => {
    const r = await request('GET', '/api/announcements', null, adminToken);
    return check(r, 200, (b) => !Array.isArray(b.data) ? 'not an array' : null);
  });

  await test('GET /api/announcements — teacher gets all', async () => {
    const r = await request('GET', '/api/announcements', null, teacherToken);
    return check(r, 200);
  });

  await test('GET /api/announcements — student gets all', async () => {
    const r = await request('GET', '/api/announcements', null, studentToken);
    return check(r, 200);
  });

  await test('GET /api/announcements/:id — get by ID', async () => {
    if (!announcementId) return { pass: false, status: 0, reason: 'No announcementId' };
    const r = await request('GET', `/api/announcements/${announcementId}`, null, adminToken);
    return check(r, 200, (b) => !b.data?.title ? 'title missing' : null);
  });

  await test('PUT /api/announcements/:id — admin updates', async () => {
    if (!announcementId) return { pass: false, status: 0, reason: 'No announcementId' };
    const r = await request('PUT', `/api/announcements/${announcementId}`, {
      title: 'Updated Test Announcement',
      description: 'This description has been updated by the API test script for verification.',
    }, adminToken);
    return check(r, 200);
  });

  await test('POST /api/announcements — teacher forbidden → 403', async () => {
    const r = await request('POST', '/api/announcements', {
      title: 'Teacher Announcement', description: 'Teachers should not be able to post announcements.',
    }, teacherToken);
    return check(r, 403);
  });

  await test('DELETE /api/announcements/:id — admin deletes', async () => {
    if (!announcementId) return { pass: false, status: 0, reason: 'No announcementId' };
    const r = await request('DELETE', `/api/announcements/${announcementId}`, null, adminToken);
    return check(r, 204);
  });
}

async function runAuthMiddlewareTests() {
  console.log('\n━━━ AUTH & ROLE MIDDLEWARE ━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await test('Protected route — no token → 401', async () => {
    const r = await request('GET', '/api/students');
    return check(r, 401);
  });

  await test('Protected route — malformed token → 401', async () => {
    const r = await request('GET', '/api/students', null, 'bad.token.value');
    return check(r, 401);
  });

  await test('Admin-only route — student token → 403', async () => {
    const r = await request('GET', '/api/users', null, studentToken);
    return check(r, 403);
  });

  await test('Student-only route — admin token → 403', async () => {
    const r = await request('GET', '/api/students/my-profile', null, adminToken);
    return check(r, 403);
  });

  await test('404 handler — unknown route', async () => {
    const r = await request('GET', '/api/nonexistent/route');
    return check(r, 404);
  });
}

// ─── Main runner ──────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Student Management System — API Test Suite          ║');
  console.log(`║   Target: ${BASE_URL.padEnd(44)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  const start = Date.now();

  await runHealthCheck();
  await runAuthTests();
  await runUserTests();
  await runTeacherTests();
  await runStudentTests();
  await runCourseTests();
  await runAttendanceTests();
  await runMarksTests();
  await runFeesTests();
  await runAnnouncementTests();
  await runAuthMiddlewareTests();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests:   ${String(testNum).padEnd(37)}║`);
  console.log(`║  Passed:        ${String(results.passed.length).padEnd(37)}║`);
  console.log(`║  Failed:        ${String(results.failed.length).padEnd(37)}║`);
  console.log(`║  Errors:        ${String(results.errors.length).padEnd(37)}║`);
  console.log(`║  Duration:      ${String(elapsed + 's').padEnd(37)}║`);
  const pct = Math.round((results.passed.length / testNum) * 100);
  console.log(`║  Pass Rate:     ${String(pct + '%').padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (results.failed.length > 0) {
    console.log('\n── Failed Tests ──');
    results.failed.forEach(f => console.log(`  [${f.id}] ${f.name} (HTTP ${f.status}): ${f.reason}`));
  }

  if (results.errors.length > 0) {
    console.log('\n── Test Errors (Exceptions) ──');
    results.errors.forEach(e => console.log(`  [${e.id}] ${e.name}: ${e.error}`));
  }

  // Write JSON results to file
  const fs = require('fs');
  fs.writeFileSync('test_results.json', JSON.stringify({
    summary: {
      total: testNum,
      passed: results.passed.length,
      failed: results.failed.length,
      errors: results.errors.length,
      passRate: pct + '%',
      duration: elapsed + 's',
      timestamp: new Date().toISOString(),
    },
    passed: results.passed,
    failed: results.failed,
    errors: results.errors,
  }, null, 2));
  console.log('\n  📄 Results saved to test_results.json\n');

  process.exit(results.failed.length + results.errors.length > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal test error:', err.message);
  process.exit(1);
});
