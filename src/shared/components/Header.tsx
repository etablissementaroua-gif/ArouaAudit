import React from 'react';
import { 
  Menu, 
  Calendar, 
  Wallet, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Bell 
} from 'lucide-react';
import { useCaisse } from '../../features/treasury-caisse/controllers/useCaisse';
import { formatMAD } from '../lib/currencyFormatter';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { summary, loading, refresh } = useCaisse();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between font-sans">
      {/* Left: Mobile Toggle & Academic Year */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition lg:hidden"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Active Academic Year Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 hidden sm:inline">السنة الدراسية:</span>
          <span className="text-white font-bold font-mono">2026-2027</span>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">متزامن مع arouaschools</span>
        </div>
      </div>

      {/* Right: Real-Time General Balance & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Real-Time General Caisse Balance */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-sm">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block leading-tight">الرصيد العام اللحظي للصندوق</span>
            <span className="text-sm font-bold font-mono text-emerald-400 leading-tight">
              {formatMAD(summary.currentBalance)}
            </span>
          </div>
        </div>

        {/* Refresh Action */}
        <button
          onClick={() => refresh()}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="تحديث الأرصدة اللحظية"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* RLS Security Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-indigo-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>RLS Active</span>
        </div>
      </div>
    </header>
  );
};
