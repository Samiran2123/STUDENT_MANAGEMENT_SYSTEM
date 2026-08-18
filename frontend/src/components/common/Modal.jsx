import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

/**
 * Modal — renders via React Portal into document.body so it always escapes
 * any parent `overflow: hidden/auto/scroll` container (fixes clipping in
 * AdminLayout where <main> has overflowY: 'auto').
 *
 * Structure:
 *   Backdrop (fixed, inset-0, z-[9999])
 *     └── Panel (flex column, max-h viewport-safe)
 *           ├── Header (sticky, never scrolls)
 *           ├── Body  (overflow-y: auto — only this scrolls)
 *           └── Footer slot (optional, sticky, never scrolls)
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '520px',
  footer = null,
}) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        /* Covers the entire viewport regardless of any parent stacking context */
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* Comfortable breathing room so the panel never touches the edges */
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.18s ease forwards',
      }}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          /* Never taller than viewport minus 2×padding (works at 150% zoom too) */
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8)',
          /* No overflow:hidden here — let children handle their own scroll */
          overflow: 'hidden',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,   /* never shrinks */
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              display: 'flex',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              marginLeft: '1rem',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <FiX />
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────────────── */}
        <div
          style={{
            padding: '1.4rem',
            overflowY: 'auto',
            flex: 1,           /* takes remaining space, scrolls if needed */
            minHeight: 0,      /* required for flex children to shrink past content */
          }}
        >
          {children}
        </div>

        {/* ── Optional Sticky Footer ────────────────────────────────────── */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.4rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.85rem',
              flexShrink: 0,   /* never shrinks */
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
