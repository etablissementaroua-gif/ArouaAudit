import { useState } from 'react';
import { 
  Building2, 
  Wallet, 
  FileSpreadsheet, 
  CreditCard, 
  GraduationCap, 
  UserPlus, 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Flame
} from 'lucide-react';
import { TreasuryCaisseView } from './features/treasury-caisse/views/TreasuryCaisseView';
import { ChecksPortfolioView } from './features/checks-management/views/ChecksPortfolioView';
import { PayrollView } from './features/payroll-hr/views/PayrollView';
import { StudentEnrollmentView } from './features/student-enrollment/views/StudentEnrollmentView';
import { PreInscriptionView } from './features/pre-inscription/views/PreInscriptionView';
import { RevenueAnalyticsView } from './features/revenue-analytics/views/RevenueAnalyticsView';
import { ExternalSyncView } from './features/external-sync/views/ExternalSyncView';
import { isSupabaseConfigured } from './shared/lib/supabaseClient';
import { isFirebaseConfigured } from './shared/lib/firebaseClient';

type ActiveTab = 
  | 'caisse' 
  | 'checks' 
  | 'payroll' 
  | 'enrollment' 
  | 'pre-inscription' 
  | 'analytics' 
  | 'sync';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('caisse');
  const supabaseOnline = isSupabaseConfigured();
  const firebaseOnline = isFirebaseConfigured();

  const navigationItems = [
    { id: 'caisse', label: 'الخزينة والصندوق', icon: Wallet, badge: 'لحظي' },
    { id: 'checks', label: 'محفظة الشيكات', icon: FileSpreadsheet, badge: 'استحقاقات' },
    { id: 'payroll', label: 'الأجور والموارد البشرية', icon: CreditCard },
    { id: 'enrollment', label: 'التسجيل المالي للتلاميذ', icon: GraduationCap },
    { id: 'pre-inscription', label: 'التسجيل الأولي', icon: UserPlus },
    { id: 'analytics', label: 'التحليلات والمؤشرات', icon: BarChart3 },
    { id: 'sync', label: 'مركز المزامنة الخارجية', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Enterprise Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Platform Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Building2 className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white">ArouaAudit</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    V1.0 Sovereign
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">المنظومة المالية والمحاسبية المستقلة - مؤسسة أروى</p>
              </div>
            </div>

            {/* Cloud Engines & Telemetry Status */}
            <div className="hidden md:flex items-center gap-4 text-xs font-mono">
              {/* Supabase Engine Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Supabase:</span>
                <span className="text-emerald-400 font-bold">rkirvdigliimfxwugaol</span>
                <span className={`w-2 h-2 rounded-full ${supabaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>

              {/* Firebase Auth & Storage Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-400">Firebase:</span>
                <span className="text-amber-400 font-bold">arouaaudit</span>
                <span className={`w-2 h-2 rounded-full ${firebaseOnline ? 'bg-amber-500' : 'bg-slate-500'}`} />
              </div>

              {/* Security Shield */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800" title="قواعد الأمان RLS مفعلة بالكامل">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px]">RLS Strict</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900">
          <nav className="flex space-x-1 space-x-reverse overflow-x-auto py-2 scrollbar-none">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Feature View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'caisse' && <TreasuryCaisseView />}
        {activeTab === 'checks' && <ChecksPortfolioView />}
        {activeTab === 'payroll' && <PayrollView />}
        {activeTab === 'enrollment' && <StudentEnrollmentView />}
        {activeTab === 'pre-inscription' && <PreInscriptionView />}
        {activeTab === 'analytics' && <RevenueAnalyticsView />}
        {activeTab === 'sync' && <ExternalSyncView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>منظومة ArouaAudit المالية &copy; 2026 - مؤسسة أروى للتعليم المدرسي الخصوصي</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Branch: main</span>
            <span>Path: D:\Antigravity\ArouaAudit</span>
            <span className="text-emerald-500 font-semibold">CCP Architecture Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
