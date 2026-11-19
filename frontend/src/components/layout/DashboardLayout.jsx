import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen w-screen max-h-screen bg-slate-50 flex flex-row overflow-hidden font-sans select-none">
      {/* Role-specific Sidebar */}
      <Sidebar />

      {/* Main App Workspace Area */}
      <div className="flex-1 h-screen flex flex-col min-w-0 bg-slate-50/60 overflow-hidden">
        {/* Top Navbar */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
