// src/components/layout/Sidebar.jsx
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Home,
    Megaphone,
    Settings,
    User,
    Building,
    Users,
    Grid,
    ClipboardList,
    Calendar,
    CreditCard,
    Bell
} from 'lucide-react';

import { AuthContext } from '@/contexts/AuthContext';
import { WardenAuthContext } from '@/contexts/WardenAuthContext';

export default function Sidebar({ onToggle, isMobile = false }) {
    const studentCtx = useContext(AuthContext);
    const user = studentCtx?.user ?? null;

    const wardenCtx = useContext(WardenAuthContext);
    const wardenUser = wardenCtx?.user ?? null;

    const role = (wardenUser?.role || user?.role || 'STUDENT').toString().toLowerCase();

    // Design-system active & passive nav classes
    const linkClass = ({ isActive }) =>
        `flex items-center gap-4 p-3 rounded-xl transition-all duration-200 active:scale-95 ${
            isActive 
                ? 'text-portal-primary font-bold bg-surface-container-high' 
                : 'text-on-surface-variant hover:bg-surface-container-low'
        }`;

    const renderHeader = () => (
        <div className="mb-8 px-2">
            <h1 className="text-xl font-bold tracking-tight text-portal-primary font-headline-md">HostelHub</h1>
            <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">Academic Residency</p>
        </div>
    );

    // Warden-specific Navigation
    if (role === 'warden') {
        return (
            <div className="flex flex-col h-full">
                {!isMobile && renderHeader()}
                <nav className="flex-1 space-y-1">
                    <NavLink to="." end className={linkClass} onClick={onToggle}>
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Dashboard</span>
                    </NavLink>

                    <NavLink to="students" className={linkClass} onClick={onToggle}>
                        <Users className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Students</span>
                    </NavLink>

                    <NavLink to="rooms" className={linkClass} onClick={onToggle}>
                        <Grid className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Rooms</span>
                    </NavLink>

                    <NavLink to="requests" className={linkClass} onClick={onToggle}>
                        <ClipboardList className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Requests</span>
                    </NavLink>

                    <NavLink to="announcements" className={linkClass} onClick={onToggle}>
                        <Megaphone className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Announcements</span>
                    </NavLink>

                    <NavLink to="attendance" className={linkClass} onClick={onToggle}>
                        <Calendar className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Attendance</span>
                    </NavLink>

                    <NavLink to="complaints" className={linkClass} onClick={onToggle}>
                        <Bell className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Complaints</span>
                    </NavLink>
                </nav>

                <div className="border-t border-outline-variant/20 my-4" />

                <div className="space-y-1">
                    <NavLink to="settings" className={linkClass} onClick={onToggle}>
                        <Settings className="w-5 h-5 shrink-0" />
                        <span className="font-body-md">Settings</span>
                    </NavLink>
                </div>
            </div>
        );
    }

    // Default (Student) Navigation
    return (
        <div className="flex flex-col h-full">
            {!isMobile && renderHeader()}
            <nav className="flex-1 space-y-1">
                <NavLink to="." end className={linkClass} onClick={onToggle}>
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Overview</span>
                </NavLink>

                <NavLink to="complaints" className={linkClass} onClick={onToggle}>
                    <MessageSquare className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Complaints</span>
                </NavLink>

                <NavLink to="room" className={linkClass} onClick={onToggle}>
                    <Home className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Room Details</span>
                </NavLink>

                <NavLink to="announcements" className={linkClass} onClick={onToggle}>
                    <Megaphone className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Announcements</span>
                </NavLink>

                <NavLink to="fees" className={linkClass} onClick={onToggle}>
                    <CreditCard className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Fees</span>
                </NavLink>

                <NavLink to="support" className={linkClass} onClick={onToggle}>
                    <Bell className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Support</span>
                </NavLink>
            </nav>

            <div className="border-t border-outline-variant/20 my-4" />

            <div className="space-y-1">
                <NavLink to="settings" className={linkClass} onClick={onToggle}>
                    <Settings className="w-5 h-5 shrink-0" />
                    <span className="font-body-md">Settings</span>
                </NavLink>
            </div>
        </div>
    );
}
