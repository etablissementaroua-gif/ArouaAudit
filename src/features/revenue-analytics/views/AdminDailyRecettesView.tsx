import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  Search, 
  DollarSign, 
  CreditCard, 
  FileCheck, 
  ShieldCheck 
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { revenueAnalyticsService } from '../services/revenueAnalytics.service';
import { RecetteDailyRecord } from '../models/revenue.types';

export const AdminDailyRecettesView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<RecetteDailyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAdminRecettes(selectedDate);
  }, [selectedDate]);

  const loadAdminRecettes = async (date: string) => {
    setLoading(true);
    try {
      const data = await revenueAnalyticsService.getDailyRecettes(date, 'admin');
      setRecords(data);
    } catch (err) {
      console.error('Error loading admin daily recettes:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAdminAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const virementsTotal = records.filter(r => r.payment_method === 'virement').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">مداخيل الإدارة والتحويلات (Recettes Administratives)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              المرحلة 4: المقبوضات البنكية والإدارية
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة المبالغ الكبرى، التحويلات البنكية (Virements)، ودفعات الشيكات المستلمة عبر إدارة المؤسسة.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400">التاريخ:</span>
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="إجمالي مقبوضات الإدارة" 
          value={`${totalAdminAmount.toLocaleString()} MAD`} 
          subtitle={`المستلم بتاريخ ${selectedDate}`} 
          icon={DollarSign} 
          variant="income" 
        />
        <StatCard 
          title="التحويلات البنكية (Virements)" 
          value={`${virementsTotal.toLocaleString()} MAD`} 
          subtitle="مقبوضات الحسابات البنكية المباشرة" 
          icon={CreditCard} 
          variant="default" 
        />
        <StatCard 
          title="عدد المعاملات الإدارية" 
          value={`${records.length} دفعات`} 
          subtitle="موثقة بسجلات التحصيل" 
          icon={FileCheck} 
          variant="pending" 
        />
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">قائمة مقبوضات الإدارة والتحويلات البنكية</h2>
          <span className="text-xs font-mono text-slate-400">بتاريخ: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">رقم التحويل / الإشعار</th>
                <th className="py-4 px-3">البيان والمصدر</th>
                <th className="py-4 px-3">طريقة الأداء</th>
                <th className="py-4 px-3 text-center">المسؤول الإداري</th>
                <th className="py-4 px-4 text-center font-bold text-emerald-400">المبلغ المودع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    جاري تحميل مقبوضات الإدارة...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    لا توجد أي تحويلات إدارية مقيدة بتاريخ {selectedDate}.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {r.reference_number || r.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{r.description}</div>
                      <div className="text-[10px] text-slate-400">{r.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono text-[10px] border border-indigo-500/20">
                        {r.payment_method === 'virement' ? 'تحويل بنكي (Virement)' : r.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 font-medium">
                      {r.author_name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-sm text-emerald-400">
                      {r.amount.toLocaleString()} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
