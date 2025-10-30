// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useStudentComposite from '@/hooks/useStudentComposite';

const ProtectedRoute = ({ children, allowedRoles = null, requireHostel = false }) => {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  // Determine if we should fetch composite: only fetch when there is a logged-in student
  const shouldFetchComposite = !!user && String(user.role || '').toLowerCase() === 'student';

  // useStudentComposite accepts options object (v5 react-query). enable only when needed.
  const { data: composite, isLoading: compositeLoading, isError: compositeError } = useStudentComposite({
    enabled: shouldFetchComposite,
  });

  // Debug logs (remove after verifying)
  // eslint-disable-next-line no-console
  console.log('ProtectedRoute user:', user, 'composite:', composite, 'loading:', compositeLoading, 'error:', compositeError);

  // 1. while auth provider is initializing, don't redirect
  if (isInitializing) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div>Loading…</div>
        </div>
    );
  }

  // 2. not logged in -> goto login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. role mismatch with allowedRoles
  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(String(user.role || '').toLowerCase())) {
    // redirect to user's home or a fallback
    return <Navigate to={`/${String(user.role || '').toLowerCase()}`} replace />;
  }

  // 4. If requireHostel, we must ensure composite is loaded (or at least not falsely assumed)
  if (requireHostel && String(user.role || '').toLowerCase() === 'student') {

    // if query is enabled but still loading, wait (avoid false negatives)
    if (shouldFetchComposite && compositeLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
            <div>Loading account details…</div>
          </div>
      );
    }

    // if composite fetch errored or no composite available, be conservative:
    // - if errored => show an error or allow booking flow depending on your app. Here we'll show an error page.
    if (compositeError) {
      return (
          <div className="min-h-screen flex items-center justify-center text-red-600">
            <div>Failed to load account details. Please refresh or contact support.</div>
          </div>
      );
    }

    // Now compute whether hostel exists — check multiple shapes safely:
    const hasHostel = Boolean(
        // composite.hostel exists (object)
        (composite && composite.hostel) ||

        // composite.student.hostelId exists (some DTOs store id on student)
        (composite && composite.student && (composite.student.hostelId || composite.student.hostel)) ||

        // composite.room.hostelId (room may contain hostelId)
        (composite && composite.room && (composite.room.hostelId || (composite.room.hostel && composite.room.hostel.id))) ||

        // fallback: user itself might include hostelId (if AuthContext set user to student obj)
        (user && (user.hostelId || user.hostel))
    );

    if (!hasHostel) {
      // If user is on booking-related routes, allow; else redirect to booking
      const bookingPath = '/student/booking';
      const isBookingRoute = location.pathname === bookingPath || location.pathname.startsWith(`${bookingPath}/`);
      if (!isBookingRoute) {
        return <Navigate to={bookingPath} replace />;
      }
    }
  }

  // Default: allow access
  return <>{children}</>;
};

export default ProtectedRoute;
