// src/components/student/StudentHome.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';

export default function StudentHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Floating hamburger for cases where topbar button isn't accessible */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow hover:bg-gray-100"
        aria-label="Open menu"
        style={{ zIndex: 9999 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex flex-1">
          <div className="p-4">
            <Sidebar onToggle={() => setSidebarOpen(s => !s)} />
          </div>


        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-white p-4 overflow-auto min-h-screen" style={{ zIndex: 9999 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button onClick={() => setSidebarOpen(false)} className="px-3 py-1 rounded bg-gray-100">Close</button>
            </div>
            <Sidebar onToggle={() => setSidebarOpen(false)} />
          </div>
        )}


        <main className="flex-1 min-w-0 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="min-h-[60vh] bg-transparent">
              <Outlet />
            </div>
          </div>
        </main>


      </div>
    </div>
  );
}
