import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiUserCheck, FiBookOpen } from 'react-icons/fi';
import { studentService } from '../../services/studentService';
import { userService } from '../../services/userService';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Electrical Engineering'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    user_id: '',
    roll_number: '',
    department: 'Computer Science',
    semester: 4,
    year: 2024,
    gender: 'male',
    dob: '2003-05-14',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    status: 'active',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({
        page,
        limit: 10,
        department: selectedDept || undefined,
        semester: selectedSem || undefined,
        search: search || undefined,
      });

      if (res.success) {
        setStudents(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, selectedDept, selectedSem, search]);

  const handleOpenCreateModal = async () => {
    try {
      const res = await userService.getAll({ role: 'student', limit: 100 });
      setUsersList(res.data || []);
      if (res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, user_id: res.data[0].id }));
      }
    } catch {
      // ignore
    }
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await studentService.create(formData);
      if (res.success) {
        showToast.success('Student profile created successfully');
        setCreateModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setFormData({
      department: student.department || 'Computer Science',
      semester: student.semester || 4,
      year: student.year || 2024,
      gender: student.gender || 'male',
      dob: student.dob ? student.dob.split('T')[0] : '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      status: student.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await studentService.update(selectedStudent.id, formData);
      if (res.success) {
        showToast.success('Student profile updated successfully');
        setEditModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await studentService.delete(selectedStudent.id);
      if (res.success) {
        showToast.success('Student record deleted');
        setDeleteModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage student profiles, department enrollments, and academic status.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
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
          <FiPlus /> Add Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, roll number..." />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#121a2b',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={selectedSem}
          onChange={(e) => { setSelectedSem(e.target.value); setPage(1); }}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#121a2b',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      {loading ? (
        <Spinner text="Fetching students..." />
      ) : students.length === 0 ? (
        <EmptyState title="No Students Found" message="No student records match your current filters." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Roll No</th>
                <th style={{ padding: '14px 18px' }}>Student Name</th>
                <th style={{ padding: '14px 18px' }}>Department</th>
                <th style={{ padding: '14px 18px' }}>Sem & Year</th>
                <th style={{ padding: '14px 18px' }}>Guardian</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--primary)' }}>
                    {student.roll_number}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{student.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                    {student.department}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    Sem {student.semester} ({student.year})
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.85rem' }}>{student.guardian_name || 'N/A'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{student.guardian_phone}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={student.status || 'active'} />
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleEditClick(student)}
                        style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}
                        title="Edit Student"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(student)}
                        style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}
                        title="Delete Student"
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

      {/* Create Student Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Student Profile">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Select User Account *
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) [ID: {u.id}]</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Roll Number *
            </label>
            <input
              type="text"
              value={formData.roll_number}
              onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
              placeholder="e.g. CS2024099"
              required
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Guardian Name</label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                placeholder="Parent Name"
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Guardian Phone</label>
              <input
                type="text"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                placeholder="+919876543210"
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Create Student Profile
          </button>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Student: ${selectedStudent?.name || ''}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete the student profile for <strong style={{ color: '#fff' }}>{selectedStudent?.name}</strong> ({selectedStudent?.roll_number})?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
              Delete Profile
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentsPage;
