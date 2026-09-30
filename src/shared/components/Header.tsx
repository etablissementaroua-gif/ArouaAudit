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
  LogOut,
  Bell,
  CheckCheck,
  CheckSquare,
  Megaphone,
  Clock,
  Loader2
} from 'lucide-react';
import { useCaisse } from '../../features/treasury-caisse/controllers/useCaisse';
import { formatMAD } from '../lib/currencyFormatter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usePermissions } from '../../features/system-security/context/PermissionsContext';
import { SystemRoleCode } from '../../features/system-security/models/security.types';
import { securityService } from '../../features/system-security/services/security.service';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { taskService } from '../../features/tasks-notes/services/task.service';
import { SystemNotification } from '../../features/tasks-notes/models/task.types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');
  const { summary, loading, refresh } = useCaisse();
  const { currentRole, switchRole, logoutUser, currentUser } = usePermissions();

  // Role Dropdown State
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to notifications
  const loadNotifications = () => {
    taskService.getNotifications(currentUser.id).then(setNotifications);
  };

  useEffect(() => {
    loadNotifications();

    const handleNotifUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('aroua_notifications_updated', handleNotifUpdate);
    return () => window.removeEventListener('aroua_notifications_updated', handleNotifUpdate);
  }, [currentUser]);

  // Click outside listener for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await taskService.markAllNotificationsAsRead(currentUser.id);
    loadNotifications();
  };

  const handleNotificationClick = async (notif: SystemNotification) => {
    if (!notif.is_read) {
      await taskService.markNotificationAsRead(notif.id);
      loadNotifications();
    }
    setNotifMenuOpen(false);
    navigate(notif.link_url || '/workspace/tasks');
  };

  const handleAuditedLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Immutable Audit Log Event
      await securityService.logAuditEvent({
        user_name: currentUser?.full_name || 'مستخدم مسجل',
        user_role: currentUser?.role_code || currentRole || 'viewer',
        action_type: 'LOGOUT',
        target_entity: 'auth_session',
        entity_id: currentUser?.email || 'session',
        new_values: {
          timestamp: new Date().toISOString(),
          status: 'success',
          userAgent: navigator.userAgent,
        },
      });

      // 2. Sign out of Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch (supabaseSignOutErr) {
          console.warn('Supabase sign out error:', supabaseSignOutErr);
        }
      }

      // 3. Clear local context
      logoutUser();
      setRoleMenuOpen(false);

      // 4. Navigate immediately to /login
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      logoutUser();
      setRoleMenuOpen(false);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
      if (diff < 1) return isRtl ? 'الآن' : 'À l’instant';
      if (diff < 60) return isRtl ? `منذ ${diff} دقيقة` : `Il y a ${diff} min`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return isRtl ? `منذ ${hours} ساعة` : `Il y a ${hours} h`;
      const days = Math.floor(hours / 24);
      return isRtl ? `منذ ${days} يوم` : `Il y a ${days} j`;
    } catch {
      return '';
    }
  };

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
    <header className="sticky top-0 z-30 h-13 border-b border-slate-200/90 bg-white px-3 sm:px-5 flex items-center justify-between font-sans shadow-xs">
      {/* Start Side: Institution Brand & Academic Status Badges */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden flex items-center justify-center cursor-pointer"
          title="Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Institution Brand Badge with Official Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shadow-2xs shrink-0">
            <img
              src="/assets/aroua-logo.png"
              alt="Groupe Scolaire Aroua"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-start">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 leading-tight">
                {t('brand.name')}
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">
                {t('brand.version')}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium block leading-tight">
              {t('brand.sub_title')}
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t('brand.synced_aroua')}</span>
        </div>

        {/* Active Academic Year Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-600">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{t('brand.school_year')}</span>
        </div>
      </div>

      {/* End Side: Caisse Balance, RLS, Role Switcher, Notification Bell, Language Switcher, Refresh & Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Real-Time General Caisse Balance Card (Compact) */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-medium block leading-none mb-0.5">
            {t('brand.caisse_balance_title')}
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-black text-xs shadow-2xs">
            <Wallet className="w-3 h-3 text-emerald-600" />
            <span>MAD {summary?.currentBalance ? formatMAD(summary.currentBalance).replace('MAD', '').trim() : '95.000,00'}</span>
          </div>
        </div>

        {/* RLS Security Indicator */}
        <div className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>{t('brand.rls_active')}</span>
        </div>

        {/* Role Indicator & Live Switcher for Testing */}
        <div className="relative inline-block" ref={roleDropdownRef}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
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

              {/* Logout Option with Audited Security */}
              <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleAuditedLogout}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>
                    {isLoggingOut 
                      ? (isRtl ? 'جاري تسجيل الخروج...' : 'Déconnexion...') 
                      : (isRtl ? 'تسجيل الخروج الموثق' : 'Déconnexion Sécurisée')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🔔 Interactive Notification Bell (Compact w-7 h-7) */}
        <div className="relative inline-block" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs relative cursor-pointer flex items-center justify-center"
            title={isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifMenuOpen && (
            <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150`}>
              {/* Header */}
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    {isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {unreadCount} {isRtl ? 'جديد' : 'nouv.'}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {isRtl ? 'لا توجد إشعارات حالياً' : 'Aucune notification'}
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isNew = !notif.is_read;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-2.5 text-start hover:bg-slate-50 transition cursor-pointer flex items-start gap-2.5 ${
                          isNew ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === 'task_assigned'
                              ? 'bg-emerald-100 text-emerald-700'
                              : notif.type === 'announcement'
                              ? 'bg-indigo-100 text-indigo-700'
                              : notif.type === 'reminder'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {notif.type === 'task_assigned' ? (
                            <CheckSquare className="w-3 h-3" />
                          ) : notif.type === 'announcement' ? (
                            <Megaphone className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs leading-tight truncate ${
                                isNew ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                              }`}
                            >
                              {notif.title}
                            </span>
                            {isNew && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-center rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setNotifMenuOpen(false);
                    navigate('/workspace/tasks');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                >
                  {isRtl ? 'عرض كافة المهام والمذكرات ←' : 'Voir toutes les tâches →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher Component */}
        <LanguageSwitcher />

        {/* Refresh Action (Compact w-7 h-7) */}
        <button
          onClick={() => refresh()}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs cursor-pointer flex items-center justify-center"
          title={t('actions.refresh')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* User Avatar (Compact w-7 h-7) */}
        <div 
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="w-7 h-7 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shadow-xs cursor-pointer select-none hover:ring-2 hover:ring-emerald-500 transition-all shrink-0"
          title={`${currentUser.full_name} (${currentRole})`}
        >
          {currentRole === 'super_admin' ? 'AR' : currentRole.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
