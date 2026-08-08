import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCheckCircle, FiClock, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const StudentFeesPage = () => {
  const [loading, setLoading] = useState(true);
  const [ledgerList, setLedgerList] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const res = await erpService.getStudentLedger();
      if (res.success) {
        setLedgerList(res.data.ledger || []);
        setPaymentHistory(res.data.payments || []);
      }
    } catch (err) {
      showToast.error('Failed to load student fee ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const handleOpenPayModal = (ledger) => {
    setSelectedLedger(ledger);
    setPayAmount(ledger.pending_amount || ledger.total_amount);
    setPaymentMethod('online');
    setTxnRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      showToast.error('Please enter a valid payment amount');
      return;
    }
    if (parseFloat(payAmount) > parseFloat(selectedLedger.pending_amount)) {
      showToast.error('Payment amount cannot exceed outstanding balance');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        student_fee_id: selectedLedger.id,
        amount: parseFloat(payAmount),
        payment_method: paymentMethod,
        transaction_reference: txnRef,
      };

      const res = await erpService.submitPayment(payload);
      if (res.success) {
        showToast.success('Payment submitted! Awaiting admin verification.');
        setPayModalOpen(false);
        fetchLedgerData();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute overall financial totals
  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;

  ledgerList.forEach((item) => {
    totalBilled += parseFloat(item.total_amount) || 0;
    totalPaid += parseFloat(item.paid_amount) || 0;
    totalPending += parseFloat(item.pending_amount) || 0;
  });

  if (loading) {
    return <Spinner text="Loading student financial ledger..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Fee Ledger & Payments</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Official academic fee breakdown, payment submissions, and balance ledger.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Fee Invoice</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{formatCurrency(totalBilled)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Total Verified Paid</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>{formatCurrency(totalPaid)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: totalPending > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>Remaining Balance</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalPending > 0 ? 'var(--warning)' : 'var(--success)', marginTop: '4px' }}>{formatCurrency(totalPending)}</div>
        </div>
      </div>

      {/* Fee Ledger Invoices Section */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem' }}>Current Academic Invoices</h2>
      {ledgerList.length === 0 ? (
        <EmptyState title="No Active Fee Ledger" message="You have no fee invoices assigned for your program yet." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ledgerList.map((item) => (
            <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {item.description || `${item.class_name} Tuition Fee`} ({item.year_name})
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Invoice #{item.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StatusBadge status={item.status} />
                  {parseFloat(item.pending_amount) > 0 && (
                    <button
                      onClick={() => handleOpenPayModal(item)}
                      className="gradient-accent"
                      style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiCreditCard /> Pay Now
                    </button>
                  )}
                </div>
              </div>

              {/* Fee Component Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tuition Fee</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(item.tuition_fee || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exam Fee</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(item.exam_fee || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Library Fee</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(item.library_fee || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Other Fee</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(item.other_fee || 0)}</div>
                </div>
              </div>

              {/* Balance Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Billed: </span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(item.total_amount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(item.paid_amount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Remaining Dues: </span>
                  <strong style={{ color: parseFloat(item.pending_amount) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {formatCurrency(item.pending_amount)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment History / Transactions */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '1rem' }}>Payment Submissions & Verification History</h2>
      {paymentHistory.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No payments submitted yet.</div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Txn Reference</th>
                <th style={{ padding: '14px 18px' }}>Amount</th>
                <th style={{ padding: '14px 18px' }}>Method</th>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Admin Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((pay) => (
                <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--primary)' }}>{pay.transaction_reference || `TXN-${pay.id}`}</td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#fff' }}>{formatCurrency(pay.amount)}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.82rem' }}>{pay.payment_method}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{formatDate(pay.payment_date || pay.created_at)}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={pay.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulated Payment Modal */}
      {payModalOpen && selectedLedger && (
        <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Make Demo Fee Payment - Invoice #${selectedLedger.id}`}>
          <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Outstanding Invoice Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(selectedLedger.pending_amount)}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Enter Payment Amount (₹) *
              </label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                min="1"
                max={selectedLedger.pending_amount}
                required
                style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="online">Online / UPI</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              * Demo payment simulation: Submitting will create a pending payment transaction for admin verification.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="gradient-accent"
              style={{ padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '1rem', marginTop: '8px' }}
            >
              {submitting ? 'Submitting Payment...' : 'Submit Payment for Admin Verification'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentFeesPage;
