import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiBriefcase } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const AdminFeeStructuresPage = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const [formData, setFormData] = useState({ class_id: '', academic_year_id: '', amount: '', description: '' });

  const fetchDependencyData = async () => {
    try {
      const [clsRes, yearRes] = await Promise.all([
        erpService.getClasses(),
        erpService.getAcademicYears()
      ]);
      if (clsRes.success) setClasses(clsRes.data || []);
      if (yearRes.success) setAcademicYears(yearRes.data || []);
    } catch (err) {
      showToast.error('Failed to load dependency data');
    }
  };

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const res = await erpService.getFeeStructures();
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(f => 
            (f.description && f.description.toLowerCase().includes(search.toLowerCase())) ||
            (f.amount && f.amount.toString().includes(search))
          );
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setFeeStructures(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch fee structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencyData();
  }, []);

  useEffect(() => {
    fetchFeeStructures();
  }, [page, search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        class_id: parseInt(formData.class_id),
        academic_year_id: parseInt(formData.academic_year_id),
        amount: parseFloat(formData.amount),
        description: formData.description
      };
      const res = await erpService.createFeeStructure(payload);
      if (res.data.success) {
        showToast.success('Fee structure created successfully');
        setCreateModalOpen(false);
        fetchFeeStructures();
      }
    } catch (err) {
      showToast.error('Creation failed');
    }
  };

  const handleEditClick = (fee) => {
    setSelectedFee(fee);
    setFormData({
      class_id: fee.class_id || '',
      academic_year_id: fee.academic_year_id || '',
      amount: fee.amount || '',
      description: fee.description || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        class_id: parseInt(formData.class_id),
        academic_year_id: parseInt(formData.academic_year_id),
        amount: parseFloat(formData.amount),
        description: formData.description
      };
      const res = await erpService.updateFeeStructure(selectedFee.id, payload);
      if (res.data.success) {
        showToast.success('Fee structure updated successfully');
        setEditModalOpen(false);
        fetchFeeStructures();
      }
    } catch (err) {
      showToast.error('Update failed');
    }
  };

  const handleDeleteClick = (fee) => {
    setSelectedFee(fee);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await erpService.deleteFeeStructure(selectedFee.id);
      if (res.data.success) {
        showToast.success('Fee structure deleted');
        setDeleteModalOpen(false);
        fetchFeeStructures();
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
            <FiBriefcase /> Fee Structures
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configure fees for classes and academic years.
          </p>
        </div>
        <button
          onClick={() => { setFormData({ class_id: '', academic_year_id: '', amount: '', description: '' }); setCreateModalOpen(true); }}
          className="gradient-accent"
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)' }}
        >
          <FiPlus /> Add Fee Structure
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by description or amount..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading fee structures..." />
      ) : feeStructures.length === 0 ? (
        <EmptyState title="No Fee Structures Found" message="No records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Class</th>
                <th style={{ padding: '14px 18px' }}>Academic Year</th>
                <th style={{ padding: '14px 18px' }}>Amount</th>
                <th style={{ padding: '14px 18px' }}>Description</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.map((fee) => {
                const clsName = classes.find(c => c.id === fee.class_id)?.name || `Class ID ${fee.class_id}`;
                const yrName = academicYears.find(y => y.id === fee.academic_year_id)?.year_name || `Year ID ${fee.academic_year_id}`;
                return (
                  <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{clsName}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{yrName}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--accent)' }}>₹{fee.amount}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{fee.description}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={() => handleEditClick(fee)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}><FiEdit /></button>
                        <button onClick={() => handleDeleteClick(fee)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}><FiTrash2 /></button>
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

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Fee Structure">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class *</label>
              <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Academic Year *</label>
              <select value={formData.academic_year_id} onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">Select Year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Amount *</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Base Tuition Fee" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Create Fee Structure</button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Fee Structure">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Class</label>
              <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Academic Year</label>
              <select value={formData.academic_year_id} onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">Select Year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Amount</label>
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
          </div>
          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this fee structure?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
            <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFeeStructuresPage;
