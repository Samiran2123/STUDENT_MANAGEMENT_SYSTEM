import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ links = [], isOpen = true }) => {
  return (
    <aside
      style={{
        width: isOpen ? '250px' : '70px',
        height: 'calc(100vh - 70px)',
        position: 'sticky',
        top: '70px',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border-glass)',
        padding: '1.25rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        transition: 'width 0.3s ease',
        zIndex: 90,
        overflowY: 'auto',
      }}
    >
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.end}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            color: isActive ? '#ffffff' : 'var(--text-muted)',
            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
            border: isActive ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
            fontWeight: isActive ? 600 : 500,
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          })}
        >
          {link.icon && (
            <span style={{ fontSize: '1.15rem', display: 'flex', flexShrink: 0 }}>
              {link.icon}
            </span>
          )}
          {isOpen && <span>{link.label}</span>}
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
