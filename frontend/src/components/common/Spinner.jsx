import React from 'react';

const Spinner = ({ size = 'md', text, center = true }) => {
  const sizes = {
    sm: '20px',
    md: '36px',
    lg: '54px',
  };

  const spinnerStyle = {
    width: sizes[size] || sizes.md,
    height: sizes[size] || sizes.md,
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTop: '3px solid var(--primary)',
    borderRight: '3px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = center ? {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem',
  } : {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinnerStyle} />
      {text && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</span>}
    </div>
  );
};

export default Spinner;
