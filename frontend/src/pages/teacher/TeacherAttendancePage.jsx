import React, { useState, useEffect } from 'react';
import { 
  FiCheckSquare, FiCalendar, FiUsers, FiBookOpen, FiSave, 
  FiCheck, FiX, FiClock, FiEdit, FiLayers, FiList 
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
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const TeacherAttendancePage = () => {
  // Master dependencies
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);

  // Selection form for taking attendance
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Students for attendance session
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({}); // { [studentId]: 'present' | 'absent' | ... }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);

  // History & logs
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Edit single record modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('present');

  // Load teacher courses, classes, sections
  useEffect(() => {
    const fetchTeacherMeta = async () => {
      setLoadingDependencies(true);
      try {
        const [cRes, clsRes, secRes] = await Promise.all([
          courseService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
          erpService.getClasses().catch(() => ({ data: [] })),
          erpService.getSections().catch(() => ({ data: [] })),
        ]);

        const myCourses = cRes.data || [];
        setAssignedCourses(myCourses);
        setClasses(clsRes.data || []);
        setSections(secRes.data || []);

        if (myCourses.length > 0) {
          setSelectedCourseId(String(myCourses[0].id));
        }
      } catch (err) {
        showToast.error('Failed to load assigned curriculum');
      } finally {
        setLoadingDependencies(false);
      }
    };

    fetchTeacherMeta();
  }, []);

  // When selected class changes, filter sections
  const filteredSections = selectedClassId
    ? sections.filter((s) => String(s.class_id) === String(selectedClassId))
    : sections;

  // Fetch enrolled students when course/class/section changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchStudentsForSession = async () => {
      setLoadingStudents(true);
      try {
        const params = {
          limit: 100,
          class_id: selectedClassId || undefined,
          section_id: selectedSectionId || undefined,
        };

        const res = await studentService.getAll(params);
        let list = res.data || [];

        // If specific course is chosen, we can also filter students by department / semester if course has them
        const selectedCourse = assignedCourses.find((c) => String(c.id) === String(selectedCourseId));
        if (selectedCourse && selectedCourse.department && !selectedClassId) {
          list = list.filter(
            (s) => s.department === selectedCourse.department || s.degree === selectedCourse.department
          );
        }

        setEnrolledStudents(list);

        // Default all loaded students to 'present'
        const initialStatus = {};
        list.forEach((s) => {
          initialStatus[s.id] = 'present';
        });
        setStudentStatuses(initialStatus);
      } catch (err) {
        showToast.error('Failed to load enrolled students');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentsForSession();
  }, [selectedCourseId, selectedClassId, selectedSectionId, assignedCourses]);

  // Fetch teacher's attendance log history
  const fetchAttendanceHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await attendanceService.getAll({
        page: historyPage,
        limit: 10,
        course_id: filterCourse || selectedCourseId || undefined,
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });

      if (res.success) {
        setAttendanceHistory(res.data || []);
        if (res.pagination) {
          setHistoryTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchAttendanceHistory();
    }
  }, [historyPage, filterCourse, filterDate, filterStatus, selectedCourseId]);

  // Bulk status modifier helpers
  const handleMarkAll = (status) => {
    const updated = { ...studentStatuses };
    enrolledStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setStudentStatuses(updated);
  };

  // Submit attendance session
  const handleSubmitSession = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      showToast.error('Please select an assigned course');
      return;
    }
    if (enrolledStudents.length === 0) {
      showToast.error('No enrolled students available to mark attendance');
      return;
    }

    setSubmittingSession(true);
    try {
      const records = enrolledStudents.map((s) => ({
        student_id: s.id,
        status: studentStatuses[s.id] || 'present',
      }));

      const res = await attendanceService.recordBulk({
        course_id: parseInt(selectedCourseId),
        date: attendanceDate,
        records,
      });

      if (res.success) {
        showToast.success(`Attendance saved successfully for ${records.length} students!`);
        fetchAttendanceHistory();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit attendance session');
    } finally {
      setSubmittingSession(false);
    }
  };

  // Handle Edit Single Record
  const handleEditClick = (rec) => {
    setSelectedRecord(rec);
    setEditStatus(rec.status);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceService.update(selectedRecord.id, { status: editStatus });
      if (res.success) {
        showToast.success('Attendance record updated');
        setEditModalOpen(false);
        fetchAttendanceHistory();
      }
    } catch (err) {
      showToast.error('Update failed');
    }
  };

  if (loadingDependencies) {
    return <Spinner text="Loading your assigned courses and class roster..." />;
  }

  const selectedCourseObj = assignedCourses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckSquare style={{ color: 'var(--primary)' }} /> Take Course Attendance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Select your assigned course, class, and section to record presence for enrolled students.
          </p>
        </div>
      </div>

      {/* Course & Session Selector Panel */}
      <form onSubmit={handleSubmitSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBookOpen style={{ color: 'var(--accent)' }} /> 1. Select Assigned Course & Class Session
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Assigned Course */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Assigned Course *
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#121a2b',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              >
                {assignedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name} ({c.course_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Class (Optional Filter)
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#121a2b',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              >
                <option value="">All Enrolled Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.degree})
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#121a2b',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              >
                <option value="">All Sections</option>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Session Date *
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#121a2b',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Enrolled Students Attendance List */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUsers style={{ color: 'var(--success)' }} /> 2. Mark Attendance for Enrolled Students
              </h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {enrolledStudents.length} Students enrolled in {selectedCourseObj?.course_name || 'selected course'}
              </span>
            </div>

            {/* Quick Bulk Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiCheck /> All Present
              </button>

              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiX /> All Absent
              </button>
            </div>
          </div>

          {loadingStudents ? (
            <Spinner text="Loading enrolled students roster..." />
          ) : enrolledStudents.length === 0 ? (
            <EmptyState
              title="No Enrolled Students"
              message="No active students found matching the selected course and class criteria."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Roll / Code</th>
                    <th style={{ padding: '12px 16px' }}>Student Name</th>
                    <th style={{ padding: '12px 16px' }}>Class / Section</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Presence Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((student) => {
                    const currentStatus = studentStatuses[student.id] || 'present';

                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>
                          {student.roll_number || student.student_code || `STU${student.id}`}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                          {student.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {student.class_name || `${student.degree || 'BCA'} Sem ${student.semester || 1}`}
                          {student.section_name ? ` (Sec ${student.section_name})` : ''}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {STATUS_OPTIONS.map((st) => {
                              const isSelected = currentStatus === st;
                              let btnBg = 'rgba(255, 255, 255, 0.05)';
                              let btnColor = 'var(--text-muted)';
                              let btnBorder = 'transparent';

                              if (isSelected) {
                                if (st === 'present') {
                                  btnBg = 'var(--success)';
                                  btnColor = '#fff';
                                } else if (st === 'absent') {
                                  btnBg = 'var(--danger)';
                                  btnColor = '#fff';
                                } else if (st === 'late') {
                                  btnBg = 'var(--warning)';
                                  btnColor = '#fff';
                                } else {
                                  btnBg = 'var(--primary)';
                                  btnColor = '#fff';
                                }
                              }

                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setStudentStatuses((prev) => ({ ...prev, [student.id]: st }))
                                  }
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: `1px solid ${btnBorder}`,
                                    backgroundColor: btnBg,
                                    color: btnColor,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {enrolledStudents.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={submittingSession}
                className="gradient-accent"
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-glow)',
                  cursor: submittingSession ? 'not-allowed' : 'pointer',
                  opacity: submittingSession ? 0.7 : 1,
                }}
              >
                <FiSave /> {submittingSession ? 'Saving Session...' : `Save Attendance (${enrolledStudents.length} Students)`}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Historical Attendance Records */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock style={{ color: 'var(--accent)' }} /> 3. Recent Attendance History & Logs
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Inspect and edit previously recorded presence records for your courses.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.82rem',
              }}
            >
              <option value="">All Courses</option>
              {assignedCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.82rem',
              }}
            />
          </div>
        </div>

        {historyLoading ? (
          <Spinner text="Loading logs..." />
        ) : attendanceHistory.length === 0 ? (
          <EmptyState title="No Records" message="No previous attendance entries found for this filter." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Student</th>
                  <th style={{ padding: '12px 16px' }}>Roll No</th>
                  <th style={{ padding: '12px 16px' }}>Course</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{formatDate(rec.date)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{rec.student_name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--primary)', fontWeight: 700 }}>{rec.roll_number}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{rec.course_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={rec.status} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleEditClick(rec)}
                        style={{
                          padding: '5px 10px',
                          color: 'var(--secondary)',
                          backgroundColor: 'rgba(6, 182, 212, 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
          </div>
        )}
      </div>

      {/* Edit Single Attendance Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Attendance Status">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Student: <strong style={{ color: '#fff' }}>{selectedRecord?.student_name}</strong>
            </label>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selectedRecord?.course_name} on {selectedRecord?.date && formatDate(selectedRecord.date)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Presence Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="gradient-accent"
            style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}
          >
            Update Status
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherAttendancePage;
