import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { Bus, Utensils, BookOpen, MapPin } from 'lucide-react';

export const ServicesConfigView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إعدادات الخدمات الملحقة (Paramétrage des Services)</h2>
          <p className="text-xs text-slate-500 mt-1">تنظيم أسطول وخطوط النقل المدرسي، وجبات واشتراكات المطعم، وحزم اللوازم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="خطوط النقل المعتمدة" value="6 خطوط" subtitle="تغطي كافة المقاطعات" icon={Bus} variant="pending" />
        <StatCard title="طاقة استيعاب المطعم" value="250 وجبة/يوم" subtitle="اشتراكات نصف داخلية" icon={Utensils} variant="income" />
        <StatCard title="حزم اللوازم المدرسية" value="12 حزمة" subtitle="حسب المستويات التعليمية" icon={BookOpen} variant="default" />
        <StatCard title="أسطول الحافلات" value="4 حافلات" subtitle="في الخدمة النشطة" icon={MapPin} variant="income" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white/60">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Bus className="w-4 h-4 text-amber-700" />
            خطوط النقل المدرسي النشطة
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">خط 1: وسط المدينة - النرجس</span>
                <span className="text-[11px] text-slate-500">الحافلة A1 - السائق: حميد الناصري</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">35 تلميذ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">خط 2: طريق صفرو - زواغة</span>
                <span className="text-[11px] text-slate-500">الحافلة B2 - السائق: محمد التازي</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono">28 تلميذ</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white/60">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-blue-400" />
            نظام الاشتراكات في المطعم (Cantine)
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">اشتراك سنوي كامل (Demi-pension)</span>
                <span className="text-[11px] text-slate-500">وجبة غداء يومية طيلة الموسم الدراسي</span>
              </div>
              <span className="font-mono font-bold text-blue-400">4,500 MAD</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900 block">اشتراك فصلي (Trimestriel)</span>
                <span className="text-[11px] text-slate-500">يسدد مع بداية كل ثلاثي</span>
              </div>
              <span className="font-mono font-bold text-blue-400">1,600 MAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
