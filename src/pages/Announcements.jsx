// src/pages/Announcements.jsx
import React from 'react';
import { Info, Bell, Calendar, ChevronRight } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

const Announcements = () => {
  const announcements = [
    { 
      id: 1, 
      title: 'Mess Timings Updated', 
      date: '2025-10-20', 
      body: 'Mess timings will be adjusted to 7:30 AM - 9:30 AM for breakfast starting this coming Monday. Please make sure to bring your residency barcode IDs for barcode verification scans.',
      category: 'Dining Services',
      urgent: false
    },
    { 
      id: 2, 
      title: 'Scheduled Power Shutdown', 
      date: '2025-10-18', 
      body: 'Vite electrical infrastructure maintenance will shut down wing power on Saturday 28th October from 10:00 AM to 04:00 PM. Access routers and hot water utilities will be temporarily offline.',
      category: 'Maintenance',
      urgent: true
    }
  ];

  return (
    <PageContainer>
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg animate-in fade-in duration-300">
        
        {/* Header Section */}
        <header className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-stack-sm text-primary">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Announcements</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Stay updated with the latest academic residence announcements and notifications.</p>
        </header>

        {/* Announcements Card Feed list */}
        <div className="flex flex-col gap-6">
          {announcements.map(a => {
            // Urgent announcements highlight or dynamic color category icon
            const iconBg = a.urgent ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#dde1ff] text-[#00288e]';
            const icon = a.urgent ? <Bell className="w-5.5 h-5.5 animate-bounce" /> : <Info className="w-5.5 h-5.5" />;
            const categoryClass = a.urgent ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-surface-container text-secondary';

            return (
              <div 
                key={a.id}
                className="group bg-surface-container-lowest p-gutter-md rounded-xl security-shadow border border-outline-variant hover:border-primary transition-all duration-300"
              >
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    {/* Circle category icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                      {icon}
                    </div>

                    {/* Announcement Details */}
                    <div>
                      <h3 className="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors">
                        {a.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-label-sm font-label-sm px-2 py-0.5 rounded ${categoryClass}`}>
                          {a.category}
                        </span>
                        <span className="text-label-sm font-label-sm text-outline">•</span>
                        <span className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-outline/80" />
                          {a.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body paragraph text */}
                <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed max-w-3xl">
                  {a.body}
                </p>

              </div>
            );
          })}
        </div>

      </div>
    </PageContainer>
  );
};

export default Announcements;
