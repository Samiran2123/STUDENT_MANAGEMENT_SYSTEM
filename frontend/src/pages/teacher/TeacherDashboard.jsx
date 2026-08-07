import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBookOpen, FiUsers, FiCheckSquare, FiAward, FiVolume2, FiClock, FiPlusCircle 
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { attendanceService } from '../../services/attendanceService';
import { marksService } from '../../services/marksService';
import { announcementService } from '../../services/announcementService';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatters';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [marksCount, setMarksCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes, mRes, annRes] = await Promise.all([
        courseService.getAll({ limit: 50 }),
        attendanceService.getAll({ limit: 10 }),
        marksService.getAll({ limit: 10 }),
        announcementService.getAll({ limit: 5 }),
      ]);

      const myCourses = cRes.data || [];
      setCourses(myCourses);
      setAttendanceCount(aRes.pagination?.total || (aRes.data || []).length);
      setMarksCount(mRes.pagination?.total || (mRes.data || []).length);
      setAnnouncements(annRes.data || []);
    } catch (err) {
      console.error('Teacher dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner text="Loading faculty workspace..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(79, 70, 229, 0.15) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Faculty Command Center</h1>
            <StatusBadge status="teacher" />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Professor'}</strong>. Connected to your live assigned courses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to="/teacher/attendance"
            className="gradient-accent"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <FiCheckSquare /> Mark Class Attendance
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Assigned Courses</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiBookOpen />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{courses.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Active Subject Offerings</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Attendance Logs</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiCheckSquare />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{attendanceCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Logged Presence Sessions</div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Grade Submissions</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiAward />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{marksCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Evaluated Exam Entries</div>
        </div>
      </div>

      {/* Courses & Quick Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Assigned Courses Widget */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookOpen style={{ color: 'var(--secondary)' }} /> My Assigned Courses
            </h3>
            <Link to="/teacher/courses" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {courses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No courses currently assigned.</p>
            ) : (
              courses.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>{c.course_code}</div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{c.course_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.department} • Sem {c.semester}</div>
                  </div>

                  <Link
                    to={`/teacher/attendance?course_id=${c.id}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    Attendance
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campus Announcements Widget */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiVolume2 style={{ color: 'var(--accent)' }} /> Campus Notices
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {announcements.map((ann) => (
              <div key={ann.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{ann.title}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.4 }}>
                  {ann.description.substring(0, 100)}...
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{formatDate(ann.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
