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
        { label: 'الموظفون المعتمدون', path: '/hr/mapped-staff', badge: 'مربوط', badgeColor: 'emerald' },
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
        { label: 'سجل المقبوضات الشامل', path: '/revenue/global-recettes' },
      ],
    },
    {
      id: 'checks',
      title: 'الحسابات والشيكات',
      icon: Landmark,
      items: [
        { label: 'الحسابات البنكية والخزائن', path: '/checks/accounts' },
        { label: 'محفظة الشيكات والكمبيالات', path: '/checks/portfolio', badge: 'متابعة', badgeColor: 'teal' },
        { label: 'حوافظ تسليم الشيكات (Remises)', path: '/checks/delivery-slips' },
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
      title: 'الخدمات الملحقة والمخزون',
      icon: Bus,
      items: [
        { label: 'اللوازم والزي والمحفظة', path: '/services/supplies' },
        { label: 'خدمات النقل المدرسي', path: '/services/transport' },
        { label: 'المطعم والإطعام الداخلي', path: '/services/canteen' },
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

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out font-sans lg:static lg:translate-x-0 shadow-xs ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Top Administration Account Card */}
        <div className="p-3.5 mx-3 mt-3 mb-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-slate-900">مجموعة مدارس أروى</div>
            <div className="text-[10px] text-slate-400 mt-0.5">الحساب الإداري المالي والتربوي المركزي</div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            نظام نشط
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden mr-1 cursor-pointer"
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
                  <div className="mt-1 mr-3 pr-2.5 border-r border-slate-200/80 space-y-0.5 py-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? 'bg-emerald-50/80 text-emerald-800 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            )}
                            <span className="truncate">{item.label}</span>
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
            السيرفر متصل: Fast Cloud
          </span>
          <span className="font-bold text-slate-600">2026.09</span>
        </div>
      </aside>
    </>
  );
};
