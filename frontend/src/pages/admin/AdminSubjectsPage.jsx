import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiBookOpen } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const AdminSubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [formData, setFormData] = useState({ name: '', code: '' });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await erpService.getSubjects();
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) || 
            s.code.toLowerCase().includes(search.toLowerCase())
          );
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setSubjects(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.createSubject(formData);
      if (res.data.success) {
        showToast.success('Subject created successfully');
        setCreateModalOpen(false);
        fetchSubjects();
      }
    } catch (err) {
      showToast.error('Creation failed');
    }
  };

  const handleEditClick = (sub) => {
    setSelectedSubject(sub);
    setFormData({ name: sub.name, code: sub.code });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.updateSubject(selectedSubject.id, formData);
      if (res.data.success) {
        showToast.success('Subject updated successfully');
        setEditModalOpen(false);
        fetchSubjects();
      }
    } catch (err) {
      showToast.error('Update failed');
    }
  };

  const handleDeleteClick = (sub) => {
    setSelectedSubject(sub);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await erpService.deleteSubject(selectedSubject.id);
      if (res.data.success) {
        showToast.success('Subject deleted');
        setDeleteModalOpen(false);
        fetchSubjects();
      }
    } catch (err) {
      showToast.error('Deletion failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiBookOpen /> Subjects Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage the subjects for the ERP system.
          </p>
        </div>

        <button
          onClick={() => { setFormData({ name: '', code: '' }); setCreateModalOpen(true); }}
          className="gradient-accent"
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiPlus /> Add Subject
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search subject name or code..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading subjects..." />
      ) : subjects.length === 0 ? (
        <EmptyState title="No Subjects Found" message="No subject records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Code</th>
                <th style={{ padding: '14px 18px' }}>Subject Name</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--accent)' }}>{sub.code}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{sub.name}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEditClick(sub)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDeleteClick(sub)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
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
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Subject">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Subject Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mathematics" required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Subject Code *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. MATH101" required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Create Subject</button>
        </form>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Subject">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Subject Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Subject Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedSubject?.name}</strong>?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubjectsPage;
