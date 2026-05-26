// src/components/layout/Topbar.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Bell, ChevronDown, Menu, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '@/contexts/AuthContext';
import { WardenAuthContext } from '@/contexts/WardenAuthContext';

export default function Topbar({ onMenuClick = () => {} }) {
    const studentCtx = useContext(AuthContext);
    const studentUser = studentCtx?.user ?? null;
    const studentLogout = studentCtx?.logout ?? null;

    const wardenCtx = useContext(WardenAuthContext);
    const wardenUser = wardenCtx?.user ?? null;
    const wardenLogout = wardenCtx?.logout ?? null;

    const user = wardenUser ?? studentUser;
    const logout = wardenLogout ?? studentLogout;

    const [open, setOpen] = useState(false);
    const ref = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const goToProfile = () => {
        if (wardenUser) {
            navigate('/warden/profile');
        } else {
            navigate('/student/profile');
        }
    };

    const handleLogout = () => {
        try {
            if (typeof logout === 'function') logout();
        } catch (e) {
            console.debug('logout failed', e);
        }
        if (wardenUser) navigate('/login-warden');
        else navigate('/login');
    };

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const defaultPortrait = "https://lh3.googleusercontent.com/aida-public/AB6AXuClYXwfMGKr6BLSoenyoCoNEph4qgeJ0myVSVG-n5OEmHKBg2e37HdMET5tHFdH-GBLhjzwbvEgD-qrg20UyX9jcHTJoc2Kr46TYFGzqYIoBeLtkQwNo6ZO1NHQ9qPMdCc4vIp9JEeFTiQTmFTDGkqhG4SQC4GwijJyYQdQOwSVq8HebShzrnh59T_bpTz7o8Z_iRpkjhPzMRN2S9rNvGEa0MfVrFB6rhuANXUi6XoiqD87lD49vWovg0wLT7aH0bU-zkRAsQs_LdI";

    return (
        <header className={`h-16 flex justify-between items-center px-6 transition-all duration-300 w-full z-40 ${
            scrolled 
                ? 'bg-surface/95 backdrop-blur-md shadow-sm border-b border-outline-variant/30' 
                : 'bg-transparent border-b border-transparent shadow-none'
        }`}>
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <button 
                    onClick={onMenuClick} 
                    className="md:hidden p-2 rounded-full hover:bg-surface-container-low transition-colors" 
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5 text-portal-primary" />
                </button>

                {/* Optional heading indicator next to Menu button (useful context) */}
                <div className="hidden md:block">
                    <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">
                        {wardenUser ? 'Warden Administration' : 'Student Portal'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Quick Actions (Notifications / Support) */}
                <div className="flex gap-2">
                    <button className="hover:bg-surface-container-low rounded-full p-2 transition-colors relative group">
                        <Bell className="w-5 h-5 text-portal-primary" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-portal-error rounded-full border-2 border-surface animate-pulse" />
                    </button>
                    <button 
                        onClick={() => navigate(wardenUser ? '/warden/settings' : '/student/support')}
                        className="hover:bg-surface-container-low rounded-full p-2 transition-colors"
                    >
                        <HelpCircle className="w-5 h-5 text-portal-primary" />
                    </button>
                </div>

                {/* Profile Widget Dropdown */}
                <div ref={ref} className="relative">
                    <button 
                        onClick={() => setOpen(s => !s)} 
                        className="flex items-center gap-4 border-l border-outline-variant/60 pl-6 focus:outline-none hover:opacity-90 active:scale-95 transition-all text-left"
                    >
                        <div className="text-right hidden lg:block">
                            <p className="font-semibold text-sm text-portal-primary leading-tight font-title-lg">
                                {user?.name ?? 'Alex Johnson'}
                            </p>
                            <p className="text-xs text-on-surface-variant font-label-sm">
                                {user?.email ?? 'alex.j@university.edu'}
                            </p>
                        </div>

                        {/* User Profile Avatar Portrait */}
                        <img 
                            alt="Student Portrait" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-container shrink-0 shadow-sm"
                            src={defaultPortrait}
                            onError={(e) => {
                                // fallback if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        {/* Custom Initials Circle Backup */}
                        <div 
                            style={{ display: 'none' }}
                            className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-portal-primary shrink-0"
                        >
                            {user?.name?.[0]?.toUpperCase() ?? 'S'}
                        </div>

                        <ChevronDown className="w-4 h-4 text-on-surface-variant/80 hidden sm:block shrink-0" />
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-3 w-48 bg-white border border-outline-variant/30 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-2 bg-surface border-b border-outline-variant/10 lg:hidden">
                                <p className="font-bold text-xs text-portal-primary truncate">{user?.name}</p>
                                <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
                            </div>
                            <button 
                                onClick={() => { goToProfile(); setOpen(false); }} 
                                className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                            >
                                Profile Details
                            </button>
                            <button 
                                onClick={() => { handleLogout(); setOpen(false); }} 
                                className="w-full text-left px-4 py-3 text-sm font-semibold text-portal-error hover:bg-red-50 border-t border-outline-variant/10 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
