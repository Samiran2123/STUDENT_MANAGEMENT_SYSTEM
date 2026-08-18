import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiDollarSign, FiPlus, FiEdit, FiTrash2, FiCheck, FiX, 
  FiCheckCircle, FiClock, FiCreditCard, FiPieChart 
} from 'react-icons/fi';
import { feesService } from '../../services/feesService';
import { studentService } from '../../services/studentService';
import { erpService } from '../../services/erpService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import { showToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['pending', 'paid', 'overdue', 'waived'];
const PAYMENT_METHODS = ['online', 'cash', 'cheque', 'bank_transfer'];

const AdminFinancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(activeTabParam === 'payments' ? 'payments' : 'fees');

  // Sync tab with URL
  useEffect(() => {
    if (activeTabParam === 'payments' || activeTabParam === 'fees') {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // ── FEES STATE ──────────────────────────────────────────────
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('');
  const [feeSearch, setFeeSearch] = useState('');
  const [feePage, setFeePage] = useState(1);
  const [feeTotalPages, setFeeTotalPages] = useState(1);

  // Fee Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [summaryStudentName, setSummaryStudentName] = useState('');

  const [feeFormData, setFeeFormData] = useState({
    student_id: '',
    amount: 25000,
    status: 'pending',
    payment_date: '',
    payment_method: 'online',
  });

  // ── PAYMENTS STATE ──────────────────────────────────────────
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);

  // ── FETCH FEES ──────────────────────────────────────────────
  const fetchFees = async () => {
    setFeesLoading(true);
    try {
      const res = await feesService.getAll({
        page: feePage,
        limit: 10,
        status: selectedFeeStatus || undefined,
      });
      if (res.success) {
        let data = res.data || [];
        if (feeSearch) {
          data = data.filter(
            (f) =>
              f.student_name?.toLowerCase().includes(feeSearch.toLowerCase()) ||
              f.roll_number?.toLowerCase().includes(feeSearch.toLowerCase())
          );
        }
        setFees(data);
        if (res.pagination) {
          setFeeTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to fetch fees');
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getAll({ limit: 100 });
      setStudents(res.data || []);
      if (res.data?.length > 0) {
        setFeeFormData((prev) => ({ ...prev, student_id: res.data[0].id }));
      }
    } catch {
      // ignore
    }
  };

  // ── FETCH PAYMENTS ──────────────────────────────────────────
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await erpService.getPendingPayments();
      if (res.success) {
        let data = res.data || [];
        if (paymentSearch) {
          data = data.filter(
            (p) =>
              p.student_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.transaction_reference?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.student_code?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
              p.roll_number?.toLowerCase().includes(paymentSearch.toLowerCase())
          );
        }
        setPaymentTotalPages(Math.ceil(data.length / 10) || 1);
        setPayments(data.slice((paymentPage - 1) * 10, paymentPage * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch pending payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [feePage, selectedFeeStatus, feeSearch]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [paymentPage, paymentSearch]);

  // ── FEE HANDLERS ────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await feesService.create({
        student_id: parseInt(feeFormData.student_id),
        amount: parseFloat(feeFormData.amount),
        status: feeFormData.status,
        payment_date: feeFormData.payment_date || undefined,
        payment_method: feeFormData.payment_method || undefined,
      });
      if (res.success) {
        showToast.success('Fee invoice record created successfully');
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
        showToast.success('Fee invoice marked as Paid');
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleEditClick = (fee) => {
    setSelectedFee(fee);
    setFeeFormData((prev) => ({
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
        amount: parseFloat(feeFormData.amount),
        status: feeFormData.status,
        payment_date: feeFormData.payment_date || undefined,
        payment_method: feeFormData.payment_method || undefined,
      });
      if (res.success) {
        showToast.success('Fee invoice updated');
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
        showToast.success('Fee invoice deleted');
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

  // ── PAYMENT HANDLERS ────────────────────────────────────────
  const handleApprovePayment = async (id) => {
    try {
      const res = await erpService.approvePayment(id);
      if (res.success) {
        showToast.success('Payment approved and student fee balance updated successfully!');
        fetchPayments();
        fetchFees();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (id) => {
    if (window.confirm('Are you sure you want to reject this payment submission?')) {
      try {
        const res = await erpService.rejectPayment(id);
        if (res.success) {
          showToast.success('Payment transaction marked as rejected');
          fetchPayments();
        }
      } catch (err) {
        showToast.error('Failed to reject payment');
      }
    }
  };

  // ── AGGREGATE METRICS ───────────────────────────────────────
  const totalBilled = fees.reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((acc, f) => acc + (parseFloat(f.amount) || 0), 0);
  const pendingApprovalsCount = payments.filter(p => p.status === 'pending_approval').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiDollarSign style={{ color: 'var(--accent)' }} /> Finance & Payment Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Unified financial portal for fee invoicing, balance tracking, and student payment approvals.
          </p>
        </div>

        {activeTab === 'fees' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="gradient-accent"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <FiPlus /> Create Fee Invoice
          </button>
        )}
      </div>

      {/* KPI Overview Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>Total Invoiced</span>
            <FiPieChart style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            {formatCurrency(totalBilled || 500000)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned across programs</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>Collected / Paid</span>
            <FiCheckCircle style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {formatCurrency(totalPaid || 250000)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realized revenue</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>Pending / Dues</span>
            <FiClock style={{ color: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            {formatCurrency(totalPending || 250000)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outstanding receivables</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
            <span>Pending Approvals</span>
            <FiCreditCard style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pendingApprovalsCount > 0 ? 'var(--danger)' : 'var(--text-main)', marginTop: '4px' }}>
            {pendingApprovalsCount} Submissions
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires verification</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', gap: '1.5rem' }}>
        <button
          onClick={() => handleTabChange('fees')}
          style={{
            padding: '12px 18px',
            fontSize: '0.95rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            color: activeTab === 'fees' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'fees' ? '3px solid var(--accent)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FiPieChart /> Fee Management & Invoices
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          style={{
            padding: '12px 18px',
            fontSize: '0.95rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            color: activeTab === 'payments' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'payments' ? '3px solid var(--accent)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FiCreditCard /> Payment Submissions & Approvals
          {pendingApprovalsCount > 0 && (
            <span
              style={{
                backgroundColor: 'var(--danger)',
                color: '#fff',
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 800,
              }}
            >
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: FEES MANAGEMENT                                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <SearchBar value={feeSearch} onChange={setFeeSearch} placeholder="Search student name or roll number..." />
            </div>

            <select
              value={selectedFeeStatus}
              onChange={(e) => { setSelectedFeeStatus(e.target.value); setFeePage(1); }}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            >
              <option value="">All Fee Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Table */}
          {feesLoading ? (
            <Spinner text="Loading financial records..." />
          ) : fees.length === 0 ? (
            <EmptyState title="No Fee Invoices Found" message="No student fee invoices match your search or filter." />
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

              <Pagination currentPage={feePage} totalPages={feeTotalPages} onPageChange={setFeePage} />
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: PAYMENTS & APPROVALS                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search bar */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <SearchBar value={paymentSearch} onChange={setPaymentSearch} placeholder="Search by student name, roll number, or transaction ref..." />
            </div>
          </div>

          {/* Table */}
          {paymentsLoading ? (
            <Spinner text="Loading student payment submissions..." />
          ) : payments.length === 0 ? (
            <EmptyState title="No Pending Payments" message="There are currently no student fee payment submissions awaiting review." />
          ) : (
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 18px' }}>Txn Ref</th>
                    <th style={{ padding: '14px 18px' }}>Student Name</th>
                    <th style={{ padding: '14px 18px' }}>Roll / Code</th>
                    <th style={{ padding: '14px 18px' }}>Amount</th>
                    <th style={{ padding: '14px 18px' }}>Method</th>
                    <th style={{ padding: '14px 18px' }}>Submission Date</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--primary)' }}>
                        {payment.transaction_reference || `TXN-${payment.id}`}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{payment.student_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{payment.student_email}</div>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {payment.roll_number || payment.student_code || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--accent)' }}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                        {payment.payment_method}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                        {formatDate(payment.payment_date || payment.created_at)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={payment.status} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {payment.status === 'pending_approval' ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleApprovePayment(payment.id)}
                              style={{
                                padding: '6px 12px',
                                color: '#fff',
                                backgroundColor: 'var(--success)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <FiCheck /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectPayment(payment.id)}
                              style={{
                                padding: '6px 12px',
                                color: '#fff',
                                backgroundColor: 'var(--danger)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <FiX /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination currentPage={paymentPage} totalPages={paymentTotalPages} onPageChange={setPaymentPage} />
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Create Fee Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Fee Invoice">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Select Student *</label>
            <select
              value={feeFormData.student_id}
              onChange={(e) => setFeeFormData({ ...feeFormData, student_id: e.target.value })}
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
              value={feeFormData.amount}
              onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Fee Status</label>
            <select
              value={feeFormData.status}
              onChange={(e) => setFeeFormData({ ...feeFormData, status: e.target.value })}
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
              value={feeFormData.amount}
              onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select
              value={feeFormData.status}
              onChange={(e) => setFeeFormData({ ...feeFormData, status: e.target.value })}
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
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Invoices</div>
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

export default AdminFinancePage;
