import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../shared/components/Sidebar';
import { Header } from '../../shared/components/Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-row font-sans selection:bg-emerald-500/15 selection:text-emerald-800">
      {/* Right Collapsible Accordion Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8FAFC]">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
          <span>منظومة ArouaAudit المالية &copy; 2026 - مجموعة مدارس أروى للتعليم الخصوصي</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-600">Branch: main</span>
            <span className="text-emerald-700 font-semibold">Design System: Royal Emerald & Slate</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
