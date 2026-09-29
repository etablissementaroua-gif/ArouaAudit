import React from 'react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { Receipt, TrendingDown, Layers, Calendar } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">سجل النفقات والمصروفات (Gestion des Dépenses)</h2>
          <p className="text-xs text-slate-500 mt-1">تصنيف النفقات التشغيلية، سجل المصروفات (Décaissements)، والإحصائيات الشهرية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي نفقات الشهر" value={formatMAD(125000)} subtitle="سبتمبر 2026" icon={Receipt} variant="expense" />
        <StatCard title="كتلة أجور الموظفين" value={formatMAD(78500)} subtitle="المصروف الأكبر" icon={TrendingDown} variant="expense" />
        <StatCard title="مصاريف الصيانة والوقود" value={formatMAD(14200)} subtitle="تجهيزات وحافلات" icon={Layers} variant="pending" />
        <StatCard title="المصروفات المعتمدة" value="28 سند صرف" subtitle="مسجلة بالصندوق" icon={Calendar} variant="default" />
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-900 mb-3">أبواب النفقات الرئيسية (Rubriques Budgétaires)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">الأجور والتعويضات (Masse Salariale)</span>
            <span className="text-base font-bold font-mono text-white">62.8%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">المحروقات وصيانة الأسطول</span>
            <span className="text-base font-bold font-mono text-amber-700">11.4%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">المستلزمات البيداغوجية والإدارية</span>
            <span className="text-base font-bold font-mono text-emerald-700">9.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
