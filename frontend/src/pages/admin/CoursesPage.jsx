import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiBookOpen } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import { teacherService } from '../../services/teacherService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Electrical Engineering'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    semester: 4,
    department: 'Computer Science',
    credits: 4,
    teacher_id: '',
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await courseService.getAll({
        page,
        limit: 10,
        department: selectedDept || undefined,
        semester: selectedSem || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setCourses(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await teacherService.getAll({ limit: 100 });
      setTeachers(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, selectedDept, selectedSem, search]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : undefined,
      };
      const res = await courseService.create(payload);
      if (res.success) {
        showToast.success('Course created successfully');
        setCreateModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setFormData({
      course_name: course.course_name,
      course_code: course.course_code,
      semester: course.semester,
      department: course.department,
      credits: course.credits,
      teacher_id: course.teacher_id || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await courseService.update(selectedCourse.id, {
        course_name: formData.course_name,
        semester: parseInt(formData.semester),
        department: formData.department,
        credits: parseInt(formData.credits),
        teacher_id: formData.teacher_id ? parseInt(formData.teacher_id) : undefined,
      });
      if (res.success) {
        showToast.success('Course updated successfully');
        setEditModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAssignClick = (course) => {
    setSelectedCourse(course);
    setFormData((prev) => ({ ...prev, teacher_id: course.teacher_id || '' }));
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await courseService.assignTeacher(selectedCourse.id, parseInt(formData.teacher_id));
      if (res.success) {
        showToast.success('Faculty member assigned to course');
        setAssignModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await courseService.delete(selectedCourse.id);
      if (res.success) {
        showToast.success('Course deleted');
        setDeleteModalOpen(false);
        fetchCourses();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Academic Courses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage course offerings, credit allocations, and faculty assignments.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="gradient-accent"
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiPlus /> Add Course
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search course name or code..." />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={selectedSem}
          onChange={(e) => { setSelectedSem(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState title="No Courses Found" message="No course records match your search criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Code</th>
                <th style={{ padding: '14px 18px' }}>Course Title</th>
                <th style={{ padding: '14px 18px' }}>Department</th>
                <th style={{ padding: '14px 18px' }}>Semester</th>
                <th style={{ padding: '14px 18px' }}>Credits</th>
                <th style={{ padding: '14px 18px' }}>Assigned Faculty</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--accent)' }}>
                    {course.course_code}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                    {course.course_name}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{course.department}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Sem {course.semester}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{course.credits} Credits</td>
                  <td style={{ padding: '14px 18px' }}>
                    {course.teacher_name ? (
                      <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {course.teacher_name}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssignClick(course)}
                        style={{ padding: '4px 10px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Assign Teacher
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleAssignClick(course)}
                        style={{ padding: '6px', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}
                        title="Assign Teacher"
                      >
                        <FiUserCheck />
                      </button>
                      <button
                        onClick={() => handleEditClick(course)}
                        style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}
                        title="Edit Course"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(course)}
                        style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}
                        title="Delete Course"
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

      {/* Create Course Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Course">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course Title *</label>
            <input
              type="text"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms"
              required
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course Code *</label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                placeholder="e.g. CS301"
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Credits *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              >
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Assign Faculty (Optional)</label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">None</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
            </select>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Create Course
          </button>
        </form>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Faculty to ${selectedCourse?.course_code || ''}`}>
        <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Faculty Member *</label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">Select a teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.department} - {t.employee_id})</option>)}
            </select>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Assign Faculty
          </button>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Course: ${selectedCourse?.course_code || ''}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Course Title</label>
            <input
              type="text"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Course Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedCourse?.course_name}</strong> ({selectedCourse?.course_code})?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
              Delete Course
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoursesPage;
