import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

const Sidebar = ({ links = [], isOpen = true }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({});

  // Auto-expand groups when active route matches any child
  useEffect(() => {
    const currentPath = location.pathname;
    const newExpanded = { ...expandedGroups };
    links.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (c) => currentPath === c.path || currentPath.startsWith(c.path + '/')
        );
        if (hasActiveChild) {
          newExpanded[item.label] = true;
        }
      }
    });
    setExpandedGroups(newExpanded);
  }, [location.pathname]);

  const toggleGroup = (groupLabel) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

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
        gap: '0.35rem',
        transition: 'width 0.3s ease',
        zIndex: 90,
        overflowY: 'auto',
      }}
    >
      {links.map((item) => {
        if (item.children && item.children.length > 0) {
          const isExpanded = !!expandedGroups[item.label];
          const hasActiveChild = item.children.some(
            (c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/')
          );

          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: hasActiveChild ? '#ffffff' : 'var(--text-muted)',
                  backgroundColor: hasActiveChild ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                  border: hasActiveChild ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
                  fontWeight: hasActiveChild ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
                  {item.icon && (
                    <span style={{ fontSize: '1.15rem', display: 'flex', flexShrink: 0, color: hasActiveChild ? 'var(--primary)' : 'inherit' }}>
                      {item.icon}
                    </span>
                  )}
                  {isOpen && <span>{item.label}</span>}
                </div>
                {isOpen && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex' }}>
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                )}
              </button>

              {/* Children Sub-links */}
              {isExpanded && isOpen && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    paddingLeft: '1.25rem',
                    marginTop: '2px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    marginLeft: '1.25rem',
                  }}
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.end}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        border: isActive ? '1px solid rgba(79, 70, 229, 0.4)' : '1px solid transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      })}
                    >
                      {child.icon && (
                        <span style={{ fontSize: '1rem', display: 'flex', flexShrink: 0 }}>
                          {child.icon}
                        </span>
                      )}
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Standard Single NavLink
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
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
            {item.icon && (
              <span style={{ fontSize: '1.15rem', display: 'flex', flexShrink: 0 }}>
                {item.icon}
              </span>
            )}
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        );
      })}
    </aside>
  );
};

export default Sidebar;
