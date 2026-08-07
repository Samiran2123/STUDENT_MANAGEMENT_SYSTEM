import { Toaster, toast as hotToast } from 'react-hot-toast';

export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#f8fafc',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          fontSize: '0.9rem',
          padding: '12px 18px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#0f172a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#0f172a',
          },
        },
      }}
    />
  );
};

export const showToast = {
  success: (msg) => hotToast.success(msg),
  error: (msg) => hotToast.error(msg),
  info: (msg) => hotToast(msg, { icon: 'ℹ️' }),
  loading: (msg) => hotToast.loading(msg),
  dismiss: (id) => hotToast.dismiss(id),
};

export default ToastContainer;
