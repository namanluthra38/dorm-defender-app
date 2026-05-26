// src/pages/StudentHome.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';
import { X } from 'lucide-react';

export default function StudentHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-portal-background font-body-md text-on-surface">
      {/* Sidebar Shell - Fixed on Left (Desktop) */}
      <aside className="w-[280px] h-full fixed left-0 top-0 bg-surface-container-lowest hidden md:flex flex-col p-6 border-r border-outline-variant/30 shadow-sm z-50">
        <Sidebar />
      </aside>

      {/* Top App Bar Header - Fixed next to sidebar (Desktop) */}
      <div className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] z-40">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-50 flex animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-[280px] h-full p-6 shadow-2xl relative flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-portal-primary" />
              </button>
            </div>
            <Sidebar onToggle={() => setSidebarOpen(false)} isMobile={true} />
          </div>
          {/* clicking outside sidebar closes it */}
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full md:ml-[280px] md:w-[calc(100%-280px)] pt-24 px-6 pb-8 min-h-screen bg-portal-background">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
