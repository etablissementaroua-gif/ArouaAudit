import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Users,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Receipt,
  Bus,
  CheckSquare,
  ChevronDown,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'teal';
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation(['sidebar', 'common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  // Collapsible Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    settings: false,
    rh: false,
    revenue: false,
    checks: false,
    finance: false,
    expenses: false,
    services: true,
  });

  const sections: NavSection[] = [
    {
      id: 'workspace',
      title: t('sidebar:sections.workspace.title'),
      icon: CheckSquare,
      items: [
        { label: t('sidebar:sections.workspace.tasks'), path: '/workspace/tasks', badge: t('sidebar:badges.new'), badgeColor: 'emerald' },
      ],
    },
    {
      id: 'settings',
      title: t('sidebar:sections.settings.title'),
      icon: Settings,
      items: [
        { label: t('sidebar:sections.settings.academic_years'), path: '/settings/academic-years' },
        { label: t('sidebar:sections.settings.cycles'), path: '/settings/cycles' },
        { label: t('sidebar:sections.settings.levels_groups'), path: '/settings/levels-groups' },
        { label: t('sidebar:sections.settings.pricing_grid'), path: '/settings/pricing-grid' },
        { label: t('sidebar:sections.settings.users_permissions'), path: '/settings/users-permissions', badge: t('sidebar:badges.security'), badgeColor: 'emerald' },
        { label: t('sidebar:sections.settings.audit_trail'), path: '/settings/audit-trail', badge: 'WORM', badgeColor: 'teal' },
      ],
    },
    {
      id: 'rh',
      title: t('sidebar:sections.hr.title'),
      icon: Users,
      items: [
        { label: t('sidebar:sections.hr.mapped_staff'), path: '/hr/mapped-staff', badge: t('sidebar:badges.linked'), badgeColor: 'emerald' },
        { label: t('sidebar:sections.hr.enrolled_students'), path: '/hr/enrolled-students', badge: t('sidebar:badges.active'), badgeColor: 'emerald' },
        { label: t('sidebar:sections.hr.payroll'), path: '/hr/payroll' },
        { label: t('sidebar:sections.hr.staff_debts'), path: '/hr/staff-debts' },
      ],
    },
    {
      id: 'revenue',
      title: t('sidebar:sections.revenue.title'),
      icon: TrendingUp,
      items: [
        { label: t('sidebar:sections.revenue.monthly_ca'), path: '/revenue/monthly-ca' },
        { label: t('sidebar:sections.revenue.annual_ca'), path: '/revenue/annual-ca', badge: 'CA', badgeColor: 'emerald' },
        { label: t('sidebar:sections.revenue.regisseurs'), path: '/revenue/regisseurs' },
        { label: t('sidebar:sections.revenue.global_recettes'), path: '/revenue/global-recettes' },
      ],
    },
    {
      id: 'checks',
      title: t('sidebar:sections.checks.title'),
      icon: Landmark,
      items: [
        { label: t('sidebar:sections.checks.accounts'), path: '/checks/accounts' },
        { label: t('sidebar:sections.checks.portfolio'), path: '/checks/portfolio', badge: t('sidebar:badges.followup'), badgeColor: 'teal' },
        { label: t('sidebar:sections.checks.delivery_slips'), path: '/checks/delivery-slips' },
      ],
    },
    {
      id: 'finance',
      title: t('sidebar:sections.finance.title'),
      icon: FileSpreadsheet,
      items: [
        { label: t('sidebar:sections.finance.impayes'), path: '/finance/impayes', badge: t('sidebar:badges.important'), badgeColor: 'rose' },
        { label: t('sidebar:sections.finance.credit_balances'), path: '/finance/credit-balances' },
        { label: t('sidebar:sections.finance.discounts'), path: '/finance/discounts' },
        { label: t('sidebar:sections.finance.payments_journal'), path: '/finance/payments-journal' },
      ],
    },
    {
      id: 'expenses',
      title: t('sidebar:sections.expenses.title'),
      icon: Receipt,
      items: [
        { label: t('sidebar:sections.expenses.categories'), path: '/expenses/categories' },
        { label: t('sidebar:sections.expenses.list'), path: '/expenses/list' },
        { label: t('sidebar:sections.expenses.monthly_stats'), path: '/expenses/monthly-stats' },
        { label: t('sidebar:sections.expenses.register'), path: '/expenses/register' },
      ],
    },
    {
      id: 'services',
      title: t('sidebar:sections.services.title'),
      icon: Bus,
      items: [
        { label: t('sidebar:sections.services.supplies'), path: '/services/supplies' },
        { label: t('sidebar:sections.services.transport'), path: '/services/transport' },
        { label: t('sidebar:sections.services.canteen'), path: '/services/canteen' },
      ],
    },
  ];

  // Auto-expand section containing current route
  useEffect(() => {
    const current = location.pathname;
    sections.forEach((sec) => {
      const match = sec.items.some((item) => current.startsWith(item.path));
      if (match) {
        setOpenSections((prev) => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'rose':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'teal':
        return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'emerald':
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - Expanded to w-72 xl:w-80 */}
      <aside
        className={`fixed top-0 bottom-0 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } z-50 w-72 xl:w-80 bg-white border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out font-sans lg:static lg:translate-x-0 shadow-xs ${
          isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')
        }`}
      >
        {/* Top Administration Account Card */}
        <div className="p-3.5 mx-3 mt-3 mb-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="text-start">
            <div className="font-bold text-xs text-slate-900">{t('sidebar:admin.title')}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t('sidebar:admin.subtitle')}</div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {t('sidebar:admin.system_active')}
          </span>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer ${
              isRtl ? 'mr-1' : 'ml-1'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSections[section.id];
            const hasActiveChild = section.items.some((item) =>
              location.pathname.startsWith(item.path)
            );

            return (
              <div key={section.id} className="rounded-xl overflow-hidden">
                {/* Section Accordion Trigger */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    hasActiveChild
                      ? 'text-emerald-800 bg-emerald-50/60 font-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${hasActiveChild ? 'text-emerald-700' : 'text-slate-500'}`} />
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>

                {/* Sub-Items */}
                {isOpen && (
                  <div className={`mt-1 space-y-0.5 py-0.5 ${
                    isRtl ? 'mr-3 pr-2.5 border-r border-slate-200/80' : 'ml-3 pl-2.5 border-l border-slate-200/80'
                  }`}>
                    {section.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all gap-2 ${
                            isActive
                              ? 'bg-emerald-50/80 text-emerald-800 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            )}
                            <span className="leading-tight whitespace-normal text-start">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0 ${getBadgeClass(
                                item.badgeColor
                              )}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer with Server Status */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('common:footer.server_connected')}
          </span>
          <span className="font-bold text-slate-600">{t('common:footer.accounting_date')}</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

