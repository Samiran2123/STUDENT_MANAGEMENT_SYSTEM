import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCheck, FiX } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { showToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await erpService.getPendingPayments();
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(p => 
            p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.transaction_reference?.toLowerCase().includes(search.toLowerCase())
          );
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setPayments(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search]);

  const handleApprove = async (id) => {
    try {
      const res = await erpService.approvePayment(id);
      if (res.success) {
        showToast.success('Payment verified & student ledger updated successfully!');
        fetchPayments();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this payment submission?')) {
      try {
        const res = await erpService.rejectPayment(id);
        if (res.success) {
          showToast.success('Payment transaction rejected');
          fetchPayments();
        }
      } catch (err) {
        showToast.error('Failed to reject payment');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiDollarSign /> Payment Verification & Approval
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Verify pending student fee submissions and automatically update the financial ledger.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or transaction ref..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading student payment submissions..." />
      ) : payments.length === 0 ? (
        <EmptyState title="No Pending Payments" message="There are currently no unverified student payment submissions." />
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
                        <button onClick={() => handleApprove(payment.id)} style={{ padding: '6px 12px', color: '#fff', backgroundColor: 'var(--success)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiCheck /> Approve
                        </button>
                        <button onClick={() => handleReject(payment.id)} style={{ padding: '6px 12px', color: '#fff', backgroundColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
