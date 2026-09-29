import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Package,
  Layers,
  TrendingUp,
  ShoppingBag,
  X,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { SuppliesPack, NewSuppliesPackFormData } from '../models/services.types';
import { servicesConfigService } from '../services/servicesConfig.service';

export const SuppliesConfigView: React.FC = () => {
  const [packs, setPacks] = useState<SuppliesPack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState<NewSuppliesPackFormData>({
    pack_code: '',
    academic_level: 'CP',
    title_ar: '',
    title_fr: '',
    items_count: 8,
    cost_price: 350,
    selling_price: 500,
    stock_available: 50,
    items_breakdown: [
      { name: 'كتاب القراءة والمقررات الأساسية', qty: 2 },
      { name: 'دفاتر مسطرة وأقلام ملونة', qty: 6 },
      { name: 'مئزر مدرسي موحد بشعار أروى', qty: 1 },
    ],
    academic_year: '2026/2027',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await servicesConfigService.getSuppliesPacks();
      setPacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPacksCount = packs.length;
  const totalSold = packs.reduce((sum, p) => sum + p.stock_sold, 0);
  const totalStockLeft = packs.reduce((sum, p) => sum + p.stock_available, 0);
  const totalMarginProfit = packs.reduce((sum, p) => sum + (p.margin_total || 0), 0);

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pack_code || !formData.title_ar || !formData.selling_price) return;

    setSubmitting(true);
    try {
      await servicesConfigService.addSuppliesPack(formData);
      setIsModalOpen(false);
      setFormData({
        pack_code: '',
        academic_level: 'CE2',
        title_ar: '',
        title_fr: '',
        items_count: 8,
        cost_price: 350,
        selling_price: 500,
        stock_available: 50,
        items_breakdown: [
          { name: 'كتاب القراءة والمقررات الأساسية', qty: 2 },
          { name: 'دفاتر مسطرة وأقلام ملونة', qty: 6 },
          { name: 'مئزر مدرسي موحد بشعار أروى', qty: 1 },
        ],
        academic_year: '2026/2027',
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة حزمة اللوازم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Matching Benchmark Image */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              اللوازم والمحفظة والزي المدرسي
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Fournitures & Packs (Scolaires)
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إعداد حزم الكتب والمقررات، تتبع مخزون المآزر والمحافظ، وتدقيق هوامش الربحية التجارية للمؤسسة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حزمة لوازم جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Matching Benchmark Left Borders and Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الهامش الربحي المحقق"
          value={formatMAD(totalMarginProfit)}
          subtitle="عائد مالي صاف ومستخلص للمؤسسة"
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="المخزون المتوفر المتبقي"
          value={`${totalStockLeft} وحدة`}
          subtitle="جاهزة ومفرزة في مستودع الإدارة"
          icon={Layers}
          variant="pending"
        />
        <StatCard
          title="الحزم الموزعة والمسددة"
          value={`${totalSold} حزمة`}
          subtitle="سلمت بالكامل لأولياء الأمور"
          icon={ShoppingBag}
          variant="default"
        />
        <StatCard
          title="الحزم المدرسية المفعلة"
          value={`${totalPacksCount} حزم`}
          subtitle="مصنفة حسب المستويات المقررة"
          icon={Package}
          variant="default"
        />
      </div>

      {/* 3. Filter Tabs Bar Matching Benchmark */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-sm font-bold text-slate-900">
          الباقات والحزم المعتمدة لجميع الأسلاك: {packs.length} مستويات
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              levelFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            الكل ({packs.length})
          </button>
          <button
            onClick={() => setLevelFilter('primary')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              levelFilter === 'primary'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            التعليم الابتدائي
          </button>
          <button
            onClick={() => setLevelFilter('middle')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              levelFilter === 'middle'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            التعليم الإعدادي
          </button>
        </div>
      </div>

      {/* 4. Pack Cards 3-Column Grid Matching Benchmark */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packs.map((pack) => {
          const totalStock = pack.stock_available + pack.stock_sold;
          const soldRate = totalStock > 0 ? Math.round((pack.stock_sold / totalStock) * 100) : 0;
          const items = Array.isArray(pack.items_breakdown) ? pack.items_breakdown : [];
          const isBlueBadge = pack.academic_level.includes('6') || pack.academic_level.includes('AEP');

          return (
            <div
              key={pack.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Top Code and Level Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                    {pack.pack_code}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      isBlueBadge
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    مستوى: {pack.academic_level}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 text-center mt-2 mb-0.5">{pack.title_ar}</h3>
                <p className="text-xs text-slate-400 text-center mb-3">{pack.title_fr}</p>

                {/* 3-Column Pricing Breakdown Matrix */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 p-3 rounded-xl border border-slate-200/70 text-center font-mono my-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold mb-0.5 block">سعر التكلفة:</span>
                    <span className="text-xs font-bold text-slate-800">{formatMAD(pack.cost_price)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold mb-0.5 block">سعر البيع:</span>
                    <span className="text-xs font-bold text-slate-900">{formatMAD(pack.selling_price)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold mb-0.5 block">هامش الربح:</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold block">MAD</span>
                    <span className="text-xs font-extrabold text-emerald-700">+{pack.margin_unit || 0},00</span>
                  </div>
                </div>

                {/* Items Breakdown list */}
                {items.length > 0 && (
                  <div className="mb-4">
                    <span className="text-slate-500 text-xs font-medium block mb-2">مكونات ومحتويات الحزمة:</span>
                    <div className="space-y-1.5">
                      {items.slice(0, 3).map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800"
                        >
                          <span className="truncate max-w-[200px]">{it.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold border border-slate-200">
                            x{it.qty}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-xs font-bold text-emerald-600 text-center py-1">
                          + {items.length - 3} مستلزمات إضافية
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock and Sales Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-500 font-medium">التوزيع والمبيعات:</span>
                  <span className="font-bold text-slate-800">
                    {pack.stock_sold} بيعت / {pack.stock_available} متبقية
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex my-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, soldRate)}%` }}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-mono">
                  <span className="text-xs text-slate-500">الأرباح التراكمية:</span>
                  <span className="text-sm font-black text-emerald-700">{formatMAD(pack.margin_total || 0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplies Pack Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold">إنشاء حزمة مقررات ولوازم مدرسية جديدة</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">رمز الحزمة (Pack Code)*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PACK-CE2-2026"
                    value={formData.pack_code}
                    onChange={(e) => setFormData({ ...formData, pack_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono uppercase focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">المستوى الدراسي المستهدف*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: CE2 أو 1AC"
                    value={formData.academic_level}
                    onChange={(e) => setFormData({ ...formData, academic_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">تسمية الحزمة (بالعربية)*</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حزمة كتب ومستلزمات الثاني ابتدائي"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">التسمية بالفرنسية</label>
                <input
                  type="text"
                  placeholder="Ex: Pack Scolaire CE2 Intégral"
                  value={formData.title_fr}
                  onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">سعر التكلفة (MAD)*</label>
                  <input
                    type="number"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">سعر البيع (MAD)*</label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">المخزون المتوفر*</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_available}
                    onChange={(e) => setFormData({ ...formData, stock_available: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-md shadow-emerald-700/20 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ وإضافة الحزمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
