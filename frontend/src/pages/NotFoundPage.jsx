import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '3.5rem 2rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <FiAlertTriangle />
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.25rem' }} className="gradient-text">
          404
        </h1>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Page Not Found
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          to="/"
          className="gradient-accent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
