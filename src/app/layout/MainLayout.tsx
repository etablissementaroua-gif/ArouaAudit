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
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-slate-50">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
          <span>منظومة ArouaAudit المالية &copy; 2026 - مجموعة مدارس أروى للتعليم الخصوصي</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-600">Branch: main</span>
            <span className="text-emerald-700 font-semibold">Design System: Royal Emerald & Slate (Supplies Benchmark)</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
