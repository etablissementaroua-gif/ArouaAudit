import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded Views
const StudentEnrollmentView = lazy(() =>
  import('../features/student-enrollment/views/StudentEnrollmentView').then((m) => ({ default: m.StudentEnrollmentView }))
);
const TreasuryCaisseView = lazy(() =>
  import('../features/treasury-caisse/views/TreasuryCaisseView').then((m) => ({ default: m.TreasuryCaisseView }))
);
const ChecksPortfolioView = lazy(() =>
  import('../features/checks-management/views/ChecksPortfolioView').then((m) => ({ default: m.ChecksPortfolioView }))
);
const PayrollView = lazy(() =>
  import('../features/payroll-hr/views/PayrollView').then((m) => ({ default: m.PayrollView }))
);
const RevenueAnalyticsView = lazy(() =>
  import('../features/revenue-analytics/views/RevenueAnalyticsView').then((m) => ({ default: m.RevenueAnalyticsView }))
);
const SystemSettingsView = lazy(() =>
  import('../features/system-settings/views/SystemSettingsView').then((m) => ({ default: m.SystemSettingsView }))
);
const AcademicYearsView = lazy(() =>
  import('../features/system-settings/views/AcademicYearsView').then((m) => ({ default: m.AcademicYearsView }))
);
const LevelsAndGroupsView = lazy(() =>
  import('../features/system-settings/views/LevelsAndGroupsView').then((m) => ({ default: m.LevelsAndGroupsView }))
);
const TarifsPricingGridView = lazy(() =>
  import('../features/system-settings/views/TarifsPricingGridView').then((m) => ({ default: m.TarifsPricingGridView }))
);
const ApprovedStaffSyncView = lazy(() =>
  import('../features/payroll-hr/views/ApprovedStaffSyncView').then((m) => ({ default: m.ApprovedStaffSyncView }))
);
const PayrollDashboardView = lazy(() =>
  import('../features/payroll-hr/views/PayrollDashboardView').then((m) => ({ default: m.PayrollDashboardView }))
);
const StaffDebtsView = lazy(() =>
  import('../features/payroll-hr/views/StaffDebtsView').then((m) => ({ default: m.StaffDebtsView }))
);
const FinanceOperationsView = lazy(() =>
  import('../features/finance-operations/views/FinanceOperationsView').then((m) => ({ default: m.FinanceOperationsView }))
);
const ExpensesView = lazy(() =>
  import('../features/expenses/views/ExpensesView').then((m) => ({ default: m.ExpensesView }))
);
const ServicesConfigView = lazy(() =>
  import('../features/services-config/views/ServicesConfigView').then((m) => ({ default: m.ServicesConfigView }))
);

const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-indigo-400 gap-3">
    <Loader2 className="w-8 h-8 animate-spin" />
    <span className="text-xs font-mono text-slate-400">جاري تحميل البيانات المحاسبية...</span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/hr/enrolled-students" replace />,
      },
      // 1. Settings
      {
        path: 'settings/academic-years',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AcademicYearsView />
          </Suspense>
        ),
      },
      {
        path: 'settings/cycles',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LevelsAndGroupsView />
          </Suspense>
        ),
      },
      {
        path: 'settings/levels-groups',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LevelsAndGroupsView />
          </Suspense>
        ),
      },
      {
        path: 'settings/pricing-grid',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TarifsPricingGridView />
          </Suspense>
        ),
      },

      // 2. RH & Mappage
      {
        path: 'hr/mapped-staff',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ApprovedStaffSyncView />
          </Suspense>
        ),
      },
      {
        path: 'hr/enrolled-students',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StudentEnrollmentView />
          </Suspense>
        ),
      },
      {
        path: 'hr/payroll',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PayrollDashboardView />
          </Suspense>
        ),
      },
      {
        path: 'hr/staff-debts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <StaffDebtsView />
          </Suspense>
        ),
      },

      // 3. CA & Recettes
      {
        path: 'revenue/monthly-ca',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RevenueAnalyticsView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/annual-ca',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RevenueAnalyticsView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/regisseurs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TreasuryCaisseView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/administration',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TreasuryCaisseView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/global-recettes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RevenueAnalyticsView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/catering-stats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServicesConfigView />
          </Suspense>
        ),
      },

      // 4. Comptes & Chèques
      {
        path: 'checks/accounts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TreasuryCaisseView />
          </Suspense>
        ),
      },
      {
        path: 'checks/portfolio',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecksPortfolioView />
          </Suspense>
        ),
      },
      {
        path: 'checks/delivery-slips',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecksPortfolioView />
          </Suspense>
        ),
      },
      {
        path: 'checks/receipts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TreasuryCaisseView />
          </Suspense>
        ),
      },
      {
        path: 'checks/deposited',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecksPortfolioView />
          </Suspense>
        ),
      },
      {
        path: 'checks/invoices',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecksPortfolioView />
          </Suspense>
        ),
      },

      // 5. Listes Finance
      {
        path: 'finance/credit-balances',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FinanceOperationsView />
          </Suspense>
        ),
      },
      {
        path: 'finance/discounts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FinanceOperationsView />
          </Suspense>
        ),
      },
      {
        path: 'finance/exemptions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FinanceOperationsView />
          </Suspense>
        ),
      },
      {
        path: 'finance/payments-journal',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TreasuryCaisseView />
          </Suspense>
        ),
      },
      {
        path: 'finance/impayes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FinanceOperationsView />
          </Suspense>
        ),
      },

      // 6. Dépenses
      {
        path: 'expenses/categories',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/list',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/monthly-stats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesView />
          </Suspense>
        ),
      },

      // 7. Services
      {
        path: 'services/transport',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServicesConfigView />
          </Suspense>
        ),
      },
      {
        path: 'services/canteen',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServicesConfigView />
          </Suspense>
        ),
      },
      {
        path: 'services/supplies',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ServicesConfigView />
          </Suspense>
        ),
      },

      // Catch-all
      {
        path: '*',
        element: <Navigate to="/hr/enrolled-students" replace />,
      },
    ],
  },
]);
