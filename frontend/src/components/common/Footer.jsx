import React from 'react';

const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        backgroundColor: 'rgba(9, 13, 22, 0.4)',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          &copy; {new Date().getFullYear()} <strong style={{ color: 'var(--text-main)' }}>EduPulse</strong> Student Management System.
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>Support</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
