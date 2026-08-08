import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiList } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const AdminSectionsPage = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const [formData, setFormData] = useState({ name: '', class_id: '' });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await erpService.getClasses();
        if (res.success && res.data?.length > 0) {
          setClasses(res.data);
          setSelectedClassId(res.data[0].id.toString());
        }
      } catch (err) {
        showToast.error('Failed to load classes');
      }
    };
    fetchClasses();
  }, []);

  const fetchSections = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await erpService.getSections(selectedClassId);
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setSections(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [page, search, selectedClassId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, class_id: parseInt(formData.class_id) };
      const res = await erpService.createSection(payload);
      if (res.data.success) {
        showToast.success('Section created successfully');
        setCreateModalOpen(false);
        if (selectedClassId === formData.class_id.toString()) fetchSections();
      }
    } catch (err) {
      showToast.error('Creation failed');
    }
  };

  const handleEditClick = (section) => {
    setSelectedSection(section);
    setFormData({ name: section.name, class_id: section.class_id || selectedClassId });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, class_id: parseInt(formData.class_id) };
      const res = await erpService.updateSection(selectedSection.id, payload);
      if (res.data.success) {
        showToast.success('Section updated successfully');
        setEditModalOpen(false);
        if (selectedClassId === formData.class_id.toString()) fetchSections();
      }
    } catch (err) {
      showToast.error('Update failed');
    }
  };

  const handleDeleteClick = (section) => {
    setSelectedSection(section);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await erpService.deleteSection(selectedSection.id);
      if (res.data.success) {
        showToast.success('Section deleted');
        setDeleteModalOpen(false);
        fetchSections();
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
            <FiList /> Sections Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage sections under each class.
          </p>
        </div>
        <button
          onClick={() => { setFormData({ name: '', class_id: selectedClassId }); setCreateModalOpen(true); }}
          className="gradient-accent"
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiPlus /> Add Section
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search section name..." />
        </div>
        <select
          value={selectedClassId}
          onChange={(e) => { setSelectedClassId(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          {classes.length === 0 && <option value="">No classes available</option>}
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner text="Loading sections..." />
      ) : sections.length === 0 ? (
        <EmptyState title="No Sections Found" message="No section records match your criteria for the selected class." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>ID</th>
                <th style={{ padding: '14px 18px' }}>Section Name</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((sec) => (
                <tr key={sec.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>#{sec.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{sec.name}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEditClick(sec)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}><FiEdit /></button>
                      <button onClick={() => handleDeleteClick(sec)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Section">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class</label>
            <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Section Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. A" required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Create Section</button>
        </form>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Section">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class</label>
            <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Section Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedSection?.name}</strong>?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSectionsPage;
