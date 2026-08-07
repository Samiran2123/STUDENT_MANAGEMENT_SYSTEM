import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ title = 'No Data Found', message = 'There are no records to display at this time.', icon: Icon = FiInbox, action }) => {
  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          fontSize: '1.75rem',
        }}
      >
        <Icon />
      </div>

      <div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          {title}
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '360px' }}>
          {message}
        </p>
      </div>

      {action && (
        <div style={{ marginTop: '0.5rem' }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
