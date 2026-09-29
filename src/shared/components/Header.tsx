import React from 'react';
import { 
  Menu, 
  Calendar, 
  Wallet, 
  RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import { useCaisse } from '../../features/treasury-caisse/controllers/useCaisse';
import { formatMAD } from '../lib/currencyFormatter';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { summary, loading, refresh } = useCaisse();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between font-sans shadow-xs">
      {/* Left: Mobile Toggle & Academic Year */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Institution Brand Badge with High-Visibility Logo */}
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
          <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center">
            <img
              src="/assets/logo-aroua.png"
              alt="شعار مجموعة مدارس أروى"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-900 block leading-tight">مجموعة مدارس أروى</span>
            <span className="text-[10px] text-cyan-600 font-mono font-semibold block leading-tight">Groupe Scolaire Aroua</span>
          </div>
        </div>

        {/* Active Academic Year Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-slate-500 hidden sm:inline">السنة الدراسية:</span>
          <span className="text-slate-900 font-bold font-mono">2026-2027</span>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 font-semibold">متزامن مع arouaschools</span>
        </div>
      </div>

      {/* Right: Real-Time General Balance & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Real-Time General Caisse Balance */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block leading-tight">الرصيد العام اللحظي للصندوق</span>
            <span className="text-sm font-black font-mono text-emerald-700 leading-tight">
              {formatMAD(summary.currentBalance)}
            </span>
          </div>
        </div>

        {/* Refresh Action */}
        <button
          onClick={() => refresh()}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs"
          title="تحديث الأرصدة اللحظية"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* RLS Security Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-700 font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>RLS Active</span>
        </div>
      </div>
    </header>
  );
};
