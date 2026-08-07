import React from 'react';

const StatusBadge = ({ status, type }) => {
  const getColors = () => {
    const s = (status || type || '').toLowerCase();
    switch (s) {
      case 'active':
      case 'paid':
      case 'present':
      case 'approved':
        return { bg: 'var(--success-bg)', text: 'var(--success)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'pending':
      case 'late':
        return { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'inactive':
      case 'overdue':
      case 'absent':
      case 'suspended':
        return { bg: 'var(--danger-bg)', text: 'var(--danger)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'excused':
      case 'waived':
      case 'admin':
      case 'teacher':
      case 'student':
        return { bg: 'var(--info-bg)', text: 'var(--info)', border: 'rgba(59, 130, 246, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.08)', text: 'var(--text-muted)', border: 'var(--border-glass)' };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.text,
        }}
      />
      {status || type}
    </span>
  );
};

export default StatusBadge;
