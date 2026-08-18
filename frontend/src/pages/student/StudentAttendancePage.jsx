import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiDownload, FiBookOpen, FiCalendar, FiActivity } from 'react-icons/fi';
import { attendanceService } from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const StudentAttendancePage = () => {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch student profile for student ID
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentService.getMyProfile();
        if (res.success) {
          setProfile(res.data);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchProfile();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({
        page,
        limit: 15,
        status: selectedStatus || undefined,
      });
      if (res.success) {
        setAttendance(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [page, selectedStatus]);

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!profile?.id) {
      showToast.error('Student profile not loaded');
      return;
    }
    setDownloadingPdf(true);
    try {
      const filename = `attendance_report_${(profile.roll_number || profile.name).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      await attendanceService.downloadStudentAttendancePDF(profile.id, filename);
      showToast.success('Your Attendance Report PDF has been downloaded!');
    } catch (err) {
      showToast.error('Failed to download attendance PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Calculate course-wise aggregation from loaded records
  const courseMap = {};
  attendance.forEach((rec) => {
    const cName = rec.course_name || 'General Subject';
    if (!courseMap[cName]) {
      courseMap[cName] = {
        name: cName,
        code: rec.course_code || '—',
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
      };
    }
    courseMap[cName].total += 1;
    if (rec.status === 'present') courseMap[cName].present += 1;
    else if (rec.status === 'absent') courseMap[cName].absent += 1;
    else if (rec.status === 'late') courseMap[cName].late += 1;
  });

  const courseList = Object.values(courseMap);
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === 'present').length;
  const absent = attendance.filter((a) => a.status === 'absent').length;
  const pct = total > 0 ? (((present + attendance.filter((a) => a.status === 'late').length) / total) * 100).toFixed(1) : '100.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Academic Attendance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track your semester attendance records, course-wise presence, and download your official PDF report.
          </p>
        </div>

        {profile && (
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="gradient-accent"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
              cursor: downloadingPdf ? 'not-allowed' : 'pointer',
            }}
          >
            <FiDownload /> {downloadingPdf ? 'Generating PDF...' : 'Download Attendance PDF'}
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Lectures</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{total}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Conducted sessions</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Attended (Present)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>{present}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verified presence</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Missed (Absent)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>{absent}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unattended sessions</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Presence Percentage</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: parseFloat(pct) >= 75 ? 'var(--success)' : 'var(--danger)', marginTop: '4px' }}>
            {pct}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>75% required for exams</div>
        </div>
      </div>

      {/* Course-Wise Attendance Summary Table */}
      {courseList.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBookOpen style={{ color: 'var(--accent)' }} /> Course-Wise Attendance Breakdown
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Course Title</th>
                  <th style={{ padding: '10px 14px' }}>Code</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Present</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Absent</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Presence %</th>
                </tr>
              </thead>
              <tbody>
                {courseList.map((c, i) => {
                  const coursePct = c.total > 0 ? (((c.present + c.late) / c.total) * 100).toFixed(0) : '100';
                  const isEligible = parseFloat(coursePct) >= 75;

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>{c.name}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--primary)', fontWeight: 700 }}>{c.code}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{c.total}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>{c.present}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--danger)' }}>{c.absent}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: isEligible ? 'var(--success)' : 'var(--danger)' }}>
                        {coursePct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Date-wise Detailed Attendance History */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCalendar style={{ color: 'var(--primary)' }} /> Session Log History
          </h3>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Presence Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>

        {loading ? (
          <Spinner text="Loading attendance history..." />
        ) : attendance.length === 0 ? (
          <EmptyState title="No Attendance Records" message="No presence logs recorded yet." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Course Title</th>
                  <th style={{ padding: '12px 16px' }}>Code</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{formatDate(rec.date)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{rec.course_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--primary)', fontWeight: 700 }}>{rec.course_code}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={rec.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendancePage;
