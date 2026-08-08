import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLayers } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const AdminClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [formData, setFormData] = useState({ name: '' });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await erpService.getClasses();
      if (res.success) {
        // Simple client-side search and pagination since backend may not support it yet
        let data = res.data || [];
        if (search) {
          data = data.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setClasses(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.createClass(formData);
      if (res.data.success) {
        showToast.success('Class created successfully');
        setCreateModalOpen(false);
        fetchClasses();
      }
    } catch {
      showToast.error('Creation failed');
    }
  };

  const handleEditClick = (cls) => {
    setSelectedClass(cls);
    setFormData({ name: cls.name });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.updateClass(selectedClass.id, formData);
      if (res.data.success) {
        showToast.success('Class updated successfully');
        setEditModalOpen(false);
        fetchClasses();
      }
    } catch {
      showToast.error('Update failed');
    }
  };

  const handleDeleteClick = (cls) => {
    setSelectedClass(cls);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await erpService.deleteClass(selectedClass.id);
      if (res.data.success) {
        showToast.success('Class deleted');
        setDeleteModalOpen(false);
        fetchClasses();
      }
    } catch {
      showToast.error('Deletion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiLayers /> Classes Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage the classes for the ERP system.
          </p>
        </div>

        <button
          onClick={() => { setFormData({ name: '' }); setCreateModalOpen(true); }}
          className="gradient-accent"
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiPlus /> Add Class
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search class name..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading classes..." />
      ) : classes.length === 0 ? (
        <EmptyState title="No Classes Found" message="No class records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>ID</th>
                <th style={{ padding: '14px 18px' }}>Class Name</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>#{cls.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{cls.name}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEditClick(cls)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDeleteClick(cls)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
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

      {/* Modals */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Class">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="e.g. Class 1" required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Create Class</button>
        </form>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Class">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedClass?.name}</strong>?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminClassesPage;
