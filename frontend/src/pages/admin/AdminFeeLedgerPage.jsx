import React, { useState, useEffect } from 'react';
import { FiFileText, FiDollarSign } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import api from '../../services/api';

const AdminFeeLedgerPage = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      // Mocking the call since we can't edit backend to add this endpoint
      const res = await api.get('/erp/fee-ledger').catch(() => ({ data: { success: true, data: [] } }));
      if (res.data.success) {
        let data = res.data.data || [];
        if (search) {
          data = data.filter(l => l.student_name?.toLowerCase().includes(search.toLowerCase()));
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setLedger(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch fee ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiFileText /> Student Fee Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            View total fees, paid amounts, and pending balances for students.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search student name..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading ledger..." />
      ) : ledger.length === 0 ? (
        <EmptyState title="No Ledger Records" message="The backend endpoint /api/erp/fee-ledger is currently not implemented." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Student</th>
                <th style={{ padding: '14px 18px' }}>Roll Number</th>
                <th style={{ padding: '14px 18px' }}>Total Fee</th>
                <th style={{ padding: '14px 18px' }}>Paid Amount</th>
                <th style={{ padding: '14px 18px' }}>Pending Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((record, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{record.student_name}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{record.roll_number}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>₹{record.total_fee}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--success)' }}>₹{record.paid_amount}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--danger)' }}>₹{record.pending_amount}</td>
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

export default AdminFeeLedgerPage;
