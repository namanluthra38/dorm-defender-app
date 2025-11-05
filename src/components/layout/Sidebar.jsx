// src/components/layout/Sidebar.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FileText,
    User,
    CreditCard,
    MessageSquare,
    Bell,
    Settings,
    Home,
    Building,
    Users,
    Grid,
    ClipboardList,
    Calendar
} from 'lucide-react';

// don't import useAuth (strict) — read context optionally
import { AuthContext } from '@/contexts/AuthContext';
import { WardenAuthContext } from '@/contexts/WardenAuthContext';

/**
 * Sidebar
 * Props:
 *  - onToggle?: () => void   // optional, used by parent to toggle mobile sidebar
 */
export default function Sidebar({ onToggle }) {
    const studentCtx = useContext(AuthContext);
    const user = studentCtx?.user ?? null;

    const wardenCtx = useContext(WardenAuthContext);
    const wardenUser = wardenCtx?.user ?? null;

    // prefer wardenUser.role when available, otherwise student user
    const role = (wardenUser?.role || user?.role || 'STUDENT').toString().toLowerCase();

    // common nav link class
    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-2 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`;

    // Warden-specific nav
    if (role === 'warden') {
        return (
            <nav className="flex flex-col gap-2">
                <NavLink to="." end className={linkClass} onClick={onToggle}>
                    <Home className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Dashboard</span>
                </NavLink>

                <NavLink to="students" className={linkClass} onClick={onToggle}>
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Students</span>
                </NavLink>

                <NavLink to="rooms" className={linkClass} onClick={onToggle}>
                    <Grid className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Rooms</span>
                </NavLink>

                <NavLink to="requests" className={linkClass} onClick={onToggle}>
                    <ClipboardList className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Requests</span>
                </NavLink>

                <NavLink to="announcements" className={linkClass} onClick={onToggle}>
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Announcements</span>
                </NavLink>

                <NavLink to="attendance" className={linkClass} onClick={onToggle}>
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Attendance</span>
                </NavLink>

                <NavLink to="complaints" className={linkClass} onClick={onToggle}>
                    <Bell className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Complaints</span>
                </NavLink>

                <div className="border-t my-2" />

                <NavLink to="profile" className={linkClass} onClick={onToggle}>
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Profile</span>
                </NavLink>

                <NavLink to="settings" className={linkClass} onClick={onToggle}>
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Settings</span>
                </NavLink>
            </nav>
        );
    }

    // Default (student) nav
    return (
        <nav className="flex flex-col gap-2">
            <NavLink to="." end className={linkClass} onClick={onToggle}>
                <Home className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Dashboard</span>
            </NavLink>

            <NavLink to="room" className={linkClass} onClick={onToggle}>
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Room</span>
            </NavLink>

            <NavLink to="fees" className={linkClass} onClick={onToggle}>
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Fees</span>
            </NavLink>

            <NavLink to="complaints" className={linkClass} onClick={onToggle}>
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Complaints</span>
            </NavLink>

            <NavLink to="announcements" className={linkClass} onClick={onToggle}>
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Announcements</span>
            </NavLink>

            <NavLink to="support" className={linkClass} onClick={onToggle}>
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Support</span>
            </NavLink>

            <div className="border-t my-2" />

            {/* Settings / Admin links */}
            <NavLink to="profile" className={linkClass} onClick={onToggle}>
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Profile</span>
            </NavLink>

            {/* Role-aware link example: show Hostels/Manage only for wardens/admins */}
            {['warden', 'admin'].includes(role) && (
                <NavLink to="/warden/hostels" className={linkClass} onClick={onToggle}>
                    <Building className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Manage Hostels</span>
                </NavLink>
            )}
        </nav>
    );
}
