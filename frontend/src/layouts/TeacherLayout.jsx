import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  FiGrid, FiBookOpen, FiUsers, FiCheckSquare, 
  FiAward, FiVolume2, FiUser 
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

const TeacherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const teacherNavLinks = [
    { path: '/teacher', label: 'Dashboard', icon: <FiGrid />, end: true },
    { path: '/teacher/courses', label: 'Assigned Courses', icon: <FiBookOpen /> },
    { path: '/teacher/students', label: 'Enrolled Students', icon: <FiUsers /> },
    { path: '/teacher/attendance', label: 'Take Attendance', icon: <FiCheckSquare /> },
    { path: '/teacher/marks', label: 'Grade & Marks', icon: <FiAward /> },
    { path: '/teacher/announcements', label: 'Announcements', icon: <FiVolume2 /> },
    { path: '/profile', label: 'My Profile', icon: <FiUser /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar links={teacherNavLinks} isOpen={sidebarOpen} />
        <main
          style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="animate-fade-in"
        >
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
