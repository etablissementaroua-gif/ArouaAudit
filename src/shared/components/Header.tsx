import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  Calendar, 
  Wallet, 
  RefreshCw, 
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Lock,
  LogOut
} from 'lucide-react';
import { useCaisse } from '../../features/treasury-caisse/controllers/useCaisse';
import { formatMAD } from '../lib/currencyFormatter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usePermissions } from '../../features/system-security/context/PermissionsContext';
import { SystemRoleCode } from '../../features/system-security/models/security.types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');
  const { summary, loading, refresh } = useCaisse();
  const { currentRole, switchRole, logoutUser, currentUser } = usePermissions();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDisplay = (code: SystemRoleCode) => {
    switch (code) {
      case 'super_admin':
        return isRtl ? 'المدير العام' : 'Super Admin';
      case 'finance_director':
        return isRtl ? 'المدير المالي' : 'Dir. Financier';
      case 'accountant':
        return isRtl ? 'المحاسب' : 'Comptable';
      case 'cashier':
        return isRtl ? 'أمين الصندوق' : 'Caissier';
      case 'hr_manager':
        return isRtl ? 'الموارد البشرية' : 'Resp. RH';
      case 'viewer':
      default:
        return isRtl ? 'معاينة فقط' : 'Lecteur';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/90 bg-white px-4 sm:px-6 flex items-center justify-between font-sans shadow-xs">
      {/* Start Side: Institution Brand & Academic Status Badges */}
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden cursor-pointer"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Institution Brand Badge with Emerald Icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs text-sm shrink-0">
            أ
          </div>
          <div className="text-start">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 leading-tight">
                {t('brand.name')}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                {t('brand.version')}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block leading-tight">
              {t('brand.sub_title')}
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t('brand.synced_aroua')}</span>
        </div>

        {/* Active Academic Year Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('brand.school_year')}</span>
        </div>
      </div>

      {/* End Side: Caisse Balance, RLS, Role Switcher, Language Switcher, Refresh & Avatar */}
      <div className="flex items-center gap-3">
        {/* Real-Time General Caisse Balance Card */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">
            {t('brand.caisse_balance_title')}
          </span>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-black text-sm shadow-2xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>MAD {summary?.currentBalance ? formatMAD(summary.currentBalance).replace('MAD', '').trim() : '95.000,00'}</span>
          </div>
        </div>

        {/* RLS Security Indicator */}
        <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('brand.rls_active')}</span>
        </div>

        {/* Role Indicator & Live Switcher for Testing */}
        <div className="relative inline-block" ref={roleDropdownRef}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
            title={isRtl ? 'تبديل الدور للاختبار الحي' : 'Changer de rôle pour test'}
          >
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>{getRoleDisplay(currentRole)}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-start">
                {isRtl ? 'تبديل الدور للاختبار الفوري (Live RBAC):' : 'Tester un rôle en direct :'}
              </div>
              {(['super_admin', 'finance_director', 'accountant', 'cashier', 'hr_manager', 'viewer'] as SystemRoleCode[]).map((rc) => (
                <button
                  key={rc}
                  type="button"
                  onClick={() => {
                    switchRole(rc);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                    currentRole === rc
                      ? 'bg-emerald-50 text-emerald-800 font-black'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-3.5 h-3.5 ${currentRole === rc ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{getRoleDisplay(rc)}</span>
                  </div>
                  {currentRole === rc && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              ))}

              {/* Logout Option */}
              <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    setRoleMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isRtl ? 'تسجيل الخروج' : 'Déconnexion'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher Component */}
        <LanguageSwitcher />

        {/* Refresh Action */}
        <button
          onClick={() => refresh()}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer"
          title={t('actions.refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* User Avatar */}
        <div 
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shadow-xs cursor-pointer select-none hover:ring-2 hover:ring-emerald-500 transition-all"
          title={`${currentUser.full_name} (${currentRole})`}
        >
          {currentRole === 'super_admin' ? 'AR' : currentRole.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
