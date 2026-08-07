import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { attendanceService } from '../../services/attendanceService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const StudentAttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Attendance History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Read-only record of your presence across all enrolled subject sessions.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiCheckCircle style={{ color: 'var(--success)', fontSize: '1.25rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presence Rate</div>
            <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>{pct}%</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Presence Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading attendance history..." />
      ) : attendance.length === 0 ? (
        <EmptyState title="No Attendance Records" message="No presence logs recorded yet." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Course Title</th>
                <th style={{ padding: '14px 18px' }}>Code</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{formatDate(rec.date)}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{rec.course_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>{rec.course_code}</td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={rec.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;
