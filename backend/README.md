# Student Management System — Backend

A production-ready REST API built with **Node.js**, **Express.js**, and **PostgreSQL**.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment (edit .env with your DB credentials)
cp .env .env.local

# Run the database schema
psql -U postgres -d student_management_db -f config/schema.sql

# Seed the database with demo data
node seed.js

# Start the development server
npm run dev
```

Server starts at: `http://localhost:5000`

---

## 🌱 Running the Seed Script

The seed script populates the database with realistic demo data.

### Prerequisites
- PostgreSQL running on `localhost:5432`
- Database `student_management_db` created
- `schema.sql` executed (tables created)

### Run the Seed

```bash
# From the backend directory:
node seed.js
```

### What It Creates

| Entity | Count | Details |
|--------|-------|---------|
| Admin | 1 | `admin@sms.edu` / `Admin@123` |
| Teachers | 3 | `r.sharma@sms.edu`, `p.nair@sms.edu`, `a.mehta@sms.edu` — all use `Teacher@123` |
| Students | 20 | CS, Mathematics, Physics departments — all use `Student@123` |
| Courses | 5 | CS301, CS302, MA201, MA202, PH301 |
| Attendance | 990 | 30 days of historical attendance per student/course |
| Marks | 165 | 5 exam types (midterm, final, quiz, assignment, practical) |
| Fees | 40 | 2 fee records per student (1 paid, 1 pending) |
| Announcements | 5 | Realistic institutional announcements |

### Idempotency

The seed script is **safe to run multiple times**. It uses:
- `INSERT ... ON CONFLICT DO UPDATE` for users, teachers, students, courses, attendance, marks
- Existence checks (`SELECT ... LIMIT 1`) for fees and announcements

Running it again updates existing records without creating duplicates.

### Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@sms.edu` | `Admin@123` |
| Teacher | `r.sharma@sms.edu` | `Teacher@123` |
| Teacher | `p.nair@sms.edu` | `Teacher@123` |
| Teacher | `a.mehta@sms.edu` | `Teacher@123` |
| Student | `aarav.singh@student.sms.edu` | `Student@123` |
| Student | `ananya.sharma@student.sms.edu` | `Student@123` |
| *(all 20 students)* | `[name]@student.sms.edu` | `Student@123` |

---

## 🧪 Running API Tests

```bash
# Make sure the server is running first:
npm run dev

# In a separate terminal, run the test suite:
node test_api.js
```

Results are printed to console and saved to `test_results.json`.

**Test coverage: 77 tests covering all endpoints, auth, roles, and validation.**

---

## 📬 Postman Collection

Import `SMS_API_Collection.postman_collection.json` into Postman:

1. Open Postman → **Import** → select the file
2. Run **Auth > Login (Admin)** → token auto-saves to `{{adminToken}}`
3. Run **Auth > Login (Teacher)** → saves to `{{teacherToken}}`
4. Run **Auth > Login (Student)** → saves to `{{studentToken}}`
5. Use any other request — tokens and IDs are pre-configured

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

| Resource | Endpoints |
|----------|-----------|
| Auth | POST `/auth/register`, POST `/auth/login`, GET `/auth/profile`, PUT `/auth/profile`, POST `/auth/logout` |
| Users | GET `/users`, GET `/users/:id`, DELETE `/users/:id` |
| Students | POST, GET `/students`, GET `/students/my-profile`, GET/PUT/DELETE `/students/:id` |
| Teachers | POST, GET `/teachers`, GET `/teachers/my-profile`, GET/PUT/DELETE `/teachers/:id`, PUT `/teachers/:id/approve` |
| Courses | POST, GET `/courses`, GET/PUT/DELETE `/courses/:id`, PUT `/courses/:id/assign-teacher` |
| Attendance | POST, GET `/attendance`, POST `/attendance/bulk`, GET `/attendance/summary/:sId/:cId`, GET/PUT/DELETE `/attendance/:id` |
| Marks | POST, GET `/marks`, GET `/marks/report/:studentId`, GET/PUT/DELETE `/marks/:id` |
| Fees | POST, GET `/fees`, GET `/fees/summary/:studentId`, GET/PUT/DELETE `/fees/:id` |
| Announcements | POST, GET `/announcements`, GET/PUT/DELETE `/announcements/:id` |

---

## 🔑 Authentication

All protected routes require a Bearer token:

```
Authorization: Bearer <token>
```

Tokens are returned on successful login/register.

### Role Permissions

| Role | Access |
|------|--------|
| **admin** | Full access to all endpoints |
| **teacher** | Read students, manage own courses/attendance/marks |
| **student** | Read-only own profile, marks, attendance, fees |

---

## 🗄️ Database Schema

Tables: `users`, `students`, `teachers`, `courses`, `attendance`, `marks`, `fees`, `announcements`

See [`config/schema.sql`](config/schema.sql) for full schema with constraints and indexes.

---

## 🏗️ Project Structure

```
backend/
├── config/
│   ├── db.js              # PostgreSQL connection pool
│   └── schema.sql         # Database schema
├── controllers/           # Route handlers (business logic)
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── authorize.js       # Role-based authorization
│   ├── errorHandler.js    # Centralized error handling
│   └── upload.js          # Multer file upload
├── models/                # SQL query layer
├── routes/                # Express router definitions
├── utils/
│   ├── apiResponse.js     # Standardized response helpers
│   ├── asyncHandler.js    # Async error wrapper
│   └── validators/        # express-validator rules
├── seed.js                # Database seed script
├── test_api.js            # Automated API test suite
├── SMS_API_Collection.postman_collection.json
└── server.js              # Express app entry point
```
