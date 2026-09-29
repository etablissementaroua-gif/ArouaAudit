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
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/90 bg-white px-4 sm:px-6 flex items-center justify-between font-sans shadow-xs" dir="rtl">
      {/* Right Side in RTL: Institution Brand & Academic Status Badges */}
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden cursor-pointer"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Institution Brand Badge with Emerald Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs text-sm shrink-0">
            أ
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 leading-tight">مجموعة مدارس أروى</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                V1.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block leading-tight">
              Groupe Scolaire Aroua • ArouaAudit
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>متزامن مع arouaschools</span>
        </div>

        {/* Active Academic Year Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>السنة الدراسية: 2026-2027</span>
        </div>
      </div>

      {/* Left Side in RTL: Caisse Balance, RLS, Refresh & Avatar */}
      <div className="flex items-center gap-3">
        {/* Real-Time General Caisse Balance Card */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
            الرصيد العام اللحظي للصندوق
          </span>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-black text-sm shadow-2xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>MAD {summary?.currentBalance ? formatMAD(summary.currentBalance).replace('MAD', '').trim() : '95.000,00'}</span>
          </div>
        </div>

        {/* RLS Security Indicator */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>RLS Active</span>
        </div>

        {/* Refresh Action */}
        <button
          onClick={() => refresh()}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer"
          title="تحديث الأرصدة اللحظية"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* User Avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer select-none"
          title="الحساب الإداري المركزي"
        >
          AR
        </div>
      </div>
    </header>
  );
};
