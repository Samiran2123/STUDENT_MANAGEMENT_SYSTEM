import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';
import { feesService } from '../../services/feesService';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = ['pending', 'paid', 'overdue', 'waived'];

const StudentFeesPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await feesService.getAll({
        page,
        limit: 15,
        status: selectedStatus || undefined,
      });
      if (res.success) {
        setFees(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error('Failed to load fee ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, [page, selectedStatus]);

  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;

  fees.forEach((f) => {
    const amt = parseFloat(f.amount) || 0;
    totalBilled += amt;
    if (f.status === 'paid') totalPaid += amt;
    else if (f.status === 'pending' || f.status === 'overdue') totalPending += amt;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fee Ledger & Invoices</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Overview of semester tuition fees, payments, and outstanding balances.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tuition Billed</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{formatCurrency(totalBilled)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Cleared Payments</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>{formatCurrency(totalPaid)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: totalPending > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>Outstanding Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPending > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: '4px' }}>{formatCurrency(totalPending)}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Invoice Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading fee ledger..." />
      ) : fees.length === 0 ? (
        <EmptyState title="No Fee Invoices" message="No fee records found." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Invoice ID</th>
                <th style={{ padding: '14px 18px' }}>Amount</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Payment Date</th>
                <th style={{ padding: '14px 18px' }}>Method</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-muted)' }}>#{fee.id}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#fff' }}>{formatCurrency(fee.amount)}</td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={fee.status} /></td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{fee.payment_date ? formatDate(fee.payment_date) : '—'}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.82rem' }}>{fee.payment_method || '—'}</td>
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

export default StudentFeesPage;
