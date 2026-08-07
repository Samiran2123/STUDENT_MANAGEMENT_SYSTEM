import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiCheckSquare, FiUsers } from 'react-icons/fi';
import { attendanceService } from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const TeacherAttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [singleForm, setSingleForm] = useState({
    student_id: '',
    course_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
  });

  const [bulkForm, setBulkForm] = useState({
    course_id: '',
    date: new Date().toISOString().split('T')[0],
    records: [],
  });

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({
        page,
        limit: 10,
        course_id: selectedCourse || undefined,
        status: selectedStatus || undefined,
        date: selectedDate || undefined,
      });
      if (res.success) {
        setAttendance(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        studentService.getAll({ limit: 100 }),
        courseService.getAll({ limit: 100 }),
      ]);
      setStudents(sRes.data || []);
      setCourses(cRes.data || []);

      if (sRes.data?.length > 0 && cRes.data?.length > 0) {
        setSingleForm((prev) => ({
          ...prev,
          student_id: sRes.data[0].id,
          course_id: cRes.data[0].id,
        }));
        setBulkForm((prev) => ({
          ...prev,
          course_id: cRes.data[0].id,
          records: sRes.data.map((s) => ({ student_id: s.id, status: 'present' })),
        }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [page, selectedCourse, selectedStatus, selectedDate]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceService.record({
        student_id: parseInt(singleForm.student_id),
        course_id: parseInt(singleForm.course_id),
        date: singleForm.date,
        status: singleForm.status,
      });
      if (res.success) {
        showToast.success('Attendance recorded');
        setSingleModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to record attendance');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceService.recordBulk({
        course_id: parseInt(bulkForm.course_id),
        date: bulkForm.date,
        records: bulkForm.records,
      });
      if (res.success) {
        showToast.success(`Bulk attendance recorded for ${res.data?.count || 0} students`);
        setBulkModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Bulk attendance failed');
    }
  };

  const handleEditClick = (rec) => {
    setSelectedRecord(rec);
    setSingleForm((prev) => ({ ...prev, status: rec.status }));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceService.update(selectedRecord.id, { status: singleForm.status });
      if (res.success) {
        showToast.success('Attendance status updated');
        setEditModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Class Attendance Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Record daily or bulk presence for your assigned courses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setSingleModalOpen(true)}
            className="glass-panel glass-panel-hover"
            style={{ padding: '10px 18px', color: '#fff', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FiPlus /> Single Record
          </button>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="gradient-accent"
            style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)' }}
          >
            <FiCheckSquare /> Bulk Session
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedCourse}
          onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading attendance history..." />
      ) : attendance.length === 0 ? (
        <EmptyState title="No Attendance Logs" message="No presence records found." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Roll No</th>
                <th style={{ padding: '14px 18px' }}>Course</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{formatDate(rec.date)}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{rec.student_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>{rec.roll_number}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{rec.course_name} ({rec.course_code})</td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={rec.status} /></td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button onClick={() => handleEditClick(rec)} style={{ padding: '6px 12px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600 }}>
                      <FiEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Single Record Modal */}
      <Modal isOpen={singleModalOpen} onClose={() => setSingleModalOpen(false)} title="Record Attendance">
        <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Student *</label>
            <select
              value={singleForm.student_id}
              onChange={(e) => setSingleForm({ ...singleForm, student_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Course *</label>
            <select
              value={singleForm.course_id}
              onChange={(e) => setSingleForm({ ...singleForm, course_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Date</label>
              <input
                type="date"
                value={singleForm.date}
                onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
              <select
                value={singleForm.status}
                onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Submit Attendance
          </button>
        </form>
      </Modal>

      {/* Bulk Attendance Modal */}
      <Modal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Course Attendance Session" maxWidth="650px">
        <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course *</label>
              <select
                value={bulkForm.course_id}
                onChange={(e) => setBulkForm({ ...bulkForm, course_id: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Date *</label>
              <input
                type="date"
                value={bulkForm.date}
                onChange={(e) => setBulkForm({ ...bulkForm, date: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>Student</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '8px' }}>{s.name} ({s.roll_number})</td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={bulkForm.records[idx]?.status || 'present'}
                        onChange={(e) => {
                          const updated = [...bulkForm.records];
                          updated[idx] = { student_id: s.id, status: e.target.value };
                          setBulkForm({ ...bulkForm, records: updated });
                        }}
                        style={{ padding: '4px 8px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', borderRadius: '4px' }}
                      >
                        {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Record Session ({students.length} Students)
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Attendance Status">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select
              value={singleForm.status}
              onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Update Status
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherAttendancePage;
