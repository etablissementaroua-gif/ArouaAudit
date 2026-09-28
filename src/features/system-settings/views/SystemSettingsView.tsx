import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { Settings, Calendar, Layers, DollarSign, CheckCircle } from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">إعدادات المنظومة (Paramètres Généraux)</h2>
          <p className="text-xs text-slate-400 mt-1">تحديد المعايير المحاسبية، السنوات الدراسية، الأسلاك، والمستويات وجدول الأسعار</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="السنة الدراسية المعتمدة" value="2026-2027" subtitle="السنة المحاسبية النشطة" icon={Calendar} variant="default" />
        <StatCard title="الأسلاك التعليمية" value="4 أسلاك" subtitle="ابتدائي، إعدادي، ثانوي، تأهيلي" icon={Layers} variant="income" />
        <StatCard title="المستويات والأفواج" value="18 فوجاً" subtitle="موزعة على كافة الشعب" icon={Settings} variant="pending" />
        <StatCard title="تعريفات جدول الرسوم" value="محدثة" subtitle="مضبوطة في Supabase" icon={DollarSign} variant="income" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            الأسلاك التعليمية المعتمدة
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">السلك التأهيلي (Lycée Qualifiant)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">32,000 MAD / سنة</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">الجذع المشترك (Tronc Commun)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">28,000 MAD / سنة</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">السلك الإعدادي (Collège)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">24,000 MAD / سنة</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">السلك الابتدائي (Primaire)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">20,000 MAD / سنة</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            تعريفات الخدمات الإضافية الملحقة
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">النقل المدرسي - جميع الخطوط</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">5,000 MAD / سنة</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">الإطعام والمطعم المدرسي</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">4,500 MAD / سنة</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex justify-between items-center">
              <span className="font-semibold text-white">رسوم التسجيل والتأمين السنوي</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">1,500 MAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
