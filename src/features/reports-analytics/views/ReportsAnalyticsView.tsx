import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  PieChart,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Utensils,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowUpRight,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { formatMAD } from '../../../shared/lib/currencyFormatter';

interface LevelReportItem {
  cycle: string;
  level: string;
  studentsCount: number;
  totalDue: number;
  totalCollected: number;
  remainingBalance: number;
  recoveryRate: number;
  status: 'optimal' | 'good' | 'action_needed';
}

export const ReportsAnalyticsView: React.FC = () => {
  const { i18n } = useTranslation(['common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  // Filter States
  const [selectedYear, setSelectedYear] = useState('2026/2027');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('annual');

  // Sample Audit Analytics Data
  const reportData: LevelReportItem[] = [
    { cycle: 'التعليم الأولي', level: 'روض أول (PS)', studentsCount: 14, totalDue: 30950, totalCollected: 26300, remainingBalance: 4650, recoveryRate: 85.0, status: 'optimal' },
    { cycle: 'التعليم الأولي', level: 'روض ثان (MS)', studentsCount: 16, totalDue: 37650, totalCollected: 31200, remainingBalance: 6450, recoveryRate: 82.8, status: 'optimal' },
    { cycle: 'التعليم الأولي', level: 'تمهيدي كبار (GS)', studentsCount: 22, totalDue: 53850, totalCollected: 42000, remainingBalance: 11850, recoveryRate: 78.0, status: 'good' },
    { cycle: 'التعليم الابتدائي', level: 'الأول ابتدائي (CP)', studentsCount: 26, totalDue: 69100, totalCollected: 51800, remainingBalance: 17300, recoveryRate: 75.0, status: 'good' },
    { cycle: 'التعليم الابتدائي', level: 'الثاني ابتدائي (CE1)', studentsCount: 24, totalDue: 65350, totalCollected: 46400, remainingBalance: 18950, recoveryRate: 71.0, status: 'good' },
    { cycle: 'التعليم الابتدائي', level: 'الثالث ابتدائي (CE2)', studentsCount: 25, totalDue: 69600, totalCollected: 47300, remainingBalance: 22300, recoveryRate: 68.0, status: 'good' },
    { cycle: 'التعليم الابتدائي', level: 'الرابع ابتدائي (CM1)', studentsCount: 23, totalDue: 64650, totalCollected: 42000, remainingBalance: 22650, recoveryRate: 65.0, status: 'action_needed' },
    { cycle: 'التعليم الابتدائي', level: 'الخامس ابتدائي (CM2)', studentsCount: 22, totalDue: 62650, totalCollected: 39500, remainingBalance: 23150, recoveryRate: 63.0, status: 'action_needed' },
    { cycle: 'التعليم الابتدائي', level: 'السادس ابتدائي (CE6)', studentsCount: 24, totalDue: 71350, totalCollected: 49900, remainingBalance: 21450, recoveryRate: 70.0, status: 'good' },
    { cycle: 'التعليم الإعدادي', level: 'الأولى إعدادي (1AC)', studentsCount: 20, totalDue: 61300, totalCollected: 35500, remainingBalance: 25800, recoveryRate: 57.9, status: 'action_needed' },
    { cycle: 'التعليم الإعدادي', level: 'الثانية إعدادي (2AC)', studentsCount: 18, totalDue: 57350, totalCollected: 31000, remainingBalance: 26350, recoveryRate: 54.0, status: 'action_needed' },
    { cycle: 'التعليم الإعدادي', level: 'الثالثة إعدادي (3AC)', studentsCount: 19, totalDue: 62700, totalCollected: 33800, remainingBalance: 28900, recoveryRate: 53.9, status: 'action_needed' }
  ];

  // Filtered rows
  const filteredData = useMemo(() => {
    return reportData.filter((item) => {
      if (selectedCycle !== 'all' && item.cycle !== selectedCycle) return false;
      return true;
    });
  }, [selectedCycle]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const due = filteredData.reduce((acc, cur) => acc + cur.totalDue, 0);
    const collected = filteredData.reduce((acc, cur) => acc + cur.totalCollected, 0);
    const balance = filteredData.reduce((acc, cur) => acc + cur.remainingBalance, 0);
    const students = filteredData.reduce((acc, cur) => acc + cur.studentsCount, 0);
    const rate = due > 0 ? (collected / due) * 100 : 0;
    return { due, collected, balance, students, rate };
  }, [filteredData]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = isRtl
      ? ['السلك التعليمي', 'المستوى', 'عدد التلاميذ', 'إجمالي المستحق (MAD)', 'المحصل فعلياً (MAD)', 'المتبقي (MAD)', 'نسبة التحصيل (%)']
      : ['Cycle', 'Niveau', 'Élèves', 'Total Dû (MAD)', 'Encaissé (MAD)', 'Solde (MAD)', 'Taux (%)'];

    const rows = filteredData.map((d) => [
      d.cycle,
      d.level,
      d.studentsCount,
      d.totalDue,
      d.totalCollected,
      d.remainingBalance,
      d.recoveryRate.toFixed(1)
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rapport_Financier_ArouaAudit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export / Print to PDF Function
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Page Header Card */}
      <div className="page-header-card print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'مركز الإحصائيات والتقارير المالية والتحليلية' : 'Centre de Rapports & Analyses Financières'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-mono">
                AUDIT V2.6
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {isRtl
                ? 'تحليل التدفق النقدي الصافي، تفكيك مساهمات الخدمات، وتوليد الكشوفات المحاسبية المعتمدة لمجموعة مدارس أروى'
                : 'Analyse du cash-flow net, contribution des services annexes et états comptables officiels'}
            </p>
          </div>
        </div>

        {/* Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Print / PDF Button */}
          <button
            onClick={handlePrintPDF}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'تصدير تقرير رسمي (PDF / طباعة)' : 'Imprimer / Exporter PDF'}</span>
          </button>

          {/* Excel / CSV Button */}
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'تصدير البيانات (Excel / CSV)' : 'Exporter CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Control & Filtering Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
        {/* Left Side: Filter Selects */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">
              {isRtl ? 'السنة الدراسية:' : 'Année Scolaire :'}
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="2026/2027">2026 / 2027</option>
              <option value="2025/2026">2025 / 2026</option>
            </select>
          </div>

          {/* Educational Cycle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">
              {isRtl ? 'السلك التعليمي:' : 'Cycle :'}
            </span>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">{isRtl ? 'كافة الأسلاك التعليمية' : 'Tous les cycles'}</option>
              <option value="التعليم الأولي">{isRtl ? 'التعليم الأولي (Maternelle)' : 'Maternelle'}</option>
              <option value="التعليم الابتدائي">{isRtl ? 'التعليم الابتدائي (Primaire)' : 'Primaire'}</option>
              <option value="التعليم الإعدادي">{isRtl ? 'التعليم الإعدادي (Collège)' : 'Collège'}</option>
            </select>
          </div>
        </div>

        {/* Right Side: Period Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'monthly', label: isRtl ? 'شهري' : 'Mensuel' },
            { id: 'quarterly', label: isRtl ? 'فصلي' : 'Trimestriel' },
            { id: 'annual', label: isRtl ? 'سنوي شامل' : 'Annuel Global' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Three Core Visual Panels (Pure Stitch Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Net Cash Flow (صافي التدفق المالي والسيولة) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isRtl ? '1. تقرير التدفق المالي والسيولة الصافية' : '1. Net Cash Flow & Marge'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {/* Total Revenue */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {isRtl ? 'إجمالي المداخيل والمقبوضات:' : 'Total Recettes :'}
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {formatMAD(totals.due)}
                </span>
              </div>

              {/* Total Operating Costs & Payroll */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {isRtl ? 'مصاريف التسيير والأجور:' : 'Charges & Masse Salariale :'}
                </span>
                <span className="text-sm font-black font-mono text-rose-600">
                  - 412.000,00 MAD
                </span>
              </div>

              {/* Net Surplus */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900">
                    {isRtl ? 'فائض السيولة التشغيلي الصافي:' : 'Excédent Net d’Exploitation :'}
                  </span>
                  <span className="text-base font-black font-mono text-emerald-800">
                    + 236.500,00 MAD
                  </span>
                </div>
                <div className="w-full bg-emerald-200/60 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '36.5%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-emerald-700 font-bold mt-1">
                  <span>{isRtl ? 'هامش الربحية الصافي' : 'Marge nette'}</span>
                  <span>36.5%</span>
                </div>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 mt-4 block font-medium">
            {isRtl ? 'مستخلص من قيود الصندوق ومسير الرواتب المعتمد' : 'Basé sur le journal de caisse et la paie'}
          </span>
        </div>

        {/* Panel 2: Auxiliary Services Contribution Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isRtl ? '2. تفكيك نسب مساهمة الخدمات' : '2. Répartition par Activité'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 mt-3">
              {/* Tuition (72%) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    {isRtl ? 'التمدرس والواجبات المدرسية' : 'Scolarité'}
                  </span>
                  <span className="font-mono text-slate-900">72.0%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '72%' }} />
                </div>
              </div>

              {/* Transport (14%) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-amber-600" />
                    {isRtl ? 'أسطول النقل المدرسي' : 'Transport'}
                  </span>
                  <span className="font-mono text-slate-900">14.0%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '14%' }} />
                </div>
              </div>

              {/* Canteen (10%) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-sky-600" />
                    {isRtl ? 'المطعم ونصف الإقامة' : 'Restauration'}
                  </span>
                  <span className="font-mono text-slate-900">10.0%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>

              {/* Supplies (4%) */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    {isRtl ? 'اللوازم والمحفظة والكتب' : 'Fournitures'}
                  </span>
                  <span className="font-mono text-slate-900">4.0%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 mt-4 block font-medium">
            {isRtl ? 'توزيع نسبي لحصص المداخيل حسب مصادر الرسوم' : 'Part contributive de chaque pôle d’activité'}
          </span>
        </div>

        {/* Panel 3: Recovery Rate & Debt Recoupment */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isRtl ? '3. نسبة التحصيل واسترجاع الذمم' : '3. Taux de Recouvrement'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight">
                  {totals.rate.toFixed(1)}%
                </div>
                <span className="text-xs font-bold text-emerald-700 mt-1 block">
                  {isRtl ? 'المعدل العام لتحصيل الرسوم المدرسية' : 'Taux global de recouvrement'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRtl ? 'المقبوض الفعلي' : 'Encaissé'}
                </span>
                <span className="text-xs font-black font-mono text-emerald-700">
                  {formatMAD(totals.collected)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRtl ? 'الذمم العالقة' : 'Reste à recouvrer'}
                </span>
                <span className="text-xs font-black font-mono text-amber-600">
                  {formatMAD(totals.balance)}
                </span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 mt-3 block font-medium">
            {isRtl ? 'مؤشر كفاءة الجباية والمتابعة المحاسبية' : 'Indicateur de performance de recouvrement'}
          </span>
        </div>
      </div>

      {/* 4. Detailed Multi-Level Financial Breakdown Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header Section */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isRtl ? 'الكشف التفصيلي للرسوم والتحصيل حسب المستويات التعليمية' : 'Tableau Récapitulatif par Niveau Scolaire'}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {isRtl ? 'تحليل مقارن لمطابقة الموازنة التقديرية مع المداخيل المستخلصة' : 'Comparatif prévisions budgétaires vs réalisations effectives'}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto font-mono">
            {totals.students} {isRtl ? 'تلميذاً مسجلاً' : 'élèves inscrits'}
          </div>
        </div>

        {/* Table Container strictly bounded */}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-start">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 text-start">{isRtl ? 'السلك والمستوى' : 'Cycle & Niveau'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'عدد التلاميذ' : 'Effectif'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'إجمالي المستحق' : 'Total Dû'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'المستخلص الفعلي' : 'Encaissé'}</th>
                <th className="py-3.5 px-4 text-start">{isRtl ? 'المتبقي (الذمة)' : 'Solde Débiteur'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'نسبة التحصيل' : 'Taux'}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? 'الحالة الرقابية' : 'Statut'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  {/* Cycle & Level */}
                  <td className="py-3 px-4 text-start whitespace-nowrap">
                    <span className="font-bold text-slate-900 block text-xs">{item.level}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{item.cycle}</span>
                  </td>

                  {/* Students Count */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                    {item.studentsCount}
                  </td>

                  {/* Total Due */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-start">
                    {formatMAD(item.totalDue)}
                  </td>

                  {/* Collected */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap text-start">
                    {formatMAD(item.totalCollected)}
                  </td>

                  {/* Remaining Balance */}
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 whitespace-nowrap text-start">
                    {formatMAD(item.remainingBalance)}
                  </td>

                  {/* Recovery Rate */}
                  <td className="py-3 px-4 text-center whitespace-nowrap font-mono font-black">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        item.recoveryRate >= 80
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : item.recoveryRate >= 65
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.recoveryRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.status === 'optimal' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'ممتاز' : 'Optimal'}</span>
                      </span>
                    ) : item.status === 'good' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'جيد' : 'Bon'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'يحتاج متابعة' : 'À suivre'}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer with Summary Totals */}
            <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-xs">
              <tr>
                <td className="py-3.5 px-4 text-start font-black text-slate-900">
                  {isRtl ? 'المجموع الإجمالي العام:' : 'TOTAL GÉNÉRAL :'}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900">
                  {totals.students}
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-start">
                  {formatMAD(totals.due)}
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-start">
                  {formatMAD(totals.collected)}
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-amber-600 text-start">
                  {formatMAD(totals.balance)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900">
                  {totals.rate.toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                    {isRtl ? 'مطابق رقابياً' : 'Vérifié'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalyticsView;
