import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiUserCheck, FiCheckCircle, FiClock } from 'react-icons/fi';
import { teacherService } from '../../services/teacherService';
import { userService } from '../../services/userService';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Electrical Engineering'];

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [usersList, setUsersList] = useState([]);

  const [formData, setFormData] = useState({
    user_id: '',
    employee_id: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    qualification: 'PhD',
    experience: 5,
    status: 'active',
  });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({
        page,
        limit: 10,
        department: selectedDept || undefined,
        status: selectedStatus || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setTeachers(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page, selectedDept, selectedStatus, search]);

  const handleOpenCreateModal = async () => {
    try {
      const res = await userService.getAll({ role: 'teacher', limit: 100 });
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
      const res = await teacherService.create(formData);
      if (res.success) {
        showToast.success('Teacher profile created successfully');
        setCreateModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await teacherService.approve(id);
      if (res.success) {
        showToast.success('Teacher status set to Active');
        fetchTeachers();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleEditClick = (t) => {
    setSelectedTeacher(t);
    setFormData({
      department: t.department || 'Computer Science',
      designation: t.designation || 'Assistant Professor',
      qualification: t.qualification || '',
      experience: t.experience || 0,
      status: t.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await teacherService.update(selectedTeacher.id, formData);
      if (res.success) {
        showToast.success('Teacher updated successfully');
        setEditModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (t) => {
    setSelectedTeacher(t);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await teacherService.delete(selectedTeacher.id);
      if (res.success) {
        showToast.success('Teacher profile deleted');
        setDeleteModalOpen(false);
        fetchTeachers();
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Faculty Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage faculty profiles, designations, approvals, and teaching departments.
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
          <FiPlus /> Add Teacher Profile
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, employee ID..." />
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
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading faculty members..." />
      ) : teachers.length === 0 ? (
        <EmptyState title="No Teachers Found" message="No faculty records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Emp ID</th>
                <th style={{ padding: '14px 18px' }}>Faculty Name</th>
                <th style={{ padding: '14px 18px' }}>Department</th>
                <th style={{ padding: '14px 18px' }}>Designation</th>
                <th style={{ padding: '14px 18px' }}>Experience</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--secondary)' }}>
                    {t.employee_id}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>{t.department}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {t.designation || 'Lecturer'}
                    {t.qualification && <div style={{ fontSize: '0.75rem' }}>{t.qualification}</div>}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{t.experience || 0} years</td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={t.status || 'active'} />
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {t.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(t.id)}
                          style={{ padding: '6px 10px', color: 'var(--success)', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(t)}
                        style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}
                        title="Edit Teacher"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(t)}
                        style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}
                        title="Delete Teacher"
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

      {/* Create Teacher Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Teacher Profile">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select User Account *</label>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Employee ID *</label>
            <input
              type="text"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              placeholder="e.g. EMP005"
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Associate Professor"
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Create Teacher Profile
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Faculty: ${selectedTeacher?.name || ''}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete teacher <strong style={{ color: '#fff' }}>{selectedTeacher?.name}</strong> ({selectedTeacher?.employee_id})?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>
              Cancel
            </button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
              Delete Teacher
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeachersPage;
