import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Save, 
  Check, 
  CheckCircle2, 
  PackageCheck, 
  Bus, 
  Utensils, 
  BookOpen, 
  Plus, 
  Trash2, 
  X, 
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { systemSettingsService } from '../services/systemSettings.service';
import { 
  LevelTarif, 
  AcademicLevelClass, 
  EducationalCycle, 
  SuppliesItem, 
  AcademicYear 
} from '../models/settings.types';

export const TarifsPricingGridView: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2026/2027');
  const [cycles, setCycles] = useState<EducationalCycle[]>([]);
  const [levels, setLevels] = useState<AcademicLevelClass[]>([]);
  const [tarifs, setTarifs] = useState<LevelTarif[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Row edit feedback
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});
  const [generalToast, setGeneralToast] = useState<string | null>(null);

  // Supplies Checklist Modal
  const [suppliesModalLevel, setSuppliesModalLevel] = useState<AcademicLevelClass | null>(null);
  const [currentChecklist, setCurrentChecklist] = useState<SuppliesItem[]>([]);
  const [newSupplyName, setNewSupplyName] = useState<string>('');
  const [newSupplyQty, setNewSupplyQty] = useState<number>(1);
  const [newSupplyMandatory, setNewSupplyMandatory] = useState<boolean>(true);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadTarifsForYear(selectedYear);
    }
  }, [selectedYear]);

  const initData = async () => {
    setLoading(true);
    try {
      const [yrs, cycs, lvls] = await Promise.all([
        systemSettingsService.getAcademicYears(),
        systemSettingsService.getEducationalCycles(),
        systemSettingsService.getLevelsAndClasses()
      ]);
      setYears(yrs);
      setCycles(cycs);
      setLevels(lvls);

      const activeY = yrs.find(y => y.is_current)?.code || '2026/2027';
      setSelectedYear(activeY);
      const tarData = await systemSettingsService.getLevelTarifs(activeY);
      setTarifs(tarData);
    } catch (err) {
      console.error('Error initializing pricing grid:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTarifsForYear = async (yearCode: string) => {
    try {
      const data = await systemSettingsService.getLevelTarifs(yearCode);
      setTarifs(data);
    } catch (err) {
      console.error('Error fetching tarifs for year:', err);
    }
  };

  const handleInputChange = (levelCode: string, field: keyof LevelTarif, value: any) => {
    setTarifs(prev => prev.map(t => {
      if (t.level_code === levelCode) {
        return { ...t, [field]: Number(value) || 0 };
      }
      return t;
    }));
  };

  const handleSaveRow = async (levelCode: string) => {
    const row = tarifs.find(t => t.level_code === levelCode);
    if (!row) return;

    setSavingRow(levelCode);
    try {
      await systemSettingsService.updateLevelTarif(levelCode, row, selectedYear);
      setSavedRows(prev => ({ ...prev, [levelCode]: true }));
      setTimeout(() => {
        setSavedRows(prev => ({ ...prev, [levelCode]: false }));
      }, 2500);

      showToast(`تم حفظ وتثبيت أسعار المستوى ${levelCode} للسنة ${selectedYear} بنجاح`);
    } catch (err) {
      console.error('Error saving tarif row:', err);
      alert('حدث خطأ أثناء حفظ التسعيرات');
    } finally {
      setSavingRow(null);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      for (const t of tarifs) {
        await systemSettingsService.updateLevelTarif(t.level_code, t, selectedYear);
      }
      showToast(`تم حفظ وتحديث مصفوفة الأسعار كاملة للسنة ${selectedYear} بنجاح`);
    } catch (err) {
      console.error('Error saving all tarifs:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setGeneralToast(msg);
    setTimeout(() => setGeneralToast(null), 4000);
  };

  // Supplies Modal Handlers
  const openSuppliesModal = (lvl: AcademicLevelClass) => {
    setSuppliesModalLevel(lvl);
    const existing = tarifs.find(t => t.level_code === lvl.level_code)?.supplies_checklist || [];
    setCurrentChecklist([...existing]);
    setNewSupplyName('');
    setNewSupplyQty(1);
    setNewSupplyMandatory(true);
  };

  const handleAddSupplyItem = () => {
    if (!newSupplyName.trim()) return;
    const newItem: SuppliesItem = {
      id: 'sup-' + Date.now(),
      item_name: newSupplyName.trim(),
      quantity: Number(newSupplyQty) || 1,
      mandatory: newSupplyMandatory
    };
    setCurrentChecklist([...currentChecklist, newItem]);
    setNewSupplyName('');
    setNewSupplyQty(1);
    setNewSupplyMandatory(true);
  };

  const handleRemoveSupplyItem = (id: string) => {
    setCurrentChecklist(currentChecklist.filter(item => item.id !== id));
  };

  const handleSaveSuppliesModal = async () => {
    if (!suppliesModalLevel) return;
    const levelCode = suppliesModalLevel.level_code;
    
    // update state
    setTarifs(prev => prev.map(t => {
      if (t.level_code === levelCode) {
        return { ...t, supplies_checklist: currentChecklist };
      }
      return t;
    }));

    // save to storage
    await systemSettingsService.updateLevelTarif(levelCode, { supplies_checklist: currentChecklist }, selectedYear);
    showToast(`تم تحديث قائمة لوازم المستوى ${suppliesModalLevel.name_ar} بنجاح`);
    setSuppliesModalLevel(null);
  };

  // Aggregated Stats
  const avgTuition = tarifs.length ? Math.round(tarifs.reduce((acc, c) => acc + (c.tuition_monthly || 0), 0) / tarifs.length) : 0;
  const avgRegistration = tarifs.length ? Math.round(tarifs.reduce((acc, c) => acc + (c.registration_fee || 0), 0) / tarifs.length) : 0;
  const avgTransport = tarifs.length ? Math.round(tarifs.reduce((acc, c) => acc + (c.transport_monthly || 0), 0) / tarifs.length) : 0;

  // Filtered rows
  const filteredLevels = levels.filter(lvl => {
    const matchesCycle = cycleFilter === 'all' || lvl.cycle_code === cycleFilter;
    const matchesSearch = !searchQuery || 
      lvl.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lvl.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lvl.level_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCycle && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">مصفوفة وجدول الأسعار والرسوم (Liste des Tarifs)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              المرحلة 2: محرك الرسوم والخدمات
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ضبط تسعيرات التمدرس الشهري، خدمات النقل والمطعم المدرسي، رسوم التسجيل ولوازم المحفظة لكل مستوى دراسي.
          </p>
        </div>

        {/* Academic Year Selector + Save All */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs text-slate-500">السنة الدراسية:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
            >
              {years.map(y => (
                <option key={y.code} value={y.code} className="bg-white text-slate-900">
                  {y.code} {y.is_current ? '(الحالية)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            حفظ كافة التعديلات
          </button>
        </div>
      </div>

      {/* General Toast */}
      {generalToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{generalToast}</span>
          </div>
          <button onClick={() => setGeneralToast(null)} className="text-emerald-700/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="متوسط التمدرس الشهري" 
          value={`${avgTuition.toLocaleString()} MAD`} 
          subtitle="معدل واجبات التمدرس لكافة المستويات" 
          icon={DollarSign} 
          variant="income" 
        />
        <StatCard 
          title="متوسط رسوم التسجيل" 
          value={`${avgRegistration.toLocaleString()} MAD`} 
          subtitle="رسوم الملف والتأمين المدرسي" 
          icon={BookOpen} 
          variant="pending" 
        />
        <StatCard 
          title="واجبات النقل المدرسي" 
          value={`${avgTransport.toLocaleString()} MAD`} 
          subtitle="تسعيرة النقل الشهري المعتمدة" 
          icon={Bus} 
          variant="default" 
        />
        <StatCard 
          title="المستويات المسعرة" 
          value={`${tarifs.length} مستويات`} 
          subtitle={`سنة ${selectedYear}`} 
          icon={Layers} 
          variant="income" 
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCycleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              cycleFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-500 hover:text-white border border-slate-200'
            }`}
          >
            كافة الأسلاك
          </button>
          {cycles.map(c => (
            <button
              key={c.code}
              onClick={() => setCycleFilter(c.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cycleFilter === c.code
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:text-white border border-slate-200'
              }`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input 
            type="text"
            placeholder="بحث بالمستوى أو الرمز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Matrix Pricing Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
              <tr>
                <th className="py-4 px-4">المستوى والسلك</th>
                <th className="py-4 px-3 text-center">التمدرس الشهري (Scolarité)</th>
                <th className="py-4 px-3 text-center">النقل المدرسي (Transport)</th>
                <th className="py-4 px-3 text-center">المطعم المدرسي (Cantine)</th>
                <th className="py-4 px-3 text-center">المحفظة واللوازم (Fournitures)</th>
                <th className="py-4 px-3 text-center">رسوم التسجيل (Inscription)</th>
                <th className="py-4 px-3 text-center">إعادة التسجيل (Réinscription)</th>
                <th className="py-4 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLevels.map((lvl) => {
                const tarif = tarifs.find(t => t.level_code === lvl.level_code) || {
                  level_code: lvl.level_code,
                  academic_year_code: selectedYear,
                  tuition_monthly: 0,
                  transport_monthly: 0,
                  canteen_monthly: 0,
                  supplies_fee: 0,
                  registration_fee: 0,
                  re_registration_fee: 0,
                  supplies_checklist: []
                };

                const isSaved = savedRows[lvl.level_code];
                const isSaving = savingRow === lvl.level_code;

                return (
                  <tr 
                    key={lvl.level_code}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Level Name & Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs border border-indigo-500/20">
                          {lvl.level_code}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{lvl.name_ar}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{lvl.name_fr}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tuition Monthly */}
                    <td className="py-3 px-2 text-center">
                      <div className="relative inline-block w-28">
                        <input 
                          type="number"
                          step="50"
                          value={tarif.tuition_monthly}
                          onChange={(e) => handleInputChange(lvl.level_code, 'tuition_monthly', e.target.value)}
                          className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-slate-900 font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="absolute left-2 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                      </div>
                    </td>

                    {/* Transport Monthly */}
                    <td className="py-3 px-2 text-center">
                      <div className="relative inline-block w-24">
                        <input 
                          type="number"
                          step="50"
                          value={tarif.transport_monthly}
                          onChange={(e) => handleInputChange(lvl.level_code, 'transport_monthly', e.target.value)}
                          className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-amber-300 font-mono text-xs focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute left-2 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                      </div>
                    </td>

                    {/* Canteen Monthly */}
                    <td className="py-3 px-2 text-center">
                      <div className="relative inline-block w-24">
                        <input 
                          type="number"
                          step="50"
                          value={tarif.canteen_monthly}
                          onChange={(e) => handleInputChange(lvl.level_code, 'canteen_monthly', e.target.value)}
                          className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-slate-800 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="absolute left-2 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                      </div>
                    </td>

                    {/* Supplies Fee + Checklist Button */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="relative inline-block w-24">
                          <input 
                            type="number"
                            step="50"
                            value={tarif.supplies_fee}
                            onChange={(e) => handleInputChange(lvl.level_code, 'supplies_fee', e.target.value)}
                            className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-slate-800 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <span className="absolute left-1.5 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSuppliesModal(lvl)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="تحديد تفاصيل ولوازم المحفظة"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Registration Fee */}
                    <td className="py-3 px-2 text-center">
                      <div className="relative inline-block w-24">
                        <input 
                          type="number"
                          step="100"
                          value={tarif.registration_fee}
                          onChange={(e) => handleInputChange(lvl.level_code, 'registration_fee', e.target.value)}
                          className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-emerald-700 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="absolute left-1.5 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                      </div>
                    </td>

                    {/* Re-registration Fee */}
                    <td className="py-3 px-2 text-center">
                      <div className="relative inline-block w-24">
                        <input 
                          type="number"
                          step="100"
                          value={tarif.re_registration_fee}
                          onChange={(e) => handleInputChange(lvl.level_code, 're_registration_fee', e.target.value)}
                          className="w-full text-center py-1.5 px-2 rounded-lg bg-white border border-slate-700 text-slate-800 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="absolute left-1.5 top-2 text-[9px] text-slate-500 font-mono">MAD</span>
                      </div>
                    </td>

                    {/* 1-Click Save Row */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSaveRow(lvl.level_code)}
                        disabled={isSaving}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-sm'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            تم الحفظ
                          </>
                        ) : isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            حفظ...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            حفظ
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplies Checklist Modal */}
      {suppliesModalLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    قائمة ولوازم المحفظة: {suppliesModalLevel.name_ar}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {suppliesModalLevel.level_code} • {suppliesModalLevel.name_fr}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSuppliesModalLevel(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* Add Item Row */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-700">إضافة بند أو مقرر جديد:</div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="اسم المقرر، الدفتر، أو الوسيلة..."
                    value={newSupplyName}
                    onChange={(e) => setNewSupplyName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <input 
                    type="number"
                    min="1"
                    placeholder="الكمية"
                    value={newSupplyQty}
                    onChange={(e) => setNewSupplyQty(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-700 text-white text-xs text-center focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSupplyItem}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox"
                    id="mandCheckbox"
                    checked={newSupplyMandatory}
                    onChange={(e) => setNewSupplyMandatory(e.target.checked)}
                    className="rounded border-slate-700 bg-white text-indigo-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="mandCheckbox" className="text-[11px] text-slate-500 cursor-pointer">
                    بند إلزامي ضمن المحفظة المدرسية
                  </label>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {currentChecklist.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    لم يتم تسجيل بنود محفظة لهذا المستوى بعد.
                  </div>
                ) : (
                  currentChecklist.map((item, index) => (
                    <div 
                      key={item.id || index}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-emerald-700 font-mono text-[10px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium text-white">{item.item_name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60 font-mono text-[10px]">
                          الكمية: {item.quantity}
                        </span>
                        {item.mandatory && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                            إلزامي
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSupplyItem(item.id)}
                        className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSuppliesModalLevel(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSuppliesModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  حفظ وتأكيد قائمة اللوازم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
