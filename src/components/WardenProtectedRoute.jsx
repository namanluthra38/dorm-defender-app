import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWardenAuth } from '@/contexts/WardenAuthContext';

const WardenProtectedRoute = ({ children, allowedRole }) => {
    const { user, isInitializing } = useWardenAuth();

    if (isInitializing) return null; // or a spinner

    if (!user || user.role !== (allowedRole || 'WARDEN')) {
        return <Navigate to="/login-warden" replace />;
    }

    return children;
};

export default WardenProtectedRoute;