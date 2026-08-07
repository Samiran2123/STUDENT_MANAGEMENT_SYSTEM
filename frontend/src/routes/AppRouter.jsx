import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../utils/constants';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';

// Public & Auth Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Admin Sub-Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StudentsPage from '../pages/admin/StudentsPage';
import TeachersPage from '../pages/admin/TeachersPage';
import CoursesPage from '../pages/admin/CoursesPage';
import AttendancePage from '../pages/admin/AttendancePage';
import MarksPage from '../pages/admin/MarksPage';
import FeesPage from '../pages/admin/FeesPage';
import AnnouncementsPage from '../pages/admin/AnnouncementsPage';
import UsersPage from '../pages/admin/UsersPage';

// Teacher Sub-Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherCoursesPage from '../pages/teacher/TeacherCoursesPage';
import TeacherStudentsPage from '../pages/teacher/TeacherStudentsPage';
import TeacherAttendancePage from '../pages/teacher/TeacherAttendancePage';
import TeacherMarksPage from '../pages/teacher/TeacherMarksPage';
import TeacherAnnouncementsPage from '../pages/teacher/TeacherAnnouncementsPage';

// Student Sub-Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentCoursesPage from '../pages/student/StudentCoursesPage';
import StudentAttendancePage from '../pages/student/StudentAttendancePage';
import StudentMarksPage from '../pages/student/StudentMarksPage';
import StudentFeesPage from '../pages/student/StudentFeesPage';
import StudentAnnouncementsPage from '../pages/student/StudentAnnouncementsPage';
import StudentNotificationsPage from '../pages/student/StudentNotificationsPage';

// Shared
import ProfilePage from '../pages/shared/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="marks" element={<MarksPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCoursesPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="marks" element={<TeacherMarksPage />} />
          <Route path="announcements" element={<TeacherAnnouncementsPage />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="marks" element={<StudentMarksPage />} />
          <Route path="fees" element={<StudentFeesPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
        </Route>
      </Route>

      {/* Shared Protected Profile Route */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]} />}>
        <Route path="/profile" element={<AdminLayout />}>
          <Route index element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRouter;
