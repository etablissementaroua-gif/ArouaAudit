import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  CheckCircle2, 
  GraduationCap, 
  Tag, 
  X, 
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import { StatCard } from '../../../shared/components/StatCard';
import { systemSettingsService } from '../services/systemSettings.service';
import { EducationalCycle, AcademicLevelClass } from '../models/settings.types';

export const LevelsAndGroupsView: React.FC = () => {
  const [cycles, setCycles] = useState<EducationalCycle[]>([]);
  const [levels, setLevels] = useState<AcademicLevelClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Group Management Modal
  const [editingLevel, setEditingLevel] = useState<AcademicLevelClass | null>(null);
  const [editedGroups, setEditedGroups] = useState<string[]>([]);
  const [newGroupInput, setNewGroupInput] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cycs, lvls] = await Promise.all([
        systemSettingsService.getEducationalCycles(),
        systemSettingsService.getLevelsAndClasses()
      ]);
      setCycles(cycs);
      setLevels(lvls);
    } catch (err) {
      console.error('Error loading cycles & levels:', err);
    } finally {
      setLoading(false);
    }
  };

  const openGroupModal = (level: AcademicLevelClass) => {
    setEditingLevel(level);
    setEditedGroups([...(level.groups || [])]);
    setNewGroupInput('');
  };

  const handleAddGroup = () => {
    const val = newGroupInput.trim();
    if (!val) return;
    if (editedGroups.includes(val)) {
      alert('هذا الفوج موجود بالفعل في هذا المستوى');
      return;
    }
    setEditedGroups([...editedGroups, val]);
    setNewGroupInput('');
  };

  const handleRemoveGroup = (indexToRemove: number) => {
    setEditedGroups(editedGroups.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveGroups = async () => {
    if (!editingLevel) return;
    try {
      await systemSettingsService.updateClassGroups(editingLevel.level_code, editedGroups);
      setLevels(prev => prev.map(l => l.level_code === editingLevel.level_code ? { ...l, groups: editedGroups } : l));
      setActionSuccess(`تم تحديث أفواج المستوى ${editingLevel.name_ar} (${editingLevel.level_code}) بنجاح`);
      setEditingLevel(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error('Error saving groups:', err);
      alert('حدث خطأ أثناء حفظ الأفواج');
    }
  };

  // Calculations
  const filteredLevels = selectedCycle === 'all' 
    ? levels 
    : levels.filter(l => l.cycle_code === selectedCycle);

  const totalGroupsCount = levels.reduce((acc, curr) => acc + (curr.groups?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">الأسلاك والمستويات والأفواج (Cycles, Niveaux & Groupes)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 border border-indigo-500/20">
              المرحلة 2: البنية البيداغوجية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            الهيكل البيداغوجي المعتمد وتوزيع الأفواج الدراسية المتطابقة تلقائياً مع خيارات الفلترة والتسجيل بشاشة التلاميذ.
          </p>
        </div>

        {/* Cycle Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedCycle('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedCycle === 'all'
                ? 'px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold shadow-xs text-xs'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            جميع الأسلاك
          </button>
          {cycles.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCycle(c.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCycle === c.code
                  ? 'px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold shadow-xs text-xs'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700/60 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="الأسلاك التعليمية المعتمدة" 
          value={`${cycles.length} أسلاك`} 
          subtitle="الأولي، الابتدائي، الثانوي الإعدادي" 
          icon={GraduationCap} 
          variant="income" 
        />
        <StatCard 
          title="المستويات الدراسية" 
          value={`${levels.length} مستويات`} 
          subtitle="من الروض الأول PS حتى 3AC" 
          icon={Layers} 
          variant="default" 
        />
        <StatCard 
          title="إجمالي الأفواج الدراسية" 
          value={`${totalGroupsCount} أفواج`} 
          subtitle="متطابقة مع شاشة التلاميذ المسجلين" 
          icon={Users} 
          variant="pending" 
        />
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block mb-0.5">تطابق الأفواج التلقائي (Sync Groupes):</span>
          أي تعديل أو إضافة على أسماء الأفواج (مثل: فوج A، فوج B، فوج C) يتم تطبيقه فورياً في قاعدة البيانات وينعكس على خيارات التوزيع الصفي في ملفات التلاميذ المسجلين ومصفوفة الفواتير.
        </div>
      </div>

      {/* Cycles & Levels Grid */}
      <div className="space-y-6">
        {cycles
          .filter(c => selectedCycle === 'all' || c.code === selectedCycle)
          .map((cycle) => {
            const cycleLevels = levels.filter(l => l.cycle_code === cycle.code);
            return (
              <div 
                key={cycle.code}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden backdrop-blur-md"
              >
                {/* Cycle Banner */}
                <div className="p-4 px-6 bg-slate-50 border border-slate-200 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                      0{cycle.display_order}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {cycle.name_ar}
                        <span className="text-xs font-mono text-slate-500 font-normal">({cycle.name_fr})</span>
                      </h2>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {cycleLevels.length} مستويات • {cycleLevels.reduce((a, c) => a + (c.groups?.length || 0), 0)} أفواج
                  </span>
                </div>

                {/* Levels Cards */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cycleLevels.map((lvl) => (
                    <div 
                      key={lvl.level_code}
                      className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                            {lvl.level_code}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {lvl.groups?.length || 0} أفواج
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{lvl.name_ar}</h3>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{lvl.name_fr}</p>
                      </div>

                      {/* Groups Tags */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {lvl.groups && lvl.groups.length > 0 ? (
                            lvl.groups.map((grp, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs"
                              >
                                <Tag className="w-3 h-3 text-emerald-700" />
                                {grp}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">لا توجد أفواج معتمدة</span>
                          )}
                        </div>

                        <button
                          onClick={() => openGroupModal(lvl)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          تعديل وإدارة الأفواج
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Edit Groups Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">إدارة أفواج المستوى: {editingLevel.name_ar}</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingLevel.level_code} - {editingLevel.name_fr}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingLevel(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  الأفواج الحالية المعتمدة ({editedGroups.length})
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white border border-slate-200 min-h-[50px] items-center">
                  {editedGroups.length === 0 ? (
                    <span className="text-xs text-slate-500">لم يتم تحديد أي فوج بعد. أضف فوجاً أدناه.</span>
                  ) : (
                    editedGroups.map((grp, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs"
                      >
                        {grp}
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(idx)}
                          className="hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف الفوج"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  إضافة فوج دراسي جديد
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="مثال: فوج C أو Groupe C"
                    value={newGroupInput}
                    onChange={(e) => setNewGroupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGroup();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">اضغط Enter أو زر إضافة لإدراج الفوج بالقائمة.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveGroups}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  حفظ وتأكيد الأفواج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
