import React, { useState, useEffect } from 'react';
import {
  Bus,
  Plus,
  RefreshCw,
  Users,
  MapPin,
  Phone,
  Gauge,
  CheckCircle2,
  XCircle,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { formatMAD } from '../../../shared/lib/currencyFormatter';
import { TransportLine, NewTransportLineFormData } from '../models/services.types';
import { servicesConfigService } from '../services/servicesConfig.service';

export const TransportConfigView: React.FC = () => {
  const [lines, setLines] = useState<TransportLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<NewTransportLineFormData>({
    line_code: '',
    line_name: '',
    bus_registration: '',
    bus_brand: 'Mercedes Sprinter',
    capacity: 25,
    driver_name: '',
    driver_phone: '',
    assistant_name: '',
    assistant_phone: '',
    zone_coverage: '',
    monthly_fee: 350,
    academic_year: '2026/2027',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await servicesConfigService.getTransportLines();
      setLines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBuses = lines.length;
  const totalSeats = lines.reduce((sum, l) => sum + l.capacity, 0);
  const totalEnrolled = lines.reduce((sum, l) => sum + (l.enrolled_count || 0), 0);
  const avgOccupancy = totalSeats > 0 ? Math.round((totalEnrolled / totalSeats) * 100) : 0;

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await servicesConfigService.updateTransportLine(id, { is_active: !currentStatus });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.line_code || !formData.line_name || !formData.bus_registration || !formData.driver_name) return;

    setSubmitting(true);
    try {
      await servicesConfigService.addTransportLine(formData);
      setIsModalOpen(false);
      setFormData({
        line_code: '',
        line_name: '',
        bus_registration: '',
        bus_brand: 'Mercedes Sprinter',
        capacity: 25,
        driver_name: '',
        driver_phone: '',
        assistant_name: '',
        assistant_phone: '',
        zone_coverage: '',
        monthly_fee: 350,
        academic_year: '2026/2027',
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة خط النقل الجديد');
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
            <Bus className="w-5 h-5 text-amber-700" />
            <span>النقل المدرسي وتدقيق خطوط الأسطول (Transport Scolaire & Flotte)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الحافلات، السائقين والمرافقات، المناطق المغطاة، ومعدل إشغال المقاعد وتكلفتها الشهرية
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
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خط حافلة جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="أسطول الحافلات النشطة"
          value={`${totalBuses} حافلات`}
          subtitle="تغطي مقاطعات مراكش"
          icon={Bus}
          variant="default"
        />
        <StatCard
          title="إجمالي المقاعد المتاحة"
          value={`${totalSeats} مقعداً`}
          subtitle="الطاقة الاستيعابية للأسطول"
          icon={Gauge}
          variant="pending"
        />
        <StatCard
          title="التلاميذ المشتركون بالنقل"
          value={`${totalEnrolled} تلميذاً`}
          subtitle="اشتراكات مؤكدة 2026/2027"
          icon={Users}
          variant="income"
        />
        <StatCard
          title="معدل إشغال المقاعد"
          value={`${avgOccupancy}%`}
          subtitle="كفاءة استغلال الأسطول"
          icon={Gauge}
          variant={avgOccupancy > 90 ? 'expense' : 'income'}
        />
      </div>

      {/* Transport Lines Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lines.map((line) => {
          const rate = line.occupancy_rate || 0;
          const isFull = rate >= 95;
          const isMid = rate >= 70 && rate < 95;

          return (
            <div
              key={line.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Top Badge & Line Code */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    {line.line_code}
                  </span>

                  <button
                    onClick={() => handleToggleStatus(line.id, line.is_active)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      line.is_active
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {line.is_active ? 'خط نشط في الخدمة' : 'متوقف مؤقتاً'}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{line.line_name}</h3>
                
                {/* Bus Details */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-mono">
                  <span>لوحة الترقيم: <strong className="text-white">{line.bus_registration}</strong></span>
                  <span className="text-slate-500">{line.bus_brand}</span>
                </div>

                {/* Driver & Assistant */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 border border-slate-200/80 text-xs space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">السائق المعتمد:</span>
                    <span className="font-bold text-slate-900">{line.driver_name}</span>
                  </div>
                  {line.driver_phone && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>الهاتف:</span>
                      <a href={`tel:${line.driver_phone}`} className="text-amber-700 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {line.driver_phone}
                      </a>
                    </div>
                  )}
                  {line.assistant_name && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">المرافقة:</span>
                      <span className="text-slate-800">{line.assistant_name}</span>
                    </div>
                  )}
                </div>

                {/* Coverage Zones */}
                <div className="mb-4 text-xs">
                  <span className="text-slate-500 text-[10px] block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-700" /> المناطق والمحطات المشمولة:
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">{line.zone_coverage}</p>
                </div>
              </div>

              {/* Bottom Occupancy & Tariff */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-500">المقاعد المشغولة:</span>
                  <span className="font-bold text-slate-900">
                    {line.enrolled_count} / {line.capacity} ({rate}%)
                  </span>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : isMid ? 'bg-gradient-to-r from-teal-500 to-emerald-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">التسعيرة الشهرية:</span>
                  <span className="text-sm font-bold text-amber-700">{formatMAD(line.monthly_fee)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Transport Line Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-900 my-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold">إضافة خط حافلة ونقل مدرسي جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLine} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">رمز الخط (Line Code)*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: LIGNE-04"
                    value={formData.line_code}
                    onChange={(e) => setFormData({ ...formData, line_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">اسم الخط والمسار*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خط جيليز - إزيكي"
                    value={formData.line_name}
                    onChange={(e) => setFormData({ ...formData, line_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">لوحة الترقيم*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 28-أ-12345"
                    value={formData.bus_registration}
                    onChange={(e) => setFormData({ ...formData, bus_registration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">نوع وموديل الحافلة</label>
                  <input
                    type="text"
                    placeholder="Mercedes Sprinter"
                    value={formData.bus_brand}
                    onChange={(e) => setFormData({ ...formData, bus_brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">السعة (عدد المقاعد)*</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">اسم السائق المعتمد*</label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الكامل للسائق"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">هاتف السائق</label>
                  <input
                    type="tel"
                    placeholder="06XXXXXXXX"
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">اسم المرافقة</label>
                  <input
                    type="text"
                    placeholder="الاسم الكامل للمرافقة"
                    value={formData.assistant_name}
                    onChange={(e) => setFormData({ ...formData, assistant_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">هاتف المرافقة</label>
                  <input
                    type="tel"
                    placeholder="06XXXXXXXX"
                    value={formData.assistant_phone}
                    onChange={(e) => setFormData({ ...formData, assistant_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-500 block mb-1">المناطق والمحطات المشمولة*</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الداوديات، الوحدة الرابعة، ديور المساكين"
                    value={formData.zone_coverage}
                    onChange={(e) => setFormData({ ...formData, zone_coverage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">التسعيرة الشهرية (MAD)*</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  />
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:bg-amber-600 text-slate-950 font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ وإدراج الخط في الأسطول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
