import React from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiLogOut, FiUser, FiBell } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from './StatusBadge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-glass)',
        backgroundColor: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              fontSize: '1.35rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            }}
          >
            <FiMenu />
          </button>
        )}

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#ffffff',
              fontSize: '1.1rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.02em' }} className="gradient-text">
            EduPulse <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.7, color: 'var(--text-muted)' }}>SMS</span>
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          style={{
            position: 'relative',
            color: 'var(--text-muted)',
            fontSize: '1.15rem',
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
          }}
          title="Notifications"
        >
          <FiBell />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--accent)',
              borderRadius: '50%',
            }}
          />
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user.name || 'User'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user.role}
                </span>
              </div>
            </Link>

            <button
              onClick={logout}
              style={{
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              title="Logout"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="gradient-accent"
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
