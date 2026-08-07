-- =============================================
-- STUDENT MANAGEMENT SYSTEM DATABASE SCHEMA
-- =============================================

-- Drop tables if they exist (order matters for FK constraints)
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(150)        UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  phone       VARCHAR(20),
  role        VARCHAR(20)         NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at  TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- STUDENTS TABLE
-- =============================================
CREATE TABLE students (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roll_number     VARCHAR(50)     UNIQUE NOT NULL,
  department      VARCHAR(100)    NOT NULL,
  semester        INTEGER         NOT NULL CHECK (semester BETWEEN 1 AND 10),
  year            INTEGER         NOT NULL,
  gender          VARCHAR(10)     CHECK (gender IN ('male', 'female', 'other')),
  dob             DATE,
  address         TEXT,
  photo           VARCHAR(255),
  guardian_name   VARCHAR(100),
  guardian_phone  VARCHAR(20),
  status          VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- =============================================
-- TEACHERS TABLE
-- =============================================
CREATE TABLE teachers (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER       UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id   VARCHAR(50)   UNIQUE NOT NULL,
  department    VARCHAR(100)  NOT NULL,
  designation   VARCHAR(100),
  qualification VARCHAR(200),
  experience    INTEGER       DEFAULT 0,
  photo         VARCHAR(255),
  status        VARCHAR(20)   DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'))
);

-- =============================================
-- COURSES TABLE
-- =============================================
CREATE TABLE courses (
  id          SERIAL PRIMARY KEY,
  course_name VARCHAR(150)  NOT NULL,
  course_code VARCHAR(50)   UNIQUE NOT NULL,
  semester    INTEGER       NOT NULL CHECK (semester BETWEEN 1 AND 10),
  department  VARCHAR(100)  NOT NULL,
  credits     INTEGER       NOT NULL CHECK (credits > 0),
  teacher_id  INTEGER       REFERENCES teachers(id) ON DELETE SET NULL
);

-- =============================================
-- ATTENDANCE TABLE
-- =============================================
CREATE TABLE attendance (
  id          SERIAL PRIMARY KEY,
  student_id  INTEGER       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   INTEGER       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id  INTEGER       REFERENCES teachers(id) ON DELETE SET NULL,
  date        DATE          NOT NULL,
  status      VARCHAR(20)   NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  UNIQUE (student_id, course_id, date)
);

-- =============================================
-- MARKS TABLE
-- =============================================
CREATE TABLE marks (
  id          SERIAL PRIMARY KEY,
  student_id  INTEGER       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   INTEGER       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id  INTEGER       REFERENCES teachers(id) ON DELETE SET NULL,
  exam_type   VARCHAR(50)   NOT NULL CHECK (exam_type IN ('midterm', 'final', 'quiz', 'assignment', 'practical')),
  marks       NUMERIC(5,2)  NOT NULL CHECK (marks >= 0),
  total_marks NUMERIC(5,2)  NOT NULL CHECK (total_marks > 0),
  UNIQUE (student_id, course_id, exam_type)
);

-- =============================================
-- FEES TABLE
-- =============================================
CREATE TABLE fees (
  id              SERIAL PRIMARY KEY,
  student_id      INTEGER       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status          VARCHAR(20)   DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  payment_date    DATE,
  payment_method  VARCHAR(50)   CHECK (payment_method IN ('cash', 'online', 'cheque', 'bank_transfer')),
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE announcements (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NOT NULL,
  created_by  INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_students_user_id       ON students(user_id);
CREATE INDEX idx_students_department    ON students(department);
CREATE INDEX idx_teachers_user_id       ON teachers(user_id);
CREATE INDEX idx_courses_teacher_id     ON courses(teacher_id);
CREATE INDEX idx_courses_department     ON courses(department);
CREATE INDEX idx_attendance_student_id  ON attendance(student_id);
CREATE INDEX idx_attendance_course_id   ON attendance(course_id);
CREATE INDEX idx_attendance_date        ON attendance(date);
CREATE INDEX idx_marks_student_id       ON marks(student_id);
CREATE INDEX idx_marks_course_id        ON marks(course_id);
CREATE INDEX idx_fees_student_id        ON fees(student_id);
CREATE INDEX idx_fees_status            ON fees(status);
CREATE INDEX idx_announcements_created  ON announcements(created_at);
