import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../shared/components/Sidebar';
import { Header } from '../../shared/components/Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row font-sans selection:bg-indigo-500/20 selection:text-indigo-300">
      {/* Right Collapsible Accordion Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/60 py-3.5 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>منظومة ArouaAudit المالية &copy; 2026 - مؤسسة أروى للتعليم المدرسي الخصوصي</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Branch: main</span>
            <span className="text-indigo-400">Design System: Financial Sovereign</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
