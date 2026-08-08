import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const AdminAcademicYearsPage = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  const [formData, setFormData] = useState({ year_name: '', start_date: '', end_date: '', is_active: false });

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await erpService.getAcademicYears();
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(y => y.year_name.toLowerCase().includes(search.toLowerCase()));
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setYears(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, [page, search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.createAcademicYear(formData);
      if (res.data.success) {
        showToast.success('Academic Year created successfully');
        setCreateModalOpen(false);
        fetchYears();
      }
    } catch (err) {
      showToast.error('Creation failed');
    }
  };

  const handleEditClick = (yr) => {
    setSelectedYear(yr);
    setFormData({
      year_name: yr.year_name,
      start_date: yr.start_date ? yr.start_date.split('T')[0] : '',
      end_date: yr.end_date ? yr.end_date.split('T')[0] : '',
      is_active: yr.is_active || false
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await erpService.updateAcademicYear(selectedYear.id, formData);
      if (res.data.success) {
        showToast.success('Academic Year updated successfully');
        setEditModalOpen(false);
        fetchYears();
      }
    } catch (err) {
      showToast.error('Update failed');
    }
  };

  const handleDeleteClick = (yr) => {
    setSelectedYear(yr);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await erpService.deleteAcademicYear(selectedYear.id);
      if (res.data.success) {
        showToast.success('Academic Year deleted');
        setDeleteModalOpen(false);
        fetchYears();
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
            <FiClock /> Academic Years
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage the academic calendar years.
          </p>
        </div>

        <button
          onClick={() => { setFormData({ year_name: '', start_date: '', end_date: '', is_active: false }); setCreateModalOpen(true); }}
          className="gradient-accent"
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#ffffff',
            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiPlus /> Add Year
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search year name (e.g. 2024-2025)..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading academic years..." />
      ) : years.length === 0 ? (
        <EmptyState title="No Academic Years Found" message="No records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Year Name</th>
                <th style={{ padding: '14px 18px' }}>Start Date</th>
                <th style={{ padding: '14px 18px' }}>End Date</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {years.map((yr) => (
                <tr key={yr.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{yr.year_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{new Date(yr.start_date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{new Date(yr.end_date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: yr.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                      color: yr.is_active ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {yr.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEditClick(yr)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDeleteClick(yr)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
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
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Academic Year">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Year Name *</label>
            <input type="text" value={formData.year_name} onChange={(e) => setFormData({ ...formData, year_name: e.target.value })} placeholder="e.g. 2024-2025" required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date *</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>End Date *</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
            Mark as Current Active Year
          </label>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Create Year</button>
        </form>
      </Modal>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Academic Year">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Year Name</label>
            <input type="text" value={formData.year_name} onChange={(e) => setFormData({ ...formData, year_name: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>End Date</label>
              <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
            Mark as Current Active Year
          </label>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedYear?.year_name}</strong>?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAcademicYearsPage;
