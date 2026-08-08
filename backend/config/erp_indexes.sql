-- SQL Performance Optimizations for School ERP

-- 1. Index on students (user_id) for faster lookups when joining with users
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- 2. Index on students (admission_status) for fast filtering in Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_students_admission_status ON students(admission_status);

-- 3. Indexes on foreign keys in students table
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);

-- 4. Index on student_subjects (student_id)
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);

-- 5. Indexes for fees tracking
CREATE INDEX IF NOT EXISTS idx_erp_student_fees_student_id ON erp_student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_erp_student_fees_status ON erp_student_fees(status);

-- 6. Indexes for payments
CREATE INDEX IF NOT EXISTS idx_erp_payments_student_fee_id ON erp_payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_erp_payments_status ON erp_payments(status);

-- 7. Indexes for attendance and marks
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_course_id ON marks(course_id);
