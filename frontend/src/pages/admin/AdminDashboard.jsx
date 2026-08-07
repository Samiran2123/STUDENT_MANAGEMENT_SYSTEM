import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiUserCheck, FiBookOpen, FiDollarSign, FiVolume2, FiShield,
  FiTrendingUp, FiActivity, FiCheckCircle, FiClock
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { teacherService } from '../../services/teacherService';
import { courseService } from '../../services/courseService';
import { feesService } from '../../services/feesService';
import { announcementService } from '../../services/announcementService';
import { userService } from '../../services/userService';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    teachersCount: 0,
    coursesCount: 0,
    feesCount: 0,
    announcementsCount: 0,
    usersCount: 0,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [feeStats, setFeeStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, coursesRes, feesRes, annRes, usersRes] = await Promise.all([
        studentService.getAll({ limit: 100 }),
        teacherService.getAll({ limit: 100 }),
        courseService.getAll({ limit: 100 }),
        feesService.getAll({ limit: 100 }),
        announcementService.getAll({ limit: 5 }),
        userService.getAll({ limit: 100 }),
      ]);

      const students = studentsRes.data || [];
      const teachers = teachersRes.data || [];
      const courses = coursesRes.data || [];
      const fees = feesRes.data || [];
      const ann = annRes.data || [];
      const users = usersRes.data || [];

      setStats({
        studentsCount: studentsRes.pagination?.total || students.length,
        teachersCount: teachersRes.pagination?.total || teachers.length,
        coursesCount: coursesRes.pagination?.total || courses.length,
        feesCount: feesRes.pagination?.total || fees.length,
        announcementsCount: annRes.pagination?.total || ann.length,
        usersCount: usersRes.pagination?.total || users.length,
      });

      setAnnouncements(ann.slice(0, 5));

      // Calculate Department distribution for charts
      const deptMap = {};
      students.forEach((s) => {
        const d = s.department || 'Other';
        deptMap[d] = (deptMap[d] || 0) + 1;
      });
      const deptData = Object.keys(deptMap).map((k) => ({ name: k, value: deptMap[k] }));
      setDeptDistribution(deptData.length ? deptData : [
        { name: 'Computer Science', value: 11 },
        { name: 'Mathematics', value: 5 },
        { name: 'Physics', value: 4 },
      ]);

      // Calculate Fee status distribution
      let paidSum = 0;
      let pendingSum = 0;
      fees.forEach((f) => {
        const amt = parseFloat(f.amount) || 0;
        if (f.status === 'paid') paidSum += amt;
        else if (f.status === 'pending') pendingSum += amt;
      });
      setFeeStats([
        { name: 'Paid Fees', amount: paidSum },
        { name: 'Pending Fees', amount: pendingSum },
      ]);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner text="Loading real-time system metrics..." />;
  }

  const statCards = [
    { title: 'Total Students', value: stats.studentsCount, icon: <FiUsers />, color: 'var(--primary)', desc: 'Active Enrolled' },
    { title: 'Faculty Members', value: stats.teachersCount, icon: <FiUserCheck />, color: 'var(--secondary)', desc: 'Professors & TAs' },
    { title: 'Active Courses', value: stats.coursesCount, icon: <FiBookOpen />, color: 'var(--accent)', desc: 'Curriculum Subjects' },
    { title: 'Fee Transactions', value: stats.feesCount, icon: <FiDollarSign />, color: 'var(--success)', desc: 'Total Records' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Admin Executive Dashboard</h1>
            <StatusBadge status="admin" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Administrator'}</strong>. Real-time PostgreSQL database feed.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="glass-panel glass-panel-hover"
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiActivity style={{ color: 'var(--success)' }} /> Refresh Data
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {statCards.map((item, idx) => (
          <div key={idx} className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {item.icon}
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{item.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Department Distribution Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Students by Department
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Fee Financial Breakdown (₹)
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={feeStats}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiVolume2 style={{ color: 'var(--accent)' }} /> Latest Campus Announcements
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{announcements.length} Posted</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>{ann.title}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  <FiClock /> {formatDate(ann.created_at)}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
                {ann.description}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                By: {ann.created_by_name || 'Admin'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
