// src/layouts/StudentLayout.jsx
import React, { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';
import { Outlet } from 'react-router-dom';

export default function StudentLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <Topbar onMenuClick={() => setMobileOpen(v => !v)} />
            <div className="flex flex-1">
                {/* Sidebar: you can hide/show on mobile based on mobileOpen */}
                <aside className={`w-64 p-4 border-r hidden md:block`}>
                    <Sidebar />
                </aside>

                {/* Mobile sidebar overlay */}
                {mobileOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
                        <div className="absolute left-0 top-0 w-64 h-full bg-white p-4">
                            <Sidebar onToggle={() => setMobileOpen(false)} />
                        </div>
                    </div>
                )}

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
