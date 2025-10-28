import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, allowedRole }) => {

  // Always call hooks in the same order
  const { user, isInitializing, studentComposite, refreshUserComposite, token } = useAuth();
  const location = useLocation();
  const [loadingComposite, setLoadingComposite] = useState(false);

  // normalize roles to lowercase strings when available
  const userRole = typeof user?.role === 'string' ? user.role.trim().toLowerCase() : null;
  const expectedRole = typeof allowedRole === 'string' ? allowedRole.trim().toLowerCase() : allowedRole;

  // If user is a student, ensure we know their composite (student/hostel/room) so we can decide routing.
  useEffect(() => {
    let cancelled = false;
    const ensureComposite = async () => {
      try {
        if (userRole === 'student' && !studentComposite && token) {
          setLoadingComposite(true);
          await refreshUserComposite();
          // AuthContext will update studentComposite state
        }
      } catch (e) {
        // ignore errors; other parts will handle auth state
      } finally {
        if (!cancelled) setLoadingComposite(false);
      }
    };
    ensureComposite();
    return () => { cancelled = true; };
    // include refreshUserComposite in deps to satisfy rules, others are fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, studentComposite, token, refreshUserComposite]);

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

  if (!userRole) {
    console.warn('ProtectedRoute: user has no role after initialization, redirecting to default /student', user);
    return <Navigate to="/student" replace />;
  }

  if (loadingComposite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading account details…</div>
      </div>
    );
  }

  // If allowedRole is set and doesn't match the user's role, redirect to their default home
  if (expectedRole && userRole !== expectedRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  // If user is a student and does NOT have a hostel assigned, only allow booking route.
  if (userRole === 'student') {
    const hasHostel = !!(studentComposite?.student?.hostelId);
    const bookingPath = '/student/booking';
    const isBookingRoute = location.pathname === bookingPath || location.pathname.startsWith(`${bookingPath}/`);

    if (!hasHostel && !isBookingRoute) {
      return <Navigate to={bookingPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
