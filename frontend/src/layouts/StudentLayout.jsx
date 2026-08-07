import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  FiGrid, FiBookOpen, FiCheckSquare, FiAward, 
  FiDollarSign, FiVolume2, FiBell, FiUser 
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const studentNavLinks = [
    { path: '/student', label: 'Dashboard', icon: <FiGrid />, end: true },
    { path: '/student/courses', label: 'Enrolled Courses', icon: <FiBookOpen /> },
    { path: '/student/attendance', label: 'My Attendance', icon: <FiCheckSquare /> },
    { path: '/student/marks', label: 'Report Card & Marks', icon: <FiAward /> },
    { path: '/student/fees', label: 'Fees & Invoices', icon: <FiDollarSign /> },
    { path: '/student/announcements', label: 'Announcements', icon: <FiVolume2 /> },
    { path: '/student/notifications', label: 'Notifications', icon: <FiBell /> },
    { path: '/profile', label: 'My Profile', icon: <FiUser /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar links={studentNavLinks} isOpen={sidebarOpen} />
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

export default StudentLayout;
