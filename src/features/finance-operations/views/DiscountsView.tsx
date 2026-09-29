import React, { useState, useEffect } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import { StudentDiscountExemption, CreateDiscountDTO, ServiceType } from '../models/finance.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Percent, 
  Search, 
  Plus, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  Bus, 
  Utensils, 
  ShieldCheck, 
  X,
  Tag
} from 'lucide-react';

export const DiscountsView: React.FC = () => {
  const [discounts, setDiscounts] = useState<StudentDiscountExemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newDiscount, setNewDiscount] = useState<CreateDiscountDTO>({
    student_id: '',
    student_name: '',
    academic_level: 'CP',
    type: 'reduction_mensuelle',
    service_type: 'scolarite',
    rate_or_amount: 10,
    is_percentage: true,
    beneficiary_relation: 'أخ ثان (10%)',
    approved_by: 'الإدارة العامة'
  });

  const loadData = async () => {
    setLoading(true);
    const data = await financeOperationsService.getDiscountsAndExemptions('discounts');
    setDiscounts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDiscounts = discounts.filter(d => 
    d.student_name.toLowerCase().includes(search.toLowerCase()) ||
    d.student_id.toLowerCase().includes(search.toLowerCase()) ||
    (d.beneficiary_relation && d.beneficiary_relation.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await financeOperationsService.toggleDiscountStatus(id, !currentStatus);
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscount.student_name || newDiscount.rate_or_amount <= 0) return;

    await financeOperationsService.addDiscountExemption({
      ...newDiscount,
      student_id: newDiscount.student_id || `STU-${Date.now().toString().slice(-4)}`
    });

    setIsModalOpen(false);
    setNewDiscount({
      student_id: '',
      student_name: '',
      academic_level: 'CP',
      type: 'reduction_mensuelle',
      service_type: 'scolarite',
      rate_or_amount: 10,
      is_percentage: true,
      beneficiary_relation: 'أخ ثان (10%)',
      approved_by: 'الإدارة العامة'
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">التخفيضات الممنوحة (Réductions Accordées)</h1>
            <p className="text-slate-500 text-sm">سجل تخفيضات الإخوة، أبناء الأطر التعليمية، والاتفاقيات الخاصة المعتمدة</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة تخفيض لتلميذ</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">إجمالي المستفيدين من التخفيض</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{discounts.filter(d => d.is_active).length}</p>
          <span className="text-xs text-slate-500 mt-1 block">تلاميذ مستفيدون نشطون</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-emerald-700 uppercase font-semibold block mb-1">تخفيضات التمدرس (Scolarité)</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono">
            {discounts.filter(d => d.service_type === 'scolarite' && d.is_active).length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">تخفيض الإخوة واتفاقيات التدريس</span>
        </div>

        <div className="bg-white border border-amber-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-amber-700 uppercase font-semibold block mb-1">تخفيضات النقل المدرسي</span>
          <p className="text-2xl font-bold text-amber-700 font-mono">
            {discounts.filter(d => d.service_type === 'transport' && d.is_active).length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">تخفيض خطوط الحافلات المشتركة</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="بحث سريع باسم التلميذ، سبب التخفيض، أو المعرف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs pr-10 pl-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 shadow-lg"
        />
      </div>

      {/* Discounts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">التلميذ / المعرف</th>
                <th className="py-4 px-4">المستوى الدراسي</th>
                <th className="py-4 px-4">الخدمة المعنية</th>
                <th className="py-4 px-4">نسبة / قيمة التخفيض</th>
                <th className="py-4 px-4">صلة القرابة / سبب الاستحقاق</th>
                <th className="py-4 px-4">جهة الاعتماد</th>
                <th className="py-4 px-4 text-center">حالة التفعيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل قائمة التخفيضات...</td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد تخفيضات مطابقة للبحث</td>
                </tr>
              ) : (
                filteredDiscounts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{d.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        معرف: {d.student_id}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-700">
                      {d.academic_level}
                    </td>

                    <td className="py-4 px-4">
                      {d.service_type === 'transport' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                          <Bus className="w-3.5 h-3.5" />
                          <span>النقل المدرسي</span>
                        </span>
                      ) : d.service_type === 'cantine' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-800">
                          <Utensils className="w-3.5 h-3.5" />
                          <span>المطعم المدرسي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>التمدرس والرسوم</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-emerald-700 text-base">
                      {d.is_percentage ? `${d.rate_or_amount}%` : formatMAD(d.rate_or_amount)}
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-700">
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {d.beneficiary_relation || 'تخفيض معتمد'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{d.approved_by}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggle(d.id, d.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          d.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {d.is_active ? 'نشط ومعتمد' : 'معطل مؤقتاً'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Percent className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">إضافة تخفيض مالي لتلميذ</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم التلميذ *</label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الكامل"
                    value={newDiscount.student_name}
                    onChange={e => setNewDiscount({ ...newDiscount, student_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">المعرف المدرسي (ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: STU-2026-002"
                    value={newDiscount.student_id}
                    onChange={e => setNewDiscount({ ...newDiscount, student_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">الخدمة المستهدفة</label>
                  <select
                    value={newDiscount.service_type}
                    onChange={e => setNewDiscount({ ...newDiscount, service_type: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="scolarite">التمدرس (Scolarité)</option>
                    <option value="transport">النقل المدرسي (Transport)</option>
                    <option value="cantine">المطعم المدرسي (Cantine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">نسبة التخفيض (%) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    placeholder="10"
                    value={newDiscount.rate_or_amount || ''}
                    onChange={e => setNewDiscount({ ...newDiscount, rate_or_amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono font-bold text-left dir-ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">سبب التخفيض أو صلة القرابة</label>
                <input
                  type="text"
                  placeholder="مثال: أخ ثان (10%)، أخ ثالث (20%)، اتفاقية نقابة التعليم"
                  value={newDiscount.beneficiary_relation}
                  onChange={e => setNewDiscount({ ...newDiscount, beneficiary_relation: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">جهة الاعتماد والمصادقة</label>
                <input
                  type="text"
                  placeholder="مثال: الإدارة العامة، مجلس الإدارة"
                  value={newDiscount.approved_by}
                  onChange={e => setNewDiscount({ ...newDiscount, approved_by: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20"
                >
                  حفظ واعتماد التخفيض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
