import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Package,
  Layers,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingBag,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { SuppliesPack, NewSuppliesPackFormData, SuppliesItemDetail } from '../models/services.types';
import { servicesConfigService } from '../services/servicesConfig.service';

export const SuppliesConfigView: React.FC = () => {
  const [packs, setPacks] = useState<SuppliesPack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

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

  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);

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

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setFormData({
      ...formData,
      items_breakdown: [...formData.items_breakdown, { name: newItemName.trim(), qty: newItemQty }],
      items_count: formData.items_breakdown.length + 1,
    });
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    const updated = formData.items_breakdown.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items_breakdown: updated,
      items_count: updated.length,
    });
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <span>اللوازم والمحفظة والزي المدرسي (Fournitures & Packs Scolaires)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إعداد حزم الكتب والمقررات، تتبع مخزون المآزر والمحافظ، وتدقيق هوامش الربحية التجارية
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حزمة لوازم جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="الحزم المدرسية المفعلة"
          value={`${totalPacksCount} حزم`}
          subtitle="مصنفة حسب المستويات"
          icon={Package}
          variant="default"
        />
        <StatCard
          title="الحزم الموزعة والمسددة"
          value={`${totalSold} حزمة`}
          subtitle="سلمت لأولياء الأمور"
          icon={ShoppingBag}
          variant="income"
        />
        <StatCard
          title="المخزون المتوفر المتبقي"
          value={`${totalStockLeft} وحدة`}
          subtitle="جاهزة في مستودع الإدارة"
          icon={Layers}
          variant="pending"
        />
        <StatCard
          title="إجمالي الهامش الربحي المحقق"
          value={formatMAD(totalMarginProfit)}
          subtitle="عائد مالي صاف للمؤسسة"
          icon={TrendingUp}
          variant="income"
        />
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packs.map((pack) => {
          const totalStock = pack.stock_available + pack.stock_sold;
          const soldRate = totalStock > 0 ? Math.round((pack.stock_sold / totalStock) * 100) : 0;
          const items = Array.isArray(pack.items_breakdown) ? pack.items_breakdown : [];

          return (
            <div
              key={pack.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {pack.pack_code}
                  </span>

                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    مستوى: {pack.academic_level}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-0.5">{pack.title_ar}</h3>
                <p className="text-[11px] text-slate-500 mb-4">{pack.title_fr}</p>

                {/* Pricing & Margin Box */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4 text-center font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">سعر التكلفة:</span>
                    <span className="text-slate-700 font-bold">{formatMAD(pack.cost_price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">سعر البيع:</span>
                    <span className="text-emerald-700 font-bold">{formatMAD(pack.selling_price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">هامش الربح:</span>
                    <span className="text-amber-700 font-bold">+{formatMAD(pack.margin_unit || 0)}</span>
                  </div>
                </div>

                {/* Items Breakdown list */}
                {items.length > 0 && (
                  <div className="mb-4">
                    <span className="text-slate-500 text-[10px] block mb-1.5">مكونات ومحتويات الحزمة:</span>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((it, idx) => {
                        const isBook = /كتاب|مقرر|livre|manuel|lecture|قصة|قصص/i.test(it.name || '');
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                              isBook
                                ? 'bg-teal-50/70 text-teal-900 border-teal-200/60 font-medium'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            <span className="truncate max-w-[180px]">{it.name}</span>
                            <span className="font-mono text-[11px] opacity-75">x{it.qty}</span>
                          </div>
                        );
                      })}
                      {items.length > 3 && (
                        <div className="text-[10px] text-slate-500 text-center pt-0.5">
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
                  <span className="text-slate-500">التوزيع والمبيعات:</span>
                  <span className="font-bold text-slate-900">
                    {pack.stock_sold} بيعت / {pack.stock_available} متبقية
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, soldRate)}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-500">الأرباح التراكمية:</span>
                  <span className="font-bold text-emerald-700">{formatMAD(pack.margin_total || 0)}</span>
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
                    placeholder="مثال: CE2 أو 1ère Année Collège"
                    value={formData.academic_level}
                    onChange={(e) => setFormData({ ...formData, academic_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">عنوان الحزمة بالعربية*</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حزمة كتب ومستلزمات الثالث ابتدائي"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">عنوان الحزمة بالفرنسية</label>
                <input
                  type="text"
                  placeholder="Pack Fournitures CE2"
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
                    min="0"
                    step="10"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">سعر البيع للأسرة (MAD)*</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">المخزون المتوفر (كمية)*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_available}
                    onChange={(e) => setFormData({ ...formData, stock_available: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items in Pack Section */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 border border-slate-200">
                <span className="text-slate-500 block mb-2 font-semibold">مكونات الحزمة (كتب ومستلزمات):</span>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="اسم الكتاب أو المستلزم..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.items_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      <span>
                        {item.name} <strong className="font-mono text-emerald-700">(x{item.qty})</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ وتفعيل الحزمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
