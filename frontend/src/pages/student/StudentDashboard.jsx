import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, FiAward, FiDollarSign, FiBookOpen, 
  FiVolume2, FiClock, FiUserCheck, FiLayers, FiCalendar, FiUser
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';
import { marksService } from '../../services/marksService';
import { feesService } from '../../services/feesService';
import { erpService } from '../../services/erpService';
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
  const [erpLedger, setErpLedger] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, mRes, fRes, annRes, ledgerRes] = await Promise.all([
        studentService.getById('my-profile'),
        attendanceService.getAll({ limit: 100 }).catch(() => ({ success: false, data: [] })),
        marksService.getAll({ limit: 100 }).catch(() => ({ success: false, data: [] })),
        feesService.getAll({ limit: 100 }).catch(() => ({ success: false, data: [] })),
        announcementService.getAll({ limit: 5 }).catch(() => ({ success: false, data: [] })),
        erpService.getStudentLedger().catch(() => ({ success: false, data: {} })),
      ]);

      setStudentProfile(pRes.data);
      setAttendanceList(aRes.data || []);
      setMarksList(mRes.data || []);
      setFeesList(fRes.data || []);
      setAnnouncements(annRes.data || []);
      if (ledgerRes.success && ledgerRes.data) {
        setErpLedger(ledgerRes.data.ledger || []);
      }

      if (pRes.data && pRes.data.id) {
        const subRes = await studentService.getSubjects(pRes.data.id).catch(() => ({ success: false, data: [] }));
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

  // Calculate fee totals (combining ERP ledger and fees table)
  let pendingFees = 0;
  if (erpLedger.length > 0) {
    erpLedger.forEach((item) => {
      pendingFees += parseFloat(item.pending_amount) || 0;
    });
  } else {
    feesList.forEach((f) => {
      if (f.status === 'pending') pendingFees += parseFloat(f.amount) || 0;
    });
  }

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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Academic Portal</h1>
            <StatusBadge status={studentProfile?.admission_status === 'approved' ? 'approved' : 'active'} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Student'}</strong>!
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

      {/* Assigned Academic Enrollment Profile Card */}
      {studentProfile && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'rgba(15, 23, 42, 0.65)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            <FiUserCheck style={{ color: 'var(--accent)', fontSize: '1.2rem' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Official Academic Profile & Enrollment</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Student ID</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                {studentProfile.student_code || `STU${studentProfile.id}`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Roll Number</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.roll_number || 'Pending'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Degree / Program</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.degree || 'BCA'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.department || 'Computer Science'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Class</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.class_name || `${studentProfile.degree || 'BCA'} 1st Year`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Section</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.section_name ? `Section ${studentProfile.section_name}` : 'Section A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Semester</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                Semester {studentProfile.semester || 1}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Academic Year</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {studentProfile.academic_year_name || '2026-2027'}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Assigned Subjects</span>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiBookOpen />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
            {subjectsList.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active Curriculum Subjects
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {pendingFees > 0 ? 'Dues Pending Payment' : 'All Clear'}
            </span>
            <Link to="/student/fees" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
              Pay / View Fees →
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Academic Entries & Announcements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Subjects List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookOpen style={{ color: 'var(--primary)' }} /> Assigned Curriculum Subjects
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {subjectsList.length} Subjects
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {subjectsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subjects assigned yet.</p>
            ) : (
              subjectsList.map((sub) => (
                <div key={sub.id} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{sub.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {sub.code} • Sem {sub.semester || 1}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent)', fontWeight: 700 }}>
                    Enrolled
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

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
            {marksList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exam marks recorded yet.</p>
            ) : (
              marksList.slice(0, 5).map((m) => {
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
              })
            )}
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
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No announcements available.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{ann.title}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.4 }}>
                    {ann.description.substring(0, 100)}...
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{formatDate(ann.created_at)}</div>
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
