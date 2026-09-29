import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../shared/components/Sidebar';
import { Header } from '../../shared/components/Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-row font-sans selection:bg-emerald-500/15 selection:text-emerald-800">
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

        {/* Footer Matching Benchmark Image */}
        <footer className="border-t border-slate-200/80 bg-white py-3 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs" dir="rtl">
          <div className="text-slate-500 text-xs">
            نظام التدبير المالي والتربوي — Groupe Scolaire Aroua Audit v1.0
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>آخر تحديث لقاعدة البيانات والمخزون: اليوم، 13:19</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
