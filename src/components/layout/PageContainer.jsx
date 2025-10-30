import React from 'react';

// Simple page wrapper to keep pages within the main content column
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="min-h-[60vh] bg-transparent">{children}</div>
    </div>
  );
}

