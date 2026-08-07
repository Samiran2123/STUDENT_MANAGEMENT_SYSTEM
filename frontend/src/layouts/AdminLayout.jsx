import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  FiGrid, FiUsers, FiBookOpen, FiUserCheck, FiCheckSquare, 
  FiAward, FiDollarSign, FiVolume2, FiShield, FiUser 
} from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const adminNavLinks = [
    { path: '/admin', label: 'Dashboard', icon: <FiGrid />, end: true },
    { path: '/admin/students', label: 'Students', icon: <FiUsers /> },
    { path: '/admin/teachers', label: 'Teachers', icon: <FiUserCheck /> },
    { path: '/admin/courses', label: 'Courses', icon: <FiBookOpen /> },
    { path: '/admin/attendance', label: 'Attendance', icon: <FiCheckSquare /> },
    { path: '/admin/marks', label: 'Marks & Grading', icon: <FiAward /> },
    { path: '/admin/fees', label: 'Fee Management', icon: <FiDollarSign /> },
    { path: '/admin/announcements', label: 'Announcements', icon: <FiVolume2 /> },
    { path: '/admin/users', label: 'User Accounts', icon: <FiShield /> },
    { path: '/profile', label: 'My Profile', icon: <FiUser /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar links={adminNavLinks} isOpen={sidebarOpen} />
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

export default AdminLayout;
