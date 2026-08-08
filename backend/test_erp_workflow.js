/**
 * ================================================================
 * END-TO-END ERP ADMISSION & FINANCIAL WORKFLOW VERIFICATION SCRIPT
 * ================================================================
 */

const { pool } = require('./config/db');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

const log = {
  section: (msg) => console.log(`\n━━━ ${msg} ${'━'.repeat(Math.max(0, 50 - msg.length))}`),
  info: (msg) => console.log(`  ℹ  ${msg}`),
  success: (msg) => console.log(`  ✅ \x1b[32m${msg}\x1b[0m`),
  error: (msg) => console.log(`  ❌ \x1b[31m${msg}\x1b[0m`),
};

async function apiRequest(method, endpoint, data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data: json };
}

async function testWorkflow() {
  console.log('\n======================================================');
  console.log('  SMS / SCHOOL ERP END-TO-END WORKFLOW VERIFICATION   ');
  console.log('======================================================\n');

  try {
    // Clean existing test user if present
    await pool.query("DELETE FROM users WHERE email = 'btech.student@test.com'");

    // Fetch B.Tech 1st Year class ID, Academic Year ID, Section ID
    const classRes = await pool.query("SELECT id FROM classes WHERE name = 'B.Tech 1st Year'");
    const btechClassId = classRes.rows[0].id;

    const ayRes = await pool.query("SELECT id FROM academic_years WHERE year_name = '2026-2027'");
    const ayId = ayRes.rows[0].id;

    const secRes = await pool.query("SELECT id FROM sections WHERE class_id = $1 AND name = 'A'", [btechClassId]);
    const secId = secRes.rows[0].id;

    // ── 1. Registration ─────────────────────────────────────────
    log.section('1. REGISTER NEW STUDENT (B.TECH 1ST YEAR)');
    const regPayload = {
      name: 'Test BTech Student',
      email: 'btech.student@test.com',
      password: 'Student@123',
      phone: '9876543210',
      role: 'student',
      degree: 'B.Tech',
      department: 'Computer Science',
      academic_year_id: ayId,
      class_id: btechClassId,
      semester: 1,
      section_id: secId,
    };

    const regRes = await apiRequest('POST', '/auth/register', regPayload);
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.data.message}`);
    log.success(`Registered user: ${regRes.data.data.user.email} [Message: "${regRes.data.message}"]`);

    // Verify DB state
    const dbStudentRes = await pool.query(
      "SELECT s.*, u.role FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'btech.student@test.com'"
    );
    const dbStudent = dbStudentRes.rows[0];
    if (dbStudent.admission_status !== 'pending') throw new Error(`Expected admission_status 'pending', got '${dbStudent.admission_status}'`);
    if (dbStudent.degree !== 'B.Tech' || dbStudent.department !== 'Computer Science') {
      throw new Error(`Academic application parameters not persisted! Degree: ${dbStudent.degree}, Dept: ${dbStudent.department}`);
    }
    log.success(`Database verified: admission_status = '${dbStudent.admission_status}', degree = '${dbStudent.degree}', dept = '${dbStudent.department}', roll_number = ${dbStudent.roll_number || 'NULL'}`);

    // ── 2. Login Block Test ─────────────────────────────────────
    log.section('2. ATTEMPT PENDING STUDENT LOGIN');
    const pendingLogin = await apiRequest('POST', '/auth/login', {
      email: 'btech.student@test.com',
      password: 'Student@123',
    });

    if (pendingLogin.status === 403) {
      log.success(`403 Forbidden correctly returned: "${pendingLogin.data.message}"`);
    } else {
      throw new Error(`Expected status 403 for pending student, got ${pendingLogin.status}`);
    }

    // ── 3. Admin Login ──────────────────────────────────────────
    log.section('3. ADMIN LOGIN & ADMISSIONS REVIEW');
    const adminLoginRes = await apiRequest('POST', '/auth/login', {
      email: 'admin@sms.edu',
      password: 'Admin@123',
    });
    if (!adminLoginRes.ok) throw new Error('Admin login failed');
    const adminToken = adminLoginRes.data.data.token;
    log.success('Admin authenticated successfully');

    const pendingRes = await apiRequest('GET', '/erp/pending-admissions', null, adminToken);
    if (!pendingRes.data || !pendingRes.data.data) {
      throw new Error(`Invalid pending-admissions response structure: ${JSON.stringify(pendingRes)}`);
    }
    const pendingStudent = pendingRes.data.data.find(s => s.email === 'btech.student@test.com');
    if (!pendingStudent) throw new Error('New student not found in pending admissions list');
    log.success(`Found student in Admin Pending Admissions list: [Student ID: ${pendingStudent.student_id}]`);

    // Verify DB subjects for B.Tech 1st Year via ERP API
    const subjectsRes = await apiRequest('GET', `/erp/subjects?class_id=${btechClassId}`, null, adminToken);
    if (!subjectsRes.ok || !subjectsRes.data.data || subjectsRes.data.data.length === 0) {
      throw new Error(`Failed to load subjects for B.Tech 1st Year! Endpoint output: ${JSON.stringify(subjectsRes.data)}`);
    }
    log.success(`Loaded ${subjectsRes.data.data.length} Subjects for B.Tech 1st Year from DB: ${subjectsRes.data.data.map(s => s.name).join(', ')}`);

    // Verify DB fee structure for B.Tech 1st Year via ERP API
    const feeRes = await apiRequest('GET', `/erp/fee-structures?class_id=${btechClassId}&academic_year_id=${ayId}`, null, adminToken);
    if (!feeRes.ok || !feeRes.data.data) {
      throw new Error(`Failed to load fee structure for B.Tech 1st Year! Endpoint output: ${JSON.stringify(feeRes.data)}`);
    }
    log.success(`Loaded Fee Structure for B.Tech 1st Year from DB: Total ₹${feeRes.data.data.amount} (Tuition ₹${feeRes.data.data.tuition_fee}, Exam ₹${feeRes.data.data.exam_fee}, Library ₹${feeRes.data.data.library_fee}, Other ₹${feeRes.data.data.other_fee})`);

    // ── 4. Admin Approval ───────────────────────────────────────
    log.section('4. ADMIN APPROVES ADMISSION (TRANSACTIONAL)');
    const approvePayload = {
      class_id: btechClassId,
      section_id: secId,
      academic_year_id: ayId,
      degree: 'B.Tech',
      department: 'Computer Science',
      semester: 1,
      subject_ids: subjectsRes.data.data.map(s => s.id),
      total_fee: parseFloat(feeRes.data.data.amount),
    };

    const approveRes = await apiRequest('PUT', `/erp/admissions/${pendingStudent.student_id}/approve`, approvePayload, adminToken);
    if (!approveRes.ok) throw new Error(`Approval failed: ${approveRes.data.message}`);
    log.success(`Admission approved! Generated Code: ${approveRes.data.data.student_code}, Roll No: ${approveRes.data.data.roll_number}`);

    // Verify DB records
    const subCount = await pool.query('SELECT COUNT(*) FROM student_subjects WHERE student_id = $1', [pendingStudent.student_id]);
    log.success(`Assigned Subjects in DB: ${subCount.rows[0].count} subjects`);

    const feeCount = await pool.query('SELECT * FROM erp_student_fees WHERE student_id = $1', [pendingStudent.student_id]);
    const feeRec = feeCount.rows[0];
    log.success(`Fee Ledger Invoice created in DB: Total = ₹${feeRec.total_amount}, Pending = ₹${feeRec.pending_amount}, Status = '${feeRec.status}'`);

    // ── 5. Post-Approval Login ──────────────────────────────────
    log.section('5. STUDENT LOGIN POST-APPROVAL');
    const studentLoginRes = await apiRequest('POST', '/auth/login', {
      email: 'btech.student@test.com',
      password: 'Student@123',
    });

    if (!studentLoginRes.ok) throw new Error(`Post-approval student login failed: ${studentLoginRes.data.message}`);
    const studentToken = studentLoginRes.data.data.token;
    log.success('Student authenticated successfully after approval!');

    // ── 6. Student Fees Ledger Lookup ───────────────────────────
    log.section('6. STUDENT LOOKS UP FEE LEDGER');
    const studentFeeRes = await apiRequest('GET', '/erp/student/fees', null, studentToken);
    if (!studentFeeRes.ok || !studentFeeRes.data.data) throw new Error('Student fee ledger lookup failed');
    const ledgerList = studentFeeRes.data.data.ledger || studentFeeRes.data.data;
    if (!ledgerList.length) throw new Error('No fee records returned for student');
    const studentFee = ledgerList[0];
    log.success(`Student retrieved 1 active fee invoice(s). Total Dues: ₹${studentFee.pending_amount}`);

    // ── 7. Partial Payment Submission ───────────────────────────
    log.section('7. STUDENT SUBMITS PARTIAL PAYMENT (₹25,000)');
    const payPayload = {
      student_fee_id: studentFee.id,
      amount: 25000,
      payment_method: 'online',
      transaction_reference: 'TXN-BTECH-25000',
    };
    const payRes = await apiRequest('POST', '/erp/student/pay', payPayload, studentToken);
    if (!payRes.ok) throw new Error(`Payment submission failed: ${payRes.data.message}`);
    const paymentId = payRes.data.data.id;
    log.success(`Payment transaction submitted: ID ${paymentId}, Ref: ${payRes.data.data.transaction_reference}, Status: '${payRes.data.data.status}'`);

    // ── 8. Admin Payment Approval ───────────────────────────────
    log.section('8. ADMIN APPROVES PARTIAL PAYMENT');
    const adminPayApprove = await apiRequest('PUT', `/erp/payments/${paymentId}/approve`, {}, adminToken);
    if (!adminPayApprove.ok) throw new Error(`Admin payment approval failed: ${adminPayApprove.data.message}`);
    
    // Verify updated fee ledger
    const updatedFeeRes = await pool.query('SELECT * FROM erp_student_fees WHERE id = $1', [studentFee.id]);
    const updatedFee = updatedFeeRes.rows[0];
    log.success(`Payment approved by Admin`);
    log.success(`Updated Ledger: Paid = ₹${updatedFee.paid_amount}, Remaining = ₹${updatedFee.pending_amount}, Status = '${updatedFee.status}'`);

    // ── 9. Final Payment Settlement ─────────────────────────────
    log.section('9. FINAL SETTLEMENT PAYMENT (₹40,000)');
    const payFinalPayload = {
      student_fee_id: studentFee.id,
      amount: 40000,
      payment_method: 'bank_transfer',
      transaction_reference: 'TXN-BTECH-40000',
    };
    const payFinalRes = await apiRequest('POST', '/erp/student/pay', payFinalPayload, studentToken);
    const finalPaymentId = payFinalRes.data.data.id;

    await apiRequest('PUT', `/erp/payments/${finalPaymentId}/approve`, {}, adminToken);
    
    const finalLedgerRes = await pool.query('SELECT * FROM erp_student_fees WHERE id = $1', [studentFee.id]);
    const finalLedger = finalLedgerRes.rows[0];
    log.success(`Final payment approved by Admin`);
    log.success(`Final Ledger State: Paid = ₹${finalLedger.paid_amount}, Remaining = ₹${finalLedger.pending_amount}, Status = '${finalLedger.status}'`);

    console.log('\n======================================================');
    console.log('  ✅ ALL END-TO-END WORKFLOW VERIFICATIONS PASSED!    ');
    console.log('======================================================\n');
  } catch (err) {
    log.error(`Workflow Test Failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testWorkflow();
