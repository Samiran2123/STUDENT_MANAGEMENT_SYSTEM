import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, FiAward, FiDollarSign, FiBookOpen, 
  FiVolume2, FiClock, FiUserCheck 
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';
import { marksService } from '../../services/marksService';
import { feesService } from '../../services/feesService';
import { announcementService } from '../../services/announcementService';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [marksList, setMarksList] = useState([]);
  const [feesList, setFeesList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const [subjectsList, setSubjectsList] = useState([]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, mRes, fRes, annRes] = await Promise.all([
        studentService.getById('my-profile'),
        attendanceService.getAll({ limit: 100 }),
        marksService.getAll({ limit: 100 }),
        feesService.getAll({ limit: 100 }),
        announcementService.getAll({ limit: 5 }),
      ]);

      setStudentProfile(pRes.data);
      setAttendanceList(aRes.data || []);
      setMarksList(mRes.data || []);
      setFeesList(fRes.data || []);
      setAnnouncements(annRes.data || []);

      if (pRes.data && pRes.data.id) {
        const subRes = await studentService.getSubjects(pRes.data.id);
        setSubjectsList(subRes.data || []);
      }
    } catch (err) {
      console.error('Student dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner text="Loading student academic portal..." />;
  }

  // Calculate overall attendance percentage
  const totalAtt = attendanceList.length;
  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const attPct = totalAtt > 0 ? ((presentCount / totalAtt) * 100).toFixed(1) : '100.0';

  // Calculate overall average grade %
  let totalScore = 0;
  let totalMax = 0;
  marksList.forEach((m) => {
    totalScore += parseFloat(m.marks) || 0;
    totalMax += parseFloat(m.total_marks) || 0;
  });
  const gradePct = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 'N/A';

  // Calculate fee totals
  let pendingFees = 0;
  feesList.forEach((f) => {
    if (f.status === 'pending') pendingFees += parseFloat(f.amount) || 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Portal</h1>
          <StatusBadge status="student" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Welcome, <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Student'}</strong>
          {studentProfile && ` • Roll: ${studentProfile.roll_number || 'N/A'} (Class: ${studentProfile.class_name || studentProfile.department || 'N/A'})`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to="/profile"
            className="glass-panel glass-panel-hover"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            My Profile Details
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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Attendance Rate</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiCheckCircle />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: parseFloat(attPct) >= 75 ? 'var(--success)' : 'var(--warning)' }}>
            {attPct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {presentCount} of {totalAtt} Sessions Attended
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Overall Score %</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiAward />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {gradePct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {marksList.length} Exam Evaluations
          </div>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Outstanding Fees</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiDollarSign />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingFees > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {formatCurrency(pendingFees)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pendingFees > 0 ? 'Dues Pending Payment' : 'All Clear'}
          </div>
        </div>
      </div>

      {/* Grid: Academic Entries & Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Exam Marks */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAward style={{ color: 'var(--accent)' }} /> Recent Marks
            </h3>
            <Link to="/student/marks" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
              Full Report Card
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {marksList.slice(0, 5).map((m) => {
              const pct = ((m.marks / m.total_marks) * 100).toFixed(1);
              return (
                <div
                  key={m.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{m.course_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.exam_type} Exam</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{m.marks} / {m.total_marks}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiVolume2 style={{ color: 'var(--secondary)' }} /> Campus Notices
            </h3>
            <Link to="/student/announcements" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
              View All
            </Link>
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

        {/* Subjects List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookOpen style={{ color: 'var(--primary)' }} /> Assigned Subjects
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {subjectsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subjects assigned yet.</p>
            ) : (
              subjectsList.map((sub) => (
                <div key={sub.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{sub.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Code: {sub.code}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
