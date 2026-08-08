# Admission Workflow Report

## Overview
The student admission workflow has been successfully implemented and integrated with the ERP backend. This ensures that newly registered students cannot access the system until their admission is reviewed, approved, and processed by an administrator.

## Workflow Implementation Details

### 1. Registration
- When a new user registers with the role `student`, a corresponding student profile is automatically initialized.
- By default, the database schema sets the `admission_status` field to `pending`.

### 2. Login & Authorization
- The `login` controller in `backend/controllers/authController.js` has been updated to enforce the admission status rule.
- If a user with the role `student` attempts to log in, the system checks their `admission_status`.
- If the status is not `approved`, the system returns a `403 Forbidden` response with the message: **"Your admission is pending admin approval."**
- The JWT is **not** issued in this case.

### 3. Admin Dashboard
- The Admin Dashboard features a dedicated page for "Pending Admissions" (`AdminAdmissionsPage.jsx`).
- This page displays all students with a `pending` admission status, allowing the administrator to review them.

### 4. Admin Approval Process
- Administrators can use the Approval Wizard to process a pending admission.
- During approval, the admin assigns the following:
  - Academic Year
  - Class
  - Section
- Upon confirming the approval:
  - `admission_status` is updated to `approved`.
  - A unique **Roll Number** is generated based on the class and section.
  - A unique **Student ID** (Code) is generated based on the academic year.
  - Core subjects mapped to the assigned class are automatically linked to the student.
  - The applicable fee structure is bound to the student.

### 5. Post-Approval Login
- Once the admission status is set to `approved`, the login restriction is lifted.
- The student can successfully authenticate, receive a JWT, and access the application normally.

### 6. Student Dashboard Updates
- The `StudentDashboard.jsx` interface has been enhanced to reflect the assigned ERP data.
- **Class & Roll Number**: The welcome section now prominently displays the student's assigned class name and generated roll number.
- **Assigned Subjects**: A new section has been added to display the specific subjects assigned to the student based on their class.
- **Outstanding Fees**: The system correctly fetches and displays the assigned fee structure balance using the pre-existing fee integrations.

## Test Validation
- **Register Student**: Verified that creating a new student correctly sets status to pending.
- **Cannot Login**: Verified that a newly registered student receives a 403 response with the appropriate message upon login attempt.
- **Admin Approves**: Verified the functionality of the Approval Wizard mapping the Academic Year, Class, Section, Roll No, Subjects, and Fee Structure successfully.
- **Student Can Login**: Verified that post-approval login correctly issues a JWT.
- **Dashboard Shows Assigned Data**: Verified that the student portal displays the newly assigned Class and Subjects correctly.

The overall admission approval flow is now secure and correctly enforced.
