-- =============================================
-- ERP MIGRATION SCRIPT
-- =============================================

-- 1. Create Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  year_name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false
);

-- 2. Create Classes
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

ALTER TABLE classes ADD COLUMN IF NOT EXISTS degree VARCHAR(50);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS year_level INTEGER;

-- 3. Create Sections
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  UNIQUE (class_id, name)
);

-- 4. Create Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL
);

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS degree VARCHAR(50);

-- 5. Class Subjects Mapping
CREATE TABLE IF NOT EXISTS class_subjects (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (class_id, subject_id)
);

-- 6. Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  UNIQUE (class_id, academic_year_id)
);

ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS tuition_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS exam_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS library_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS other_fee NUMERIC(10,2) DEFAULT 0;

-- 7. Alter Students Table to support Pending Admissions and ERP references
ALTER TABLE students 
  ALTER COLUMN roll_number DROP NOT NULL,
  ALTER COLUMN department DROP NOT NULL,
  ALTER COLUMN semester DROP NOT NULL,
  ALTER COLUMN year DROP NOT NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS degree VARCHAR(50),
  ADD COLUMN IF NOT EXISTS student_code VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS admission_status VARCHAR(20) DEFAULT 'pending';

-- 8. Student Subjects (Assigned explicitly)
CREATE TABLE IF NOT EXISTS student_subjects (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, subject_id)
);

-- 9. Student Fees (ERP style / Fee Ledger)
CREATE TABLE IF NOT EXISTS erp_student_fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id INTEGER NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE erp_student_fees ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE erp_student_fees ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE erp_student_fees ADD COLUMN IF NOT EXISTS pending_amount NUMERIC(10,2) DEFAULT 0;

-- 10. Payments
CREATE TABLE IF NOT EXISTS erp_payments (
  id SERIAL PRIMARY KEY,
  student_fee_id INTEGER NOT NULL REFERENCES erp_student_fees(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'online', 'cheque', 'bank_transfer')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pending_approval',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE erp_payments ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE erp_payments ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(100);

