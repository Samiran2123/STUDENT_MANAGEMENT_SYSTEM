/**
 * ================================================================
 * STUDENT MANAGEMENT SYSTEM — DATABASE SEED SCRIPT
 * ================================================================
 * Creates demo data:
 *   - 1 Admin
 *   - 3 Teachers
 *   - 20 Students
 *   - 5 Courses
 *   - Attendance records (30 days back for each student/course)
 *   - Marks (5 exam types per student/course)
 *   - Fees (2 records per student)
 *   - 5 Announcements
 *
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING
 * or checks existence before inserting.
 * ================================================================
 * Usage:
 *   node seed.js
 * ================================================================
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

// ─── Colour helpers ────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

const log = {
  info:    (msg) => console.log(c.cyan(`  ℹ  ${msg}`)),
  success: (msg) => console.log(c.green(`  ✅ ${msg}`)),
  warn:    (msg) => console.log(c.yellow(`  ⚠  ${msg}`)),
  error:   (msg) => console.log(c.red(`  ❌ ${msg}`)),
  section: (msg) => console.log(c.bold(`\n━━━ ${msg} ${'━'.repeat(Math.max(0, 50 - msg.length))}`)),
};

// ─── Hash helper ───────────────────────────────────────────────
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const hashPassword = (pwd) => bcrypt.hash(pwd, SALT_ROUNDS);

// ─── Seed data definitions ─────────────────────────────────────

const ADMIN = {
  name:     'Dr. Admin Khan',
  email:    'admin@sms.edu',
  password: 'Admin@123',
  phone:    '+919876543210',
  role:     'admin',
};

const TEACHERS = [
  {
    user: { name: 'Prof. Rajesh Sharma', email: 'r.sharma@sms.edu', password: 'Teacher@123', phone: '+919811111111', role: 'teacher' },
    profile: { employee_id: 'EMP001', department: 'Computer Science', designation: 'Associate Professor', qualification: 'PhD in Computer Science', experience: 12 },
  },
  {
    user: { name: 'Dr. Priya Nair',     email: 'p.nair@sms.edu',    password: 'Teacher@123', phone: '+919811222222', role: 'teacher' },
    profile: { employee_id: 'EMP002', department: 'Mathematics',     designation: 'Assistant Professor',  qualification: 'PhD in Applied Mathematics', experience: 8 },
  },
  {
    user: { name: 'Mr. Arjun Mehta',   email: 'a.mehta@sms.edu',   password: 'Teacher@123', phone: '+919811333333', role: 'teacher' },
    profile: { employee_id: 'EMP003', department: 'Physics',         designation: 'Lecturer',              qualification: 'M.Sc Physics, M.Tech', experience: 5 },
  },
];

const STUDENTS_DATA = [
  { name: 'Aarav Singh',    email: 'aarav.singh@student.sms.edu',    phone: '+919900000001', roll: 'CS2024001', dept: 'Computer Science', sem: 4, year: 2024, gender: 'male',   dob: '2003-05-14', guardian: 'Ravi Singh',    gphone: '+919800000001' },
  { name: 'Ananya Sharma',  email: 'ananya.sharma@student.sms.edu',  phone: '+919900000002', roll: 'CS2024002', dept: 'Computer Science', sem: 4, year: 2024, gender: 'female', dob: '2003-08-22', guardian: 'Vinod Sharma',  gphone: '+919800000002' },
  { name: 'Aryan Patel',    email: 'aryan.patel@student.sms.edu',    phone: '+919900000003', roll: 'CS2024003', dept: 'Computer Science', sem: 4, year: 2024, gender: 'male',   dob: '2003-03-10', guardian: 'Kiran Patel',   gphone: '+919800000003' },
  { name: 'Diya Verma',     email: 'diya.verma@student.sms.edu',     phone: '+919900000004', roll: 'CS2024004', dept: 'Computer Science', sem: 4, year: 2024, gender: 'female', dob: '2003-11-30', guardian: 'Suresh Verma',  gphone: '+919800000004' },
  { name: 'Ishaan Kumar',   email: 'ishaan.kumar@student.sms.edu',   phone: '+919900000005', roll: 'CS2024005', dept: 'Computer Science', sem: 4, year: 2024, gender: 'male',   dob: '2003-07-19', guardian: 'Mohan Kumar',   gphone: '+919800000005' },
  { name: 'Kavya Reddy',    email: 'kavya.reddy@student.sms.edu',    phone: '+919900000006', roll: 'CS2024006', dept: 'Computer Science', sem: 4, year: 2024, gender: 'female', dob: '2003-02-08', guardian: 'Raju Reddy',    gphone: '+919800000006' },
  { name: 'Laksh Gupta',    email: 'laksh.gupta@student.sms.edu',    phone: '+919900000007', roll: 'CS2024007', dept: 'Computer Science', sem: 2, year: 2025, gender: 'male',   dob: '2004-09-25', guardian: 'Prem Gupta',    gphone: '+919800000007' },
  { name: 'Meera Joshi',    email: 'meera.joshi@student.sms.edu',    phone: '+919900000008', roll: 'CS2024008', dept: 'Computer Science', sem: 2, year: 2025, gender: 'female', dob: '2004-06-17', guardian: 'Anil Joshi',    gphone: '+919800000008' },
  { name: 'Nikhil Agarwal', email: 'nikhil.agarwal@student.sms.edu', phone: '+919900000009', roll: 'MA2024001', dept: 'Mathematics',     sem: 4, year: 2024, gender: 'male',   dob: '2003-12-03', guardian: 'Vijay Agarwal', gphone: '+919800000009' },
  { name: 'Pooja Iyer',     email: 'pooja.iyer@student.sms.edu',     phone: '+919900000010', roll: 'MA2024002', dept: 'Mathematics',     sem: 4, year: 2024, gender: 'female', dob: '2003-04-27', guardian: 'Srinivas Iyer', gphone: '+919800000010' },
  { name: 'Rahul Mishra',   email: 'rahul.mishra@student.sms.edu',   phone: '+919900000011', roll: 'MA2024003', dept: 'Mathematics',     sem: 4, year: 2024, gender: 'male',   dob: '2003-10-15', guardian: 'Shiv Mishra',   gphone: '+919800000011' },
  { name: 'Riya Chauhan',   email: 'riya.chauhan@student.sms.edu',   phone: '+919900000012', roll: 'MA2024004', dept: 'Mathematics',     sem: 2, year: 2025, gender: 'female', dob: '2004-01-20', guardian: 'Dev Chauhan',   gphone: '+919800000012' },
  { name: 'Samar Khan',     email: 'samar.khan@student.sms.edu',     phone: '+919900000013', roll: 'PH2024001', dept: 'Physics',         sem: 4, year: 2024, gender: 'male',   dob: '2003-06-11', guardian: 'Akbar Khan',    gphone: '+919800000013' },
  { name: 'Shruti Das',     email: 'shruti.das@student.sms.edu',     phone: '+919900000014', roll: 'PH2024002', dept: 'Physics',         sem: 4, year: 2024, gender: 'female', dob: '2003-09-07', guardian: 'Bablu Das',     gphone: '+919800000014' },
  { name: 'Tanish Bose',    email: 'tanish.bose@student.sms.edu',    phone: '+919900000015', roll: 'PH2024003', dept: 'Physics',         sem: 2, year: 2025, gender: 'male',   dob: '2004-03-29', guardian: 'Pradip Bose',   gphone: '+919800000015' },
  { name: 'Usha Pillai',    email: 'usha.pillai@student.sms.edu',    phone: '+919900000016', roll: 'CS2024009', dept: 'Computer Science', sem: 6, year: 2023, gender: 'female', dob: '2002-07-04', guardian: 'Nair Pillai',   gphone: '+919800000016' },
  { name: 'Varun Tiwari',   email: 'varun.tiwari@student.sms.edu',   phone: '+919900000017', roll: 'CS2024010', dept: 'Computer Science', sem: 6, year: 2023, gender: 'male',   dob: '2002-11-16', guardian: 'Arun Tiwari',   gphone: '+919800000017' },
  { name: 'Wendy Joseph',   email: 'wendy.joseph@student.sms.edu',   phone: '+919900000018', roll: 'MA2024005', dept: 'Mathematics',     sem: 6, year: 2023, gender: 'female', dob: '2002-05-21', guardian: 'Roy Joseph',    gphone: '+919800000018' },
  { name: 'Yash Dubey',     email: 'yash.dubey@student.sms.edu',     phone: '+919900000019', roll: 'PH2024004', dept: 'Physics',         sem: 6, year: 2023, gender: 'male',   dob: '2002-08-09', guardian: 'Ram Dubey',     gphone: '+919800000019' },
  { name: 'Zara Sheikh',    email: 'zara.sheikh@student.sms.edu',    phone: '+919900000020', roll: 'CS2024011', dept: 'Computer Science', sem: 2, year: 2025, gender: 'female', dob: '2004-12-18', guardian: 'Salim Sheikh',  gphone: '+919800000020' },
];

const COURSES_DATA = [
  { course_name: 'Data Structures & Algorithms', course_code: 'CS301', semester: 4, department: 'Computer Science', credits: 4, teacherIdx: 0 },
  { course_name: 'Operating Systems',            course_code: 'CS302', semester: 4, department: 'Computer Science', credits: 3, teacherIdx: 0 },
  { course_name: 'Calculus & Linear Algebra',    course_code: 'MA201', semester: 4, department: 'Mathematics',     credits: 4, teacherIdx: 1 },
  { course_name: 'Discrete Mathematics',         course_code: 'MA202', semester: 4, department: 'Mathematics',     credits: 3, teacherIdx: 1 },
  { course_name: 'Classical Mechanics',          course_code: 'PH301', semester: 4, department: 'Physics',         credits: 4, teacherIdx: 2 },
];

const ANNOUNCEMENTS_DATA = [
  {
    title: 'Mid-Semester Examination Schedule Released',
    description: 'The mid-semester examination schedule for the current semester has been officially released. Students are advised to check the academic portal for their individual timetables. The exams will begin from the second week of next month. All students must carry their ID cards to the examination hall.',
  },
  {
    title: 'Library Extended Hours During Exams',
    description: 'The central library will remain open until 10:00 PM during the examination period to support students in their preparation. Students can access all digital resources, reference books, and quiet study zones. Borrowing limits have been temporarily increased to 10 books per student.',
  },
  {
    title: 'Annual Cultural Fest Registration Open',
    description: 'We are thrilled to announce that our Annual Cultural Festival Utsav 2026 will be held from August 20 to 22. Students are invited to participate in various events including dance, music, drama, and literary competitions. Registration forms are available at the student services desk. Last date to register is August 15.',
  },
  {
    title: 'Fee Payment Deadline Final Notice',
    description: 'This is a reminder that the fee payment deadline for the current semester is approaching. Students who have not yet cleared their dues are requested to make the payment by the end of this month to avoid late fees and suspension of access to college resources. Contact the accounts department for any queries.',
  },
  {
    title: 'New Online Learning Resources Available',
    description: 'The college has subscribed to Coursera for Campus, providing all students and faculty with free access to thousands of online courses and certifications. You can log in using your institutional email ID. This subscription includes courses in programming, data science, business, arts, and many more domains.',
  },
];

// ─── Utility ───────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const ATTENDANCE_STATUSES = ['present', 'present', 'present', 'present', 'absent', 'late', 'excused'];

// ─── Main seed function ────────────────────────────────────────

async function seed() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     Student Management System - Seed Script          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // ── 1. Admin ──────────────────────────────────────────────
    log.section('1. Admin User');

    const adminPwd = await hashPassword(ADMIN.password);
    const adminRes = await client.query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, role`,
      [ADMIN.name, ADMIN.email, adminPwd, ADMIN.phone, ADMIN.role]
    );
    const adminUser = adminRes.rows[0];
    log.success(`Admin: ${adminUser.name} <${adminUser.email}> [ID: ${adminUser.id}]`);

    // ── 2. Teachers ───────────────────────────────────────────
    log.section('2. Teachers');

    const teacherProfiles = [];
    for (const t of TEACHERS) {
      const pwd = await hashPassword(t.user.password);
      const uRes = await client.query(
        `INSERT INTO users (name, email, password, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, email, role`,
        [t.user.name, t.user.email, pwd, t.user.phone, t.user.role]
      );
      const user = uRes.rows[0];

      const tRes = await client.query(
        `INSERT INTO teachers (user_id, employee_id, department, designation, qualification, experience, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (user_id) DO UPDATE SET
           employee_id   = EXCLUDED.employee_id,
           department    = EXCLUDED.department,
           designation   = EXCLUDED.designation,
           qualification = EXCLUDED.qualification,
           experience    = EXCLUDED.experience
         RETURNING *`,
        [user.id, t.profile.employee_id, t.profile.department, t.profile.designation, t.profile.qualification, t.profile.experience]
      );
      teacherProfiles.push(tRes.rows[0]);
      log.success(`Teacher: ${user.name} [User ID: ${user.id}, Teacher ID: ${tRes.rows[0].id}]`);
    }

    // ── 3. Students ───────────────────────────────────────────
    log.section('3. Students (20)');

    const studentProfiles = [];
    for (const s of STUDENTS_DATA) {
      const pwd = await hashPassword('Student@123');
      const uRes = await client.query(
        `INSERT INTO users (name, email, password, phone, role)
         VALUES ($1, $2, $3, $4, 'student')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, email`,
        [s.name, s.email, pwd, s.phone]
      );
      const user = uRes.rows[0];

      const sRes = await client.query(
        `INSERT INTO students
           (user_id, roll_number, department, semester, year, gender, dob, address, guardian_name, guardian_phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
         ON CONFLICT (user_id) DO UPDATE SET
           roll_number   = EXCLUDED.roll_number,
           department    = EXCLUDED.department,
           semester      = EXCLUDED.semester,
           year          = EXCLUDED.year
         RETURNING *`,
        [
          user.id, s.roll, s.dept, s.sem, s.year, s.gender, s.dob,
          `${randomBetween(1, 999)} Main Street, Mumbai, Maharashtra`,
          s.guardian, s.gphone,
        ]
      );
      studentProfiles.push(sRes.rows[0]);
      log.success(`Student: ${user.name} [${s.roll}] (${s.dept}, Sem ${s.sem})`);
    }

    // ── 4. Courses ────────────────────────────────────────────
    log.section('4. Courses (5)');

    const courseIds = [];
    for (const co of COURSES_DATA) {
      const teacherId = teacherProfiles[co.teacherIdx] ? teacherProfiles[co.teacherIdx].id : null;
      const cRes = await client.query(
        `INSERT INTO courses (course_name, course_code, semester, department, credits, teacher_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (course_code) DO UPDATE SET
           course_name = EXCLUDED.course_name,
           semester    = EXCLUDED.semester,
           credits     = EXCLUDED.credits,
           teacher_id  = EXCLUDED.teacher_id
         RETURNING *`,
        [co.course_name, co.course_code, co.semester, co.department, co.credits, teacherId]
      );
      courseIds.push(cRes.rows[0].id);
      log.success(`Course: ${co.course_name} [${co.course_code}] -> Teacher ID: ${teacherId}`);
    }

    // ── 5. Attendance ─────────────────────────────────────────
    log.section('5. Attendance Records');

    // Map courses to relevant student indexes
    const courseAssignments = [
      [0, [0,1,2,3,4,5,6,7,15,16,19]],  // CS301 -> CS students
      [1, [0,1,2,3,4,5,15,16]],          // CS302 -> CS sem4
      [2, [8,9,10,11,17]],               // MA201 -> MA students
      [3, [8,9,10,11,17]],               // MA202 -> MA students
      [4, [12,13,14,18]],                // PH301 -> Physics students
    ];

    let attendanceCount = 0;
    for (const [courseIdx, studentIdxs] of courseAssignments) {
      const courseId   = courseIds[courseIdx];
      const teacherIdx = COURSES_DATA[courseIdx].teacherIdx;
      const teacherId  = teacherProfiles[teacherIdx] ? teacherProfiles[teacherIdx].id : null;

      for (const sIdx of studentIdxs) {
        const studentId = studentProfiles[sIdx] ? studentProfiles[sIdx].id : null;
        if (!studentId) continue;

        for (let day = 1; day <= 30; day++) {
          const date   = dateNDaysAgo(day);
          const status = ATTENDANCE_STATUSES[Math.floor(Math.random() * ATTENDANCE_STATUSES.length)];

          await client.query(
            `INSERT INTO attendance (student_id, course_id, teacher_id, date, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (student_id, course_id, date) DO UPDATE SET status = EXCLUDED.status`,
            [studentId, courseId, teacherId, date, status]
          );
          attendanceCount++;
        }
      }
    }
    log.success(`Inserted/updated ${attendanceCount} attendance records`);

    // ── 6. Marks ──────────────────────────────────────────────
    log.section('6. Marks');

    const EXAM_TYPES  = ['midterm', 'final', 'quiz', 'assignment', 'practical'];
    const EXAM_TOTALS = { midterm: 50, final: 100, quiz: 20, assignment: 30, practical: 40 };
    let marksCount = 0;

    for (const [courseIdx, studentIdxs] of courseAssignments) {
      const courseId   = courseIds[courseIdx];
      const teacherIdx = COURSES_DATA[courseIdx].teacherIdx;
      const teacherId  = teacherProfiles[teacherIdx] ? teacherProfiles[teacherIdx].id : null;

      for (const sIdx of studentIdxs) {
        const studentId = studentProfiles[sIdx] ? studentProfiles[sIdx].id : null;
        if (!studentId) continue;

        for (const exam_type of EXAM_TYPES) {
          const total_marks = EXAM_TOTALS[exam_type];
          const rawMarks = Math.random() * total_marks * 0.6 + total_marks * 0.35;
          const marks = parseFloat(Math.min(rawMarks, total_marks).toFixed(2));

          await client.query(
            `INSERT INTO marks (student_id, course_id, teacher_id, exam_type, marks, total_marks)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (student_id, course_id, exam_type) DO UPDATE SET
               marks       = EXCLUDED.marks,
               total_marks = EXCLUDED.total_marks`,
            [studentId, courseId, teacherId, exam_type, marks, total_marks]
          );
          marksCount++;
        }
      }
    }
    log.success(`Inserted/updated ${marksCount} marks records`);

    // ── 7. Fees ───────────────────────────────────────────────
    log.section('7. Fees');

    let feesCount = 0;
    for (const sp of studentProfiles) {
      // Paid fee
      const existPaid = await client.query(
        `SELECT id FROM fees WHERE student_id = $1 AND status = 'paid' AND amount = 25000 LIMIT 1`,
        [sp.id]
      );
      if (existPaid.rows.length === 0) {
        await client.query(
          `INSERT INTO fees (student_id, amount, status, payment_date, payment_method)
           VALUES ($1, 25000, 'paid', $2, 'online')`,
          [sp.id, dateNDaysAgo(45)]
        );
        feesCount++;
      }

      // Pending fee
      const existPending = await client.query(
        `SELECT id FROM fees WHERE student_id = $1 AND status = 'pending' AND amount = 25000 LIMIT 1`,
        [sp.id]
      );
      if (existPending.rows.length === 0) {
        await client.query(
          `INSERT INTO fees (student_id, amount, status, payment_date, payment_method)
           VALUES ($1, 25000, 'pending', NULL, NULL)`,
          [sp.id]
        );
        feesCount++;
      }
    }
    log.success(`Inserted ${feesCount} new fee records`);

    // ── 8. Announcements ──────────────────────────────────────
    log.section('8. Announcements');

    let annoCount = 0;
    for (const ann of ANNOUNCEMENTS_DATA) {
      const existing = await client.query(
        `SELECT id FROM announcements WHERE title = $1 LIMIT 1`,
        [ann.title]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO announcements (title, description, created_by) VALUES ($1, $2, $3)`,
          [ann.title, ann.description, adminUser.id]
        );
        annoCount++;
      } else {
        log.warn(`Announcement already exists: "${ann.title.substring(0, 40)}..." skipped`);
      }
    }
    log.success(`Inserted ${annoCount} new announcement(s)`);

    // ── Summary ───────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║               Seed Complete!                          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Admins:        1                                     ║`);
    console.log(`║  Teachers:      ${TEACHERS.length}                                     ║`);
    console.log(`║  Students:      ${STUDENTS_DATA.length}                                    ║`);
    console.log(`║  Courses:       ${COURSES_DATA.length}                                     ║`);
    console.log(`║  Attendance:    ${attendanceCount} records                        ║`);
    console.log(`║  Marks:         ${marksCount} records                          ║`);
    console.log(`║  Fees:          ${studentProfiles.length * 2} records (total expected)       ║`);
    console.log(`║  Announcements: ${ANNOUNCEMENTS_DATA.length}                                     ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║           Login Credentials (Demo)                    ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Admin:   admin@sms.edu          / Admin@123          ║');
    console.log('║  Teacher: r.sharma@sms.edu       / Teacher@123        ║');
    console.log('║  Teacher: p.nair@sms.edu         / Teacher@123        ║');
    console.log('║  Teacher: a.mehta@sms.edu        / Teacher@123        ║');
    console.log('║  Student: aarav.singh@student.sms.edu / Student@123   ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

  } catch (err) {
    log.error(`Seed failed: ${err.message}`);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
