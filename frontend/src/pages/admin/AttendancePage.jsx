import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiEdit, FiTrash2, FiCheckSquare, FiFileText, 
  FiDownload, FiActivity, FiUsers, FiCalendar, FiFilter, FiCheck, FiX 
} from 'react-icons/fi';
import { attendanceService } from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import { erpService } from '../../services/erpService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // PDF Generation State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfStudentId, setPdfStudentId] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  // Preview data for PDF modal
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState(null); // { total, present, absent, late, courses[] }
  const [pdfPresetStudent, setPdfPresetStudent] = useState(null); // when opened from row PDF button

  // Modals
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Forms
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
        limit: 15,
        search: search || undefined,
        student_id: selectedStudentId || undefined,
        course_id: selectedCourse || undefined,
        class_id: selectedClass || undefined,
        section_id: selectedSection || undefined,
        status: selectedStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (res.success) {
        setAttendance(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [sRes, cRes, clsRes, secRes] = await Promise.all([
        studentService.getAll({ limit: 200 }),
        courseService.getAll({ limit: 100 }),
        erpService.getClasses(),
        erpService.getSections(),
      ]);

      const stuList = sRes.data || [];
      const crsList = cRes.data || [];
      setStudents(stuList);
      setCourses(crsList);
      setClasses(clsRes.data || []);
      setSections(secRes.data || []);

      if (stuList.length > 0) {
        setPdfStudentId(String(stuList[0].id));
      }

      if (stuList.length > 0 && crsList.length > 0) {
        setSingleForm((prev) => ({
          ...prev,
          student_id: stuList[0].id,
          course_id: crsList[0].id,
        }));
        setBulkForm((prev) => ({
          ...prev,
          course_id: crsList[0].id,
          records: stuList.map((s) => ({ student_id: s.id, status: 'present' })),
        }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [
    page, search, selectedStudentId, selectedCourse, 
    selectedClass, selectedSection, selectedStatus, dateFrom, dateTo
  ]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Open PDF modal: optionally pre-select a student from a table row
  const openPdfModal = (student = null) => {
    setPdfPreviewData(null);
    setPdfPresetStudent(student || null);
    if (student) {
      setPdfStudentId(String(student.id));
    } else if (students.length > 0) {
      setPdfStudentId(String(students[0].id));
    }
    setPdfModalOpen(true);
  };

  // Fetch real attendance summary for the selected student (for preview)
  const fetchPdfPreview = async (studentId) => {
    if (!studentId) return;
    setPdfPreviewLoading(true);
    setPdfPreviewData(null);
    try {
      const res = await attendanceService.getStudentReport(studentId);
      if (res.success) {
        const records = res.data || [];
        const total = records.length;
        const present = records.filter((r) => r.status === 'present').length;
        const late = records.filter((r) => r.status === 'late').length;
        const absent = records.filter((r) => r.status === 'absent').length;
        const excused = records.filter((r) => r.status === 'excused').length;
        const rate = total > 0 ? (((present + late) / total) * 100).toFixed(1) : '0.0';

        // Build course-wise breakdown
        const courseMap = {};
        records.forEach((r) => {
          const key = r.course_id || 'unknown';
          if (!courseMap[key]) {
            courseMap[key] = {
              name: r.course_name || 'Unknown Course',
              code: r.course_code || '—',
              total: 0, present: 0, absent: 0, late: 0,
            };
          }
          courseMap[key].total += 1;
          if (r.status === 'present') courseMap[key].present += 1;
          else if (r.status === 'absent') courseMap[key].absent += 1;
          else if (r.status === 'late') courseMap[key].late += 1;
        });

        setPdfPreviewData({
          total,
          present,
          absent,
          late,
          excused,
          rate,
          courses: Object.values(courseMap),
        });
      }
    } catch {
      // preview is optional; silently ignore
    } finally {
      setPdfPreviewLoading(false);
    }
  };

  // Fetch preview whenever the selected student changes inside the modal
  useEffect(() => {
    if (pdfModalOpen && pdfStudentId) {
      fetchPdfPreview(pdfStudentId);
    }
  }, [pdfModalOpen, pdfStudentId]);

  // Execute the actual PDF download
  const handleDownloadPDF = async () => {
    if (!pdfStudentId) {
      showToast.error('Please select a student first.');
      return;
    }
    const s = students.find((st) => String(st.id) === String(pdfStudentId));
    setPdfGenerating(true);
    try {
      const safeName = (s?.roll_number || s?.name || String(pdfStudentId)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `attendance_report_${safeName}.pdf`;
      await attendanceService.downloadStudentAttendancePDF(pdfStudentId, fileName);
      showToast.success(`Attendance PDF for ${s?.name || 'Student'} downloaded successfully!`);
      setPdfModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg) {
        showToast.error(`PDF generation failed: ${msg}`);
      } else if (err?.response?.status === 401) {
        showToast.error('Session expired. Please log in again.');
      } else {
        showToast.error('Attendance PDF generation failed. Please try again.');
      }
    } finally {
      setPdfGenerating(false);
    }
  };

  // Submit Single Attendance
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
      showToast.error(err.response?.data?.message || 'Recording failed');
    }
  };

  // Submit Bulk Attendance
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceService.recordBulk({
        course_id: parseInt(bulkForm.course_id),
        date: bulkForm.date,
        records: bulkForm.records,
      });
      if (res.success) {
        showToast.success(`Bulk attendance recorded (${res.data?.count || 0} students)`);
        setBulkModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Bulk attendance failed');
    }
  };

  // Edit Single Record
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

  // Delete Record
  const handleDeleteClick = (rec) => {
    setSelectedRecord(rec);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await attendanceService.delete(selectedRecord.id);
      if (res.success) {
        showToast.success('Attendance record deleted');
        setDeleteModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  // Summary Metrics
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;
  const currentRate = attendance.length > 0
    ? Math.round(((presentCount + lateCount) / attendance.length) * 100)
    : 85;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckSquare style={{ color: 'var(--accent)' }} /> Academic Attendance Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive institutional attendance monitoring, multi-filter analytics, and one-click PDF generation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => openPdfModal()}
            className="glass-panel glass-panel-hover"
            style={{
              padding: '10px 18px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
            }}
          >
            <FiDownload style={{ color: 'var(--accent)' }} /> Generate Attendance PDF
          </button>

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
            }}
          >
            <FiCheckSquare /> Bulk Session
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Records Logged</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{totalCount || attendance.length}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Class presence entries</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Present in Current View</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>{presentCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Attended sessions</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Absent in Current View</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', marginTop: '4px' }}>{absentCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Missed lectures</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Average Presence Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>{currentRate}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Threshold target: 75%</div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
          <FiFilter style={{ color: 'var(--accent)' }} /> Multi-Filter Roster
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <SearchBar
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search student, roll number, or course..."
            />
          </div>

          {/* Student Dropdown */}
          <select
            value={selectedStudentId}
            onChange={(e) => { setSelectedStudentId(e.target.value); setPage(1); }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roll_number})
              </option>
            ))}
          </select>

          {/* Course */}
          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name} ({c.course_code})
              </option>
            ))}
          </select>

          {/* Class */}
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Section */}
          <select
            value={selectedSection}
            onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                Sec {sec.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#121a2b',
              border: '1px solid var(--border-glass)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={dateFrom}
              placeholder="From Date"
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Date To */}
          <div>
            <input
              type="date"
              value={dateTo}
              placeholder="To Date"
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Fetching attendance logs from PostgreSQL..." />
      ) : attendance.length === 0 ? (
        <EmptyState title="No Attendance Records" message="No attendance entries found matching your selected filters." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Roll / Code</th>
                <th style={{ padding: '14px 18px' }}>Class / Section</th>
                <th style={{ padding: '14px 18px' }}>Course</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                    {formatDate(rec.date)}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{rec.student_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>
                    {rec.roll_number || rec.student_code || '—'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {rec.class_name || 'Class N/A'}
                    {rec.section_name ? ` (Sec ${rec.section_name})` : ''}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {rec.course_name} ({rec.course_code})
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={rec.status} />
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {/* One-Click Student PDF — pre-populates the modal with this student */}
                      <button
                        onClick={() => openPdfModal({ id: rec.student_id, name: rec.student_name, roll_number: rec.roll_number, class_name: rec.class_name, section_name: rec.section_name, department: rec.department, degree: rec.degree, student_code: rec.student_code })}
                        title="Generate Attendance PDF for this student"
                        style={{
                          padding: '6px 10px',
                          color: 'var(--accent)',
                          backgroundColor: 'rgba(139, 92, 246, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiDownload /> PDF
                      </button>

                      <button
                        onClick={() => handleEditClick(rec)}
                        title="Edit Record"
                        style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <FiEdit />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(rec)}
                        title="Delete Record"
                        style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* ── MODALS ── */}

      {/* ─────────────────────────────────────────────────────────────────────
          PDF Modal — rendered via React Portal (Modal.jsx) so it is never
          clipped by the AdminLayout <main overflowY:auto> container.
          The `footer` prop renders buttons in a sticky bar that never scrolls
          off-screen, regardless of how much content the modal body contains.
       ──────────────────────────────────────────────────────────────────────── */}
      {(() => {
        const selectedStudentObj = students.find((s) => String(s.id) === String(pdfStudentId));

        // Helper: safe display value
        const safe = (v) => (v && String(v).trim() && v !== 'undefined' && v !== 'null' ? v : 'Not Assigned');

        const pdfFooter = (
          <>
            <button
              type="button"
              onClick={() => { setPdfModalOpen(false); setPdfPreviewData(null); }}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#d1d5db',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pdfGenerating || !pdfStudentId}
              onClick={handleDownloadPDF}
              className="gradient-accent"
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (pdfGenerating || !pdfStudentId) ? 0.6 : 1,
                cursor: (pdfGenerating || !pdfStudentId) ? 'not-allowed' : 'pointer',
              }}
            >
              <FiDownload />
              {pdfGenerating ? 'Generating PDF…' : 'Generate Attendance PDF'}
            </button>
          </>
        );

        return (
          <Modal
            isOpen={pdfModalOpen}
            onClose={() => { setPdfModalOpen(false); setPdfPreviewData(null); }}
            title="Generate Student Attendance PDF Report"
            maxWidth="600px"
            footer={pdfFooter}
          >
            {/* ── Description ── */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Select a student to preview their attendance record and generate their official PDF report sourced directly from the database.
            </p>

            {/* ── Student Selector ── */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Student *
              </label>
              <select
                value={pdfStudentId}
                onChange={(e) => setPdfStudentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  appearance: 'auto',
                }}
              >
                <option value="" disabled>— Select a student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || 'Unknown'}
                    {s.roll_number ? ` — ${s.roll_number}` : s.student_code ? ` — ${s.student_code}` : ''}
                    {(s.department || s.degree) ? ` (${s.department || s.degree})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Student Information Card ── */}
            {selectedStudentObj && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.25)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                  Student Information
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {[
                    ['Full Name',       safe(selectedStudentObj.name)],
                    ['Student ID',      safe(selectedStudentObj.student_code)],
                    ['Roll Number',     safe(selectedStudentObj.roll_number)],
                    ['Degree',         safe(selectedStudentObj.degree)],
                    ['Department',     safe(selectedStudentObj.department)],
                    ['Class',          safe(selectedStudentObj.class_name)],
                    ['Section',        safe(selectedStudentObj.section_name)],
                    ['Semester',       selectedStudentObj.semester ? `Semester ${selectedStudentObj.semester}` : 'Not Assigned'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.77rem', fontWeight: 600, display: 'block' }}>{label}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Attendance Preview ── */}
            {pdfStudentId && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                  Attendance Preview (from Database)
                </div>

                {pdfPreviewLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '0.5rem 0' }}>
                    Loading attendance data…
                  </div>
                ) : pdfPreviewData ? (
                  <>
                    {/* KPI row */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {[
                        { label: 'Total Classes', val: pdfPreviewData.total, color: '#fff' },
                        { label: 'Present',       val: pdfPreviewData.present, color: 'var(--success)' },
                        { label: 'Absent',        val: pdfPreviewData.absent,  color: 'var(--danger)' },
                        { label: 'Attendance',    val: `${pdfPreviewData.rate}%`, color: parseFloat(pdfPreviewData.rate) >= 75 ? 'var(--success)' : 'var(--danger)' },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ textAlign: 'center', minWidth: '72px' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{val}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Course-wise breakdown */}
                    {pdfPreviewData.courses.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                          Course-wise Breakdown
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                                {['Course', 'Code', 'Total', 'Present', 'Absent', '%'].map((h) => (
                                  <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Course' ? 'left' : 'center', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pdfPreviewData.courses.map((c, i) => {
                                const pct = c.total > 0 ? (((c.present + c.late) / c.total) * 100).toFixed(0) : '0';
                                return (
                                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '7px 8px', color: '#fff', fontWeight: 600 }}>{c.name}</td>
                                    <td style={{ padding: '7px 8px', color: 'var(--primary)', fontWeight: 700, textAlign: 'center' }}>{c.code}</td>
                                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>{c.total}</td>
                                    <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>{c.present}</td>
                                    <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--danger)' }}>{c.absent}</td>
                                    <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 800, color: parseInt(pct) >= 75 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {pdfPreviewData.total === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        No attendance records found for this student. The PDF will still be generated.
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Select a student above to preview their attendance summary.
                  </p>
                )}
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Single Attendance Modal */}
      <Modal isOpen={singleModalOpen} onClose={() => setSingleModalOpen(false)} title="Record Single Attendance">
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
      <Modal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Bulk Attendance Session" maxWidth="650px">
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Session Date *</label>
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
            Submit Bulk Attendance ({students.length} Students)
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

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this attendance log?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
          <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete Record</button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
