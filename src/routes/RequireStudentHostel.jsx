// javascript
// File: `hhfrontend/src/routes/RequireStudentHostel.jsx`
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useStudentComposite from '@/hooks/useStudentComposite';

const hasHostel = (composite, user) => Boolean(
    composite?.hostel ||
    composite?.student?.hostelId ||
    composite?.room?.hostelId ||
    user?.hostelId
);

export default function RequireStudentHostel({ children, redirectTo = '/student/booking' }) {
    const { user, isInitializing } = useAuth();
    // only trigger composite fetch when we have a user/token
    const { data: composite, isLoading } = useStudentComposite({ enabled: !!user });

    const location = useLocation();

    // Still determining auth / composite -> show a small loader (prevents flash-through)
    if (isInitializing || (user && isLoading)) {
        return <div>Loading…</div>;
    }

    // Not logged in -> go to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : null;

    // If not a student, route to their area
    if (role && role !== 'student') {
        return <Navigate to={`/${role}`} replace />;
    }

    // Student but no hostel -> redirect to booking
    if (!hasHostel(composite, user)) {
        return <Navigate to={redirectTo} replace />;
    }

    // OK to render requested student page
    return children;
}
