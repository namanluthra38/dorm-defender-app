// src/pages/Support.jsx
import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, ChevronDown, ChevronUp, MessageSquare, Info } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

const Support = () => {
  const faqs = [
    { 
      q: 'How do I pay my outstanding fees?', 
      a: 'Go to the Fees & Payments section inside the student portal. Under Quick Checkout, you can view outstanding dues and click Pay Dues Online to initiate a direct transaction.' 
    },
    { 
      q: 'How to file a new residence complaint?', 
      a: 'Navigate to My Complaints page, click "+ New Complaint", enter a title, details, and optionally upload device image attachments. Our canvas algorithm compresses images to high-efficiency WebP automatically before submitting to the warden desk.' 
    },
    {
      q: 'What should I do during temporary leave?',
      a: 'Go to the Room Details section, click the Request Hostel Leave button, and fill in the dates. Once submitted, your warden will inspect and approve the request logs instantly.'
    }
  ];

  const contacts = [
    { name: 'Chief Warden Office', email: 'chiefwarden@hostelguard.edu', phone: '+91 99887 76655', role: 'General Hostel Administration' },
    { name: 'IT Helpdesk Support', email: 'itsupport@hostelguard.edu', phone: '+91 99887 76600', role: 'Wifi Routers & Access Locks' },
    { name: 'Mess & Dining Inspector', email: 'diningdesk@hostelguard.edu', phone: '+91 99887 76611', role: 'Food Audits & Vendor Queries' }
  ];

  // state to track expanded FAQ index
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (idx) => {
    setExpandedFaq(prev => (prev === idx ? null : idx));
  };

  return (
    <PageContainer>
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg animate-in fade-in duration-300">
        
        {/* Header Section */}
        <header className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-stack-sm text-primary">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Support & FAQs</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Access helpful resources, frequently asked questions, and administrative support desks.</p>
        </header>

        {/* Two-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: FAQs Accordions */}
          <section className="lg:col-span-2 flex flex-col gap-6">
            <div className="security-shadow glass-effect rounded-xl bg-surface-container-lowest p-6 flex flex-col gap-6 border border-outline-variant">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                <HelpCircle className="w-5 h-5 text-secondary" />
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Frequently Asked Questions</h3>
              </div>

              {/* Accordions */}
              <div className="flex flex-col gap-3">
                {faqs.map((f, i) => {
                  const isExpanded = expandedFaq === i;
                  return (
                    <div 
                      key={i}
                      className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-low/30 hover:border-primary/30 transition-colors"
                    >
                      <button
                        onClick={() => toggleFaq(i)}
                        className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 focus:outline-none"
                      >
                        <span className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors">
                          {f.q}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-secondary shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-secondary shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 text-body-md font-body-md text-on-surface-variant border-t border-outline-variant/10 leading-relaxed bg-white/50 animate-in slide-in-from-top-1 duration-150">
                          {f.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right Column: Support Hotlines */}
          <section className="lg:col-span-1">
            <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-6 h-full flex flex-col gap-6 border border-outline-variant">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Support Desks</h3>
              </div>

              {/* Contacts details */}
              <div className="flex flex-col gap-4">
                {contacts.map((c, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:scale-[1.01] transition-transform"
                  >
                    <h4 className="font-label-md text-label-md text-on-surface">{c.name}</h4>
                    <p className="text-xs text-secondary font-label-sm mt-0.5">{c.role}</p>
                    
                    <div className="flex flex-col gap-1.5 mt-3 text-xs font-body-md text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#15803d]" />
                        <span>{c.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

      </div>
    </PageContainer>
  );
};

export default Support;
