import React from 'react';
import { FiUser, FiMail, FiPhone, FiShield, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/common/StatusBadge';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{user?.name || 'User Profile'}</h2>
              <StatusBadge status={user?.role} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              User ID: #{user?.id || 'N/A'} • Authenticated Session
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          Account Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '1.25rem' }}><FiMail /></div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.email || 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}><FiPhone /></div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.phone || 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ color: 'var(--accent)', fontSize: '1.25rem' }}><FiShield /></div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Role & Permissions</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{user?.role || 'Guest'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ color: 'var(--success)', fontSize: '1.25rem' }}><FiCalendar /></div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
              <div style={{ fontWeight: 600, color: 'var(--success)' }}>Active Token Session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
