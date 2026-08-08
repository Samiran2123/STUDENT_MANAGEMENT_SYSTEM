import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { feesService } from '../../services/feesService';
import { studentService } from '../../services/studentService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['pending', 'paid', 'overdue', 'waived'];
const PAYMENT_METHODS = ['online', 'cash', 'cheque', 'bank_transfer'];

const FeesPage = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const [selectedFee, setSelectedFee] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [summaryStudentName, setSummaryStudentName] = useState('');

  const [formData, setFormData] = useState({
    student_id: '',
    amount: 25000,
    status: 'pending',
    payment_date: '',
    payment_method: 'online',
  });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await feesService.getAll({
        page,
        limit: 10,
        status: selectedStatus || undefined,
      });
      if (res.success) {
        setFees(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getAll({ limit: 100 });
      setStudents(res.data || []);
      if (res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, student_id: res.data[0].id }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFees();
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await feesService.create({
        student_id: parseInt(formData.student_id),
        amount: parseFloat(formData.amount),
        status: formData.status,
        payment_date: formData.payment_date || undefined,
        payment_method: formData.payment_method || undefined,
      });
      if (res.success) {
        showToast.success('Fee record created');
        setCreateModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleMarkPaid = async (fee) => {
    try {
      const res = await feesService.update(fee.id, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'online',
      });
      if (res.success) {
        showToast.success('Fee marked as Paid');
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleEditClick = (fee) => {
    setSelectedFee(fee);
    setFormData((prev) => ({
      ...prev,
      amount: fee.amount,
      status: fee.status,
      payment_date: fee.payment_date ? fee.payment_date.split('T')[0] : '',
      payment_method: fee.payment_method || 'online',
    }));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await feesService.update(selectedFee.id, {
        amount: parseFloat(formData.amount),
        status: formData.status,
        payment_date: formData.payment_date || undefined,
        payment_method: formData.payment_method || undefined,
      });
      if (res.success) {
        showToast.success('Fee record updated');
        setEditModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteClick = (fee) => {
    setSelectedFee(fee);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await feesService.delete(selectedFee.id);
      if (res.success) {
        showToast.success('Fee record deleted');
        setDeleteModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleViewSummary = async (studentId, studentName) => {
    setSummaryStudentName(studentName);
    try {
      const res = await feesService.getSummary(studentId);
      if (res.success) {
        setFeeSummary(res.data);
        setSummaryModalOpen(true);
      }
    } catch (err) {
      showToast.error('Could not load fee summary');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fee Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track tuition fee structures, online payments, pending dues, and fee waivers.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="gradient-accent"
          style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)' }}
        >
          <FiPlus /> Create Fee Invoice
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Fee Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading fee ledger..." />
      ) : fees.length === 0 ? (
        <EmptyState title="No Fee Records" message="No fee records match your selected status filter." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Roll No</th>
                <th style={{ padding: '14px 18px' }}>Amount</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Payment Info</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{fee.student_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>{fee.roll_number}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#fff' }}>
                    {formatCurrency(fee.amount)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={fee.status} />
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {fee.status === 'paid' ? (
                      <>
                        <div style={{ color: 'var(--success)', fontWeight: 600 }}>{fee.payment_method?.toUpperCase()}</div>
                        <div>{formatDate(fee.payment_date)}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {fee.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkPaid(fee)}
                          style={{ padding: '6px 10px', color: 'var(--success)', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleViewSummary(fee.student_id, fee.student_name)}
                        style={{ padding: '6px 10px', color: 'var(--accent)', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Summary
                      </button>
                      <button onClick={() => handleEditClick(fee)} style={{ padding: '6px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDeleteClick(fee)} style={{ padding: '6px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
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

      {/* Create Fee Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Fee Invoice">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Amount (₹) *</label>
            <input
              type="number"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Fee Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Create Fee Record
          </button>
        </form>
      </Modal>

      {/* Edit Fee Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Fee Record">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

          <button type="submit" className="gradient-accent" style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Summary Modal */}
      <Modal isOpen={summaryModalOpen} onClose={() => setSummaryModalOpen(false)} title={`Financial Summary: ${summaryStudentName}`}>
        {feeSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Records</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{feeSummary.total_records}</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Billed</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(feeSummary.total_amount)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Paid Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(feeSummary.paid_amount)}</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Pending Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>{formatCurrency(feeSummary.pending_amount)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
        <p style={{ color: 'var(--text-muted)' }}>Are you sure you want to delete this fee record?</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={() => setDeleteModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
          <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--danger)', color: '#fff', fontWeight: 700 }}>Delete Fee</button>
        </div>
      </Modal>
    </div>
  );
};

export default FeesPage;
