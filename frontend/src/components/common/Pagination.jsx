import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  const btnStyle = (disabled, active) => ({
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-glass)',
    backgroundColor: active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
    color: active ? '#ffffff' : disabled ? 'var(--text-dark)' : 'var(--text-main)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 0',
        marginTop: '1rem',
        borderTop: '1px solid var(--border-glass)',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Page {currentPage} of {totalPages}
      </span>

      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button
          style={btnStyle(currentPage === 1, false)}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <FiChevronLeft style={{ marginRight: '4px' }} /> Prev
        </button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          // Render first, last, current, and adjacent pages
          if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
            return (
              <button
                key={page}
                style={btnStyle(false, page === currentPage)}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            );
          } else if (page === 2 && currentPage > 3) {
            return <span key="dots1" style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>;
          } else if (page === totalPages - 1 && currentPage < totalPages - 2) {
            return <span key="dots2" style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>;
          }
          return null;
        })}

        <button
          style={btnStyle(currentPage === totalPages, false)}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <FiChevronRight style={{ marginLeft: '4px' }} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
