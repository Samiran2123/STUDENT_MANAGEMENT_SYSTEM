import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({ value, onChange, placeholder = 'Search...', width = '100%' }) => {
  return (
    <div
      style={{
        position: 'relative',
        width,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <FiSearch
        style={{
          position: 'absolute',
          left: '14px',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 38px 10px 40px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-main)',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-glass)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
