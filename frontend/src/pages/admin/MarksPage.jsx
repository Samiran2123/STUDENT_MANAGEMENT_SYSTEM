import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiAward, FiFileText, FiPieChart } from 'react-icons/fi';
import { marksService } from '../../services/marksService';
import { studentService } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const EXAM_TYPES = ['midterm', 'final', 'quiz', 'assignment', 'practical'];

const MarksPage = () => {
  const [marksList, setMarksList] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [selectedMark, setSelectedMark] = useState(null);
  const [studentReport, setStudentReport] = useState([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    exam_type: 'midterm',
    marks: 40,
    total_marks: 50,
  });

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const res = await marksService.getAll({
        page,
        limit: 10,
        course_id: selectedCourse || undefined,
        exam_type: selectedExamType || undefined,
      });
      if (res.success) {
        setMarksList(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch marks');
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
        setFormData((prev) => ({
          ...prev,
          student_id: sRes.data[0].id,
          course_id: cRes.data[0].id,
        }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [page, selectedCourse, selectedExamType]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.marks) > parseFloat(formData.total_marks)) {
      showToast.error('Marks scored cannot exceed total marks');
      return;
    }
    try {
      const res = await marksService.add({
        student_id: parseInt(formData.student_id),
        course_id: parseInt(formData.course_id),
        exam_type: formData.exam_type,
        marks: parseFloat(formData.marks),
        total_marks: parseFloat(formData.total_marks),
      });
      if (res.success) {
        showToast.success('Marks recorded');
        setAddModalOpen(false);
        fetchMarks();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to add marks');
    }
  };

  const handleEditClick = (item) => {
    setSelectedMark(item);
    setFormData({
      marks: item.marks,
      total_marks: item.total_marks,
      exam_type: item.exam_type,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await marksService.update(selectedMark.id, {
        marks: parseFloat(formData.marks),
        total_marks: parseFloat(formData.total_marks),
        exam_type: formData.exam_type,
      });
      if (res.success) {
        showToast.success('Marks updated');
        setEditModalOpen(false);
        fetchMarks();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedMark(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await marksService.delete(selectedMark.id);
      if (res.success) {
        showToast.success('Marks record deleted');
        setDeleteModalOpen(false);
        fetchMarks();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleViewReport = async (studentId, studentName) => {
    setSelectedStudentForReport(studentName);
    try {
      const res = await marksService.getReport(studentId);
      if (res.success) {
        setStudentReport(res.data || []);
        setReportModalOpen(true);
      }
    } catch (err) {
      showToast.error('Could not load student marks report');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Marks & Grading</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Record examination scores, assignments, quizzes, and generate report cards.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="gradient-accent"
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)' }}
        >
          <FiPlus /> Record Marks
        </button>
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
          value={selectedExamType}
          onChange={(e) => { setSelectedExamType(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading gradebook..." />
      ) : marksList.length === 0 ? (
        <EmptyState title="No Marks Records" message="No exam marks match your filters." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Roll No</th>
                <th style={{ padding: '14px 18px' }}>Course</th>
                <th style={{ padding: '14px 18px' }}>Exam Type</th>
                <th style={{ padding: '14px 18px' }}>Scored / Total</th>
                <th style={{ padding: '14px 18px' }}>Grade %</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {marksList.map((item) => {
                const pct = ((item.marks / item.total_marks) * 100).toFixed(1);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.student_name}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>{item.roll_number}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.course_name} ({item.course_code})</td>
                    <td style={{ padding: '14px 18px', textTransform: 'capitalize', fontWeight: 600 }}>{item.exam_type}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                      {item.marks} / {item.total_marks}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: pct >= 75 ? 'var(--success-bg)' : pct >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                        }}
                      >
                        {pct}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleViewReport(item.student_id, item.student_name)}
                          style={{ padding: '6px 10px', color: 'var(--accent)', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}
                          title="View Full Report"
                        >
                          Report
                        </button>
                        <button onClick={() => handleEditClick(item)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                          <FiEdit />
                        </button>
                        <button onClick={() => handleDeleteClick(item)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Add Marks Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Examination Marks">
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Student *</label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Exam Type *</label>
            <select
              value={formData.exam_type}
              onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Marks Scored *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Marks *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Submit Marks
          </button>
        </form>
      </Modal>

      {/* Edit Marks Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Marks Record">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Marks Scored</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Total Marks</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Student Academic Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title={`Academic Report Card: ${selectedStudentForReport}`} maxWidth="650px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {studentReport.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No exam records found for this student.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>Course</th>
                  <th style={{ padding: '8px' }}>Exam</th>
                  <th style={{ padding: '8px' }}>Score</th>
                  <th style={{ padding: '8px' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentReport.map((r, i) => {
                  const pct = ((r.marks / r.total_marks) * 100).toFixed(1);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '8px' }}>{r.course_name} ({r.course_code})</td>
                      <td style={{ padding: '8px', textTransform: 'capitalize' }}>{r.exam_type}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{r.marks} / {r.total_marks}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this marks entry?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
          <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete Marks</button>
        </div>
      </Modal>
    </div>
  );
};

export default MarksPage;
