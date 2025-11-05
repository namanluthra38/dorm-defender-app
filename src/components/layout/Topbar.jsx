// src/components/layout/Topbar.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// optional-context reads
import { AuthContext } from '@/contexts/AuthContext';
import { WardenAuthContext } from '@/contexts/WardenAuthContext';

export default function Topbar({ onMenuClick = () => {} }) {
    // read contexts safely (they may be undefined if provider not mounted)
    const studentCtx = useContext(AuthContext);
    const studentUser = studentCtx?.user ?? null;
    const studentLogout = studentCtx?.logout ?? null;

    const wardenCtx = useContext(WardenAuthContext);
    const wardenUser = wardenCtx?.user ?? null;
    const wardenLogout = wardenCtx?.logout ?? null;

    // prefer warden user when present
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
            // swallow
            console.debug('logout failed', e);
        }
        // navigate to the correct login screen
        if (wardenUser) navigate('/login-warden');
        else navigate('/login');
    };

    return (
        <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Mobile menu button - visible on small screens */}
                    <button onClick={onMenuClick} className="md:hidden p-2 rounded-md hover:bg-gray-100" aria-label="Open menu">
                        <Menu className="w-5 h-5" />
                    </button>

                    <div>
                        <h2 className="text-lg font-semibold">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
                        <p className="text-sm text-gray-500">{wardenUser ? 'Warden dashboard' : 'Student dashboard'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 rounded-md hover:bg-gray-100"><Bell className="w-5 h-5" /></button>

                    <div ref={ref} className="relative">
                        <button onClick={() => setOpen(s => !s)} className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">{user?.name?.[0] ?? 'S'}</div>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        {open && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                                <button onClick={() => { goToProfile(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Profile</button>
                                <button onClick={() => { handleLogout(); setOpen(false); }} className="w-full text-left px-3 py-2 text-rose-600 hover:bg-gray-50">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
