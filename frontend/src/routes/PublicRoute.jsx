import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

export const PublicRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" text="Loading..." />
      </div>
    );
  }

  // If user is already logged in, redirect to their role home page
  if (isAuthenticated && user?.role) {
    const roleRedirectMap = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
    };
    return <Navigate to={roleRedirectMap[user.role] || '/'} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
