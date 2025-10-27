import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isInitializing } = useAuth();

  // While auth is initializing we should not redirect (avoid false negatives during startup)
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // normalize roles to lowercase strings when available
  const userRole = typeof user.role === 'string' ? user.role.trim().toLowerCase() : null;
  const expectedRole = typeof allowedRole === 'string' ? allowedRole.trim().toLowerCase() : allowedRole;

  if (!userRole) {
    console.warn('ProtectedRoute: user has no role after initialization, redirecting to default /student', user);
    return <Navigate to="/student" replace />;
  }

  if (expectedRole && userRole !== expectedRole) {
    // user is authenticated but not authorized for this route -> redirect to their home
    return <Navigate to={`/${userRole}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
