import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Settings,
  Users,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Receipt,
  Bus,
  ChevronDown,
  Building2,
  Clock,
  AlertTriangle,
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
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo';
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  // Collapsible Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    settings: false,
    rh: true,
    revenue: false,
    checks: false,
    finance: false,
    expenses: false,
    services: false,
  });

  const sections: NavSection[] = [
    {
      id: 'settings',
      title: 'إعدادات المنظومة',
      icon: Settings,
      items: [
        { label: 'السنوات الدراسية', path: '/settings/academic-years' },
        { label: 'الأسلاك التعليمية', path: '/settings/cycles' },
        { label: 'المستويات والأفواج', path: '/settings/levels-groups' },
        { label: 'جدول الأسعار والرسوم', path: '/settings/pricing-grid' },
      ],
    },
    {
      id: 'rh',
      title: 'الموارد البشرية والمزامنة',
      icon: Users,
      items: [
        { label: 'الموظفون المعتمدون (arouaschools)', path: '/hr/mapped-staff', badge: 'مربوط', badgeColor: 'emerald' },
        { label: 'التلاميذ المسجلون والذمم', path: '/hr/enrolled-students', badge: 'نشط', badgeColor: 'emerald' },
        { label: 'مسير الرواتب', path: '/hr/payroll' },
      ],
    },
    {
      id: 'revenue',
      title: 'رقم المعاملات والمداخيل',
      icon: TrendingUp,
      items: [
        { label: 'CA شهري', path: '/revenue/monthly-ca' },
        { label: 'CA سنوي', path: '/revenue/annual-ca' },
        { label: 'مداخيل الوكلاء', path: '/revenue/regisseurs' },
        { label: 'مداخيل الإدارة', path: '/revenue/administration' },
        { label: 'المداخيل الشهرية والسنوية', path: '/revenue/global-recettes' },
        { label: 'قوائم وإحصائيات التغذية', path: '/revenue/catering-stats' },
      ],
    },
    {
      id: 'checks',
      title: 'الحسابات والشيكات',
      icon: Landmark,
      items: [
        { label: 'الحسابات البنكية والخزينة', path: '/checks/accounts' },
        { label: 'محفظة الشيكات', path: '/checks/portfolio', badge: '1 متأخر', badgeColor: 'rose' },
        { label: 'حوافظ التسليم (Bordereaux)', path: '/checks/delivery-slips' },
        { label: 'الوصولات وسندات الصندوق', path: '/checks/receipts' },
        { label: 'شيكات قيد الإيداع', path: '/checks/deposited' },
        { label: 'كشوفات الفواتير', path: '/checks/invoices' },
      ],
    },
    {
      id: 'finance',
      title: 'القوائم والعمليات المالية',
      icon: FileSpreadsheet,
      items: [
        { label: 'الأرصدة الزائدة (Soldes Créditeurs)', path: '/finance/credit-balances' },
        { label: 'التخفيضات الممنوحة', path: '/finance/discounts' },
        { label: 'الإعفاءات الدراسية', path: '/finance/exemptions' },
        { label: 'قائمة التسديدات', path: '/finance/payments-journal' },
        { label: 'المتأخرات والديون (Impayés)', path: '/finance/impayes', badge: 'مفتوح', badgeColor: 'amber' },
      ],
    },
    {
      id: 'expenses',
      title: 'النفقات والمصروفات',
      icon: Receipt,
      items: [
        { label: 'أنواع وأبواب النفقات', path: '/expenses/categories' },
        { label: 'قائمة النفقات', path: '/expenses/list' },
        { label: 'الإحصائيات الشهرية', path: '/expenses/monthly-stats' },
        { label: 'سجل المصروفات (Décaissements)', path: '/expenses/register' },
      ],
    },
    {
      id: 'services',
      title: 'إعدادات الخدمات الملحقة',
      icon: Bus,
      items: [
        { label: 'النقل المدرسي والخطوط', path: '/services/transport' },
        { label: 'المطعم المدرسي والاشتراكات', path: '/services/canteen' },
        { label: 'اللوازم والمحفظة المدرسية', path: '/services/supplies' },
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
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-sans lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-white/95 shadow-md shadow-cyan-500/10 border border-slate-700/50 flex items-center justify-center shrink-0">
              <img
                src="/assets/logo-aroua.png"
                alt="شعار مجموعة مدارس أروى"
                className="h-11 w-auto object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">ArouaAudit</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  V1.0
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 font-semibold truncate">Groupe Scolaire Aroua</p>
              <p className="text-[10px] text-slate-400 truncate">مجموعة مدارس أروى</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isOpenSection = openSections[sec.id];
            const hasActiveChild = sec.items.some((item) => location.pathname === item.path);

            return (
              <div key={sec.id} className="rounded-xl overflow-hidden border border-slate-800/60 bg-slate-900/30">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold transition-colors ${
                    hasActiveChild
                      ? 'text-indigo-400 bg-indigo-950/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${hasActiveChild ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{sec.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpenSection ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {/* Submenu Items */}
                {isOpenSection && (
                  <div className="px-2 py-1.5 space-y-0.5 border-t border-slate-800/60 bg-slate-950/40">
                    {sec.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                            isActive
                              ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold mr-1.5 ${getBadgeClass(
                              item.badgeColor
                            )}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              قاعدة البيانات متصلة
            </span>
            <span className="font-mono text-slate-500">2026/2027</span>
          </div>
        </div>
      </aside>
    </>
  );
};
