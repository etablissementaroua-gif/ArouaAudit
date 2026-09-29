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
        { label: 'سجل السلفات والديون', path: '/hr/staff-debts' },
      ],
    },
    {
      id: 'revenue',
      title: 'المداخيل ورقم المعاملات',
      icon: TrendingUp,
      items: [
        { label: 'رقم المعاملات الشهري', path: '/revenue/monthly-ca' },
        { label: 'الهدف السنوي (CA Annuel)', path: '/revenue/annual-ca' },
        { label: 'مداخيل الوكلاء والصناديق', path: '/revenue/regisseurs' },
        { label: 'مداخيل الإدارة والتحويلات', path: '/revenue/administration' },
        { label: 'سجل المقبوضات الشامل', path: '/revenue/global-recettes' },
        { label: 'تغذية الصندوق ورأس المال', path: '/revenue/catering-stats' },
      ],
    },
    {
      id: 'checks',
      title: 'الحسابات والشيكات',
      icon: Landmark,
      items: [
        { label: 'الحسابات البنكية والخزائن', path: '/checks/accounts' },
        { label: 'محفظة الشيكات والكمبيالات', path: '/checks/portfolio', badge: 'متابعة', badgeColor: 'indigo' },
        { label: 'حوافظ تسليم الشيكات (Remises)', path: '/checks/delivery-slips' },
        { label: 'سجل وصولات الدفع (Reçus)', path: '/checks/receipts' },
        { label: 'شيكات قيد الإيداع', path: '/checks/deposited' },
        { label: 'فواتير وكشوفات الحساب', path: '/checks/invoices' },
      ],
    },
    {
      id: 'finance',
      title: 'العمليات المالية والذمم',
      icon: FileSpreadsheet,
      items: [
        { label: 'سجل الديون والمتأخرات (Impayés)', path: '/finance/impayes', badge: 'هام', badgeColor: 'rose' },
        { label: 'الأرصدة الزائدة (Soldes en plus)', path: '/finance/credit-balances' },
        { label: 'تخفيضات الإخوة والاتفاقيات', path: '/finance/discounts' },
        { label: 'الإعفاءات والمنح (100%)', path: '/finance/exemptions' },
        { label: 'دفتر المقبوضات التاريخي', path: '/finance/payments-journal' },
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
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 ease-in-out font-sans lg:static lg:translate-x-0 shadow-sm ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header with Pristine White Logo Container */}
        <div className="h-20 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              <img
                src="/assets/logo-aroua.png"
                alt="شعار مجموعة مدارس أروى"
                className="h-11 max-h-11 w-auto max-w-[120px] object-contain shrink-0" style={{ maxHeight: "44px", maxWidth: "120px" }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 tracking-tight">ArouaAudit</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  V1.0
                </span>
              </div>
              <p className="text-[11px] text-cyan-700 font-bold truncate">Groupe Scolaire Aroua</p>
              <p className="text-[10px] text-slate-500 truncate">مجموعة مدارس أروى</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    hasActiveChild
                      ? 'text-indigo-700 bg-indigo-50/60 font-black'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${hasActiveChild ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>

                {/* Sub-Items */}
                {isOpen && (
                  <div className="mt-1 mr-4 pr-3 border-r-2 border-slate-200 space-y-1 py-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-bold border-r-4 border-indigo-600 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 font-medium'
                          }`
                        }
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${getBadgeClass(
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

        {/* Sidebar Footer Info */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/80 text-[11px] text-slate-500 font-sans space-y-1">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span>الرقابة والتدقيق المستقل</span>
            <span className="font-mono text-emerald-600 font-bold">100% متزامن</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Supabase DB &middot; Firebase Synced
          </div>
        </div>
      </aside>
    </>
  );
};
