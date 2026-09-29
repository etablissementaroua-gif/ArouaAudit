import React, { useState, useEffect } from 'react';
import { financeOperationsService } from '../services/financeOperations.service';
import { StudentDiscountExemption, CreateDiscountDTO, ServiceType } from '../models/finance.types';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { 
  Award, 
  Search, 
  Plus, 
  CheckCircle2, 
  User, 
  GraduationCap, 
  Utensils, 
  Bus, 
  ShieldCheck, 
  X,
  HeartHandshake
} from 'lucide-react';

export const ExemptionsView: React.FC = () => {
  const [exemptions, setExemptions] = useState<StudentDiscountExemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newExemption, setNewExemption] = useState<CreateDiscountDTO>({
    student_id: '',
    student_name: '',
    academic_level: '1ère Année Collège',
    type: 'gratuite_totale',
    service_type: 'scolarite',
    rate_or_amount: 100,
    is_percentage: true,
    beneficiary_relation: 'ابن أستاذ(ة) بالمؤسسة',
    approved_by: 'مجلس الإدارة'
  });

  const loadData = async () => {
    setLoading(true);
    const data = await financeOperationsService.getDiscountsAndExemptions('exemptions');
    setExemptions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExemptions = exemptions.filter(e => 
    e.student_name.toLowerCase().includes(search.toLowerCase()) ||
    e.student_id.toLowerCase().includes(search.toLowerCase()) ||
    (e.beneficiary_relation && e.beneficiary_relation.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await financeOperationsService.toggleDiscountStatus(id, !currentStatus);
    loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExemption.student_name) return;

    await financeOperationsService.addDiscountExemption({
      ...newExemption,
      student_id: newExemption.student_id || `STU-${Date.now().toString().slice(-4)}`
    });

    setIsModalOpen(false);
    setNewExemption({
      student_id: '',
      student_name: '',
      academic_level: '1ère Année Collège',
      type: 'gratuite_totale',
      service_type: 'scolarite',
      rate_or_amount: 100,
      is_percentage: true,
      beneficiary_relation: 'ابن أستاذ(ة) بالمؤسسة',
      approved_by: 'مجلس الإدارة'
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-700">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">الإعفاءات والمجانيات الدراسية (Gratuités & Bourses)</h1>
            <p className="text-slate-500 text-sm">سجل المنح المدرسية الكاملة، إعفاءات أبناء الأطر والعاملين، وحالات الدعم الاجتماعي</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>منح إعفاء دراسي جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">إجمالي المستفيدين من الإعفاء</span>
          <p className="text-2xl font-bold text-slate-900 font-mono">{exemptions.filter(e => e.is_active).length}</p>
          <span className="text-xs text-slate-500 mt-1 block">تلاميذ يتمتعون بمجانية معتمدة</span>
        </div>

        <div className="bg-white border border-amber-200 shadow-xs p-5 rounded-2xl">
          <span className="text-xs text-amber-700 uppercase font-semibold block mb-1">إعفاءات التمدرس الكاملة (100%)</span>
          <p className="text-2xl font-bold text-amber-700 font-mono">
            {exemptions.filter(e => e.type === 'gratuite_totale' && e.is_active).length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">أبناء الأطر وهيئة التدريس</span>
        </div>

        <div className="bg-white border border-cyan-500/20 p-5 rounded-2xl">
          <span className="text-xs text-emerald-800 uppercase font-semibold block mb-1">إعفاءات الخدمات الجزئية</span>
          <p className="text-2xl font-bold text-emerald-800 font-mono">
            {exemptions.filter(e => e.type === 'gratuite_partielle' && e.is_active).length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">إعفاء وجبات المطعم والنقل</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="بحث سريع باسم التلميذ، سبب الإعفاء، أو المعرف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs pr-10 pl-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-lg"
        />
      </div>

      {/* Exemptions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-4">التلميذ / المعرف</th>
                <th className="py-4 px-4">المستوى الدراسي</th>
                <th className="py-4 px-4">نوع الإعفاء</th>
                <th className="py-4 px-4">الخدمة المعفاة</th>
                <th className="py-4 px-4">مبرر وسند المنحة</th>
                <th className="py-4 px-4">جهة المصادقة</th>
                <th className="py-4 px-4 text-center">حالة المنحة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">جاري تحميل سجل الإعفاءات...</td>
                </tr>
              ) : filteredExemptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">لا توجد إعفاءات مطابقة للبحث</td>
                </tr>
              ) : (
                filteredExemptions.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span>{e.student_name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        معرف: {e.student_id}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-700">
                      {e.academic_level}
                    </td>

                    <td className="py-4 px-4">
                      {e.type === 'gratuite_totale' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Award className="w-3.5 h-3.5" />
                          <span>إعفاء كامل (100%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-emerald-800 border border-cyan-500/30">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          <span>إعفاء جزئي لخدمة</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {e.service_type === 'transport' ? (
                        <span className="text-xs text-slate-700">النقل المدرسي</span>
                      ) : e.service_type === 'cantine' ? (
                        <span className="text-xs text-slate-700">المطعم المدرسي</span>
                      ) : (
                        <span className="text-xs text-slate-700">التمدرس العام</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-700">
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {e.beneficiary_relation || 'منحة معتمدة'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{e.approved_by}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggle(e.id, e.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          e.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {e.is_active ? 'سارية ومعتمدة' : 'موقوفة'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Exemption Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-xs w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <Award className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">منح إعفاء دراسي / مجانية</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
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
                    value={newExemption.student_name}
                    onChange={e => setNewExemption({ ...newExemption, student_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">المعرف المدرسي (ID)</label>
                  <input
                    type="text"
                    placeholder="مثال: STU-2026-008"
                    value={newExemption.student_id}
                    onChange={e => setNewExemption({ ...newExemption, student_id: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">نوع الإعفاء</label>
                  <select
                    value={newExemption.type}
                    onChange={e => setNewExemption({ ...newExemption, type: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gratuite_totale">إعفاء دراسي كامل (100%)</option>
                    <option value="gratuite_partielle">إعفاء جزئي لخدمة محددة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">الخدمة المعفاة</label>
                  <select
                    value={newExemption.service_type}
                    onChange={e => setNewExemption({ ...newExemption, service_type: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="scolarite">واجبات التمدرس (Scolarité)</option>
                    <option value="cantine">المطعم المدرسي (Cantine)</option>
                    <option value="transport">النقل المدرسي (Transport)</option>
                    <option value="all">كافة الخدمات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">سبب وسند الإعفاء</label>
                <input
                  type="text"
                  placeholder="مثال: ابن أستاذ(ة)، منحة تشجيعية، دعم اجتماعي معتمد"
                  value={newExemption.beneficiary_relation}
                  onChange={e => setNewExemption({ ...newExemption, beneficiary_relation: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">جهة المصادقة والاعتماد</label>
                <input
                  type="text"
                  placeholder="مثال: مجلس الإدارة، الإدارة العامة"
                  value={newExemption.approved_by}
                  onChange={e => setNewExemption({ ...newExemption, approved_by: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
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
                  حفظ واعتماد الإعفاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
