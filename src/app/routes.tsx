import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '../features/system-security/components/ProtectedRoute';

// 0. Auth View
const LoginView = lazy(() =>
  import('../features/auth/views/LoginView').then((m) => ({ default: m.LoginView }))
);
// Workspace View
const TasksNotesView = lazy(() =>
  import('../features/tasks-notes/views/TasksNotesView').then((m) => ({ default: m.TasksNotesView }))
);

// Lazy-loaded Views
const StudentEnrollmentView = lazy(() =>
  import('../features/student-enrollment/views/StudentEnrollmentView').then((m) => ({ default: m.StudentEnrollmentView }))
);
const TreasuryCaisseView = lazy(() =>
  import('../features/treasury-caisse/views/TreasuryCaisseView').then((m) => ({ default: m.TreasuryCaisseView }))
);
const BankAccountsView = lazy(() =>
  import('../features/checks-management/views/BankAccountsView').then((m) => ({ default: m.BankAccountsView }))
);
const ChecksPortfolioView = lazy(() =>
  import('../features/checks-management/views/ChecksPortfolioView').then((m) => ({ default: m.ChecksPortfolioView }))
);
const ChecksToDepositView = lazy(() =>
  import('../features/checks-management/views/ChecksToDepositView').then((m) => ({ default: m.ChecksToDepositView }))
);
const DeliverySlipsView = lazy(() =>
  import('../features/checks-management/views/DeliverySlipsView').then((m) => ({ default: m.DeliverySlipsView }))
);
const ReceiptsRegistryView = lazy(() =>
  import('../features/checks-management/views/ReceiptsRegistryView').then((m) => ({ default: m.ReceiptsRegistryView }))
);
const BankInvoicesView = lazy(() =>
  import('../features/checks-management/views/BankInvoicesView').then((m) => ({ default: m.BankInvoicesView }))
);
const MonthlyCAView = lazy(() =>
  import('../features/revenue-analytics/views/MonthlyCAView').then((m) => ({ default: m.MonthlyCAView }))
);
const AnnualCAView = lazy(() =>
  import('../features/revenue-analytics/views/AnnualCAView').then((m) => ({ default: m.AnnualCAView }))
);
const AgentDailyRecettesView = lazy(() =>
  import('../features/revenue-analytics/views/AgentDailyRecettesView').then((m) => ({ default: m.AgentDailyRecettesView }))
);
const AdminDailyRecettesView = lazy(() =>
  import('../features/revenue-analytics/views/AdminDailyRecettesView').then((m) => ({ default: m.AdminDailyRecettesView }))
);
const GlobalRecettesView = lazy(() =>
  import('../features/revenue-analytics/views/GlobalRecettesView').then((m) => ({ default: m.GlobalRecettesView }))
);
const CateringStatsView = lazy(() =>
  import('../features/revenue-analytics/views/CateringStatsView').then((m) => ({ default: m.CateringStatsView }))
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

// 5. Listes Finance Views (Stage 6)
const CreditBalancesView = lazy(() =>
  import('../features/finance-operations/views/CreditBalancesView').then((m) => ({ default: m.CreditBalancesView }))
);
const DiscountsView = lazy(() =>
  import('../features/finance-operations/views/DiscountsView').then((m) => ({ default: m.DiscountsView }))
);
const ExemptionsView = lazy(() =>
  import('../features/finance-operations/views/ExemptionsView').then((m) => ({ default: m.ExemptionsView }))
);
const ImpayesView = lazy(() =>
  import('../features/finance-operations/views/ImpayesView').then((m) => ({ default: m.ImpayesView }))
);
const PaymentsJournalView = lazy(() =>
  import('../features/finance-operations/views/PaymentsJournalView').then((m) => ({ default: m.PaymentsJournalView }))
);

// 6. Dépenses Views (Stage 7)
const ExpenseCategoriesView = lazy(() =>
  import('../features/expenses/views/ExpenseCategoriesView').then((m) => ({ default: m.ExpenseCategoriesView }))
);
const ExpensesListView = lazy(() =>
  import('../features/expenses/views/ExpensesListView').then((m) => ({ default: m.ExpensesListView }))
);
const ExpenseMonthlyStatsView = lazy(() =>
  import('../features/expenses/views/ExpenseMonthlyStatsView').then((m) => ({ default: m.ExpenseMonthlyStatsView }))
);
const DisbursementsRegisterView = lazy(() =>
  import('../features/expenses/views/DisbursementsRegisterView').then((m) => ({ default: m.DisbursementsRegisterView }))
);

// 7. Services Views (Stage 8)
const TransportConfigView = lazy(() =>
  import('../features/services-config/views/TransportConfigView').then((m) => ({ default: m.TransportConfigView }))
);
const CanteenConfigView = lazy(() =>
  import('../features/services-config/views/CanteenConfigView').then((m) => ({ default: m.CanteenConfigView }))
);
const SuppliesConfigView = lazy(() =>
  import('../features/services-config/views/SuppliesConfigView').then((m) => ({ default: m.SuppliesConfigView }))
);

// 8. Security & RBAC Views (Stage 9)
const UsersPermissionsView = lazy(() =>
  import('../features/system-security/views/UsersPermissionsView').then((m) => ({ default: m.UsersPermissionsView }))
);
const AuditTrailView = lazy(() =>
  import('../features/system-security/views/AuditTrailView').then((m) => ({ default: m.AuditTrailView }))
);

const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-emerald-600 gap-3">
    <Loader2 className="w-8 h-8 animate-spin" />
    <span className="text-xs font-mono text-slate-400">جاري تحميل البيانات المحاسبية...</span>
  </div>
);

export const router = createBrowserRouter([
  // Full-screen Corporate Login
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginView />
      </Suspense>
    ),
  },

  // Authenticated Main Application
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/hr/enrolled-students" replace />,
      },
      // 0. Workspace: Tasks & Notes
      {
        path: 'workspace/tasks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TasksNotesView />
          </Suspense>
        ),
      },
      // 1. Settings & Security
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
            <ProtectedRoute requiredPermission="system.settings">
              <TarifsPricingGridView />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'settings/users-permissions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProtectedRoute requiredPermission="security.users">
              <UsersPermissionsView />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'settings/audit-trail',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProtectedRoute requiredPermission="security.audit">
              <AuditTrailView />
            </ProtectedRoute>
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
            <ProtectedRoute requiredPermission="payroll.execute">
              <PayrollDashboardView />
            </ProtectedRoute>
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
            <MonthlyCAView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/annual-ca',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnnualCAView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/regisseurs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AgentDailyRecettesView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/administration',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDailyRecettesView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/global-recettes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <GlobalRecettesView />
          </Suspense>
        ),
      },
      {
        path: 'revenue/catering-stats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CateringStatsView />
          </Suspense>
        ),
      },

      // 4. Comptes & Chèques
      {
        path: 'checks/accounts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BankAccountsView />
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
            <DeliverySlipsView />
          </Suspense>
        ),
      },
      {
        path: 'checks/receipts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReceiptsRegistryView />
          </Suspense>
        ),
      },
      {
        path: 'checks/deposited',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ChecksToDepositView />
          </Suspense>
        ),
      },
      {
        path: 'checks/invoices',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BankInvoicesView />
          </Suspense>
        ),
      },

      // 5. Listes Finance (Stage 6)
      {
        path: 'finance/credit-balances',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreditBalancesView />
          </Suspense>
        ),
      },
      {
        path: 'finance/discounts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DiscountsView />
          </Suspense>
        ),
      },
      {
        path: 'finance/exemptions',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExemptionsView />
          </Suspense>
        ),
      },
      {
        path: 'finance/payments-journal',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentsJournalView />
          </Suspense>
        ),
      },
      {
        path: 'finance/impayes',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProtectedRoute requiredPermission="impayes.manage">
              <ImpayesView />
            </ProtectedRoute>
          </Suspense>
        ),
      },

      // 6. Dépenses (Stage 7)
      {
        path: 'expenses/categories',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpenseCategoriesView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/list',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesListView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/monthly-stats',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpenseMonthlyStatsView />
          </Suspense>
        ),
      },
      {
        path: 'expenses/register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProtectedRoute requiredPermission="expenses.manage">
              <DisbursementsRegisterView />
            </ProtectedRoute>
          </Suspense>
        ),
      },

      // 7. Services (Stage 8 - Dedicated Views)
      {
        path: 'services/transport',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TransportConfigView />
          </Suspense>
        ),
      },
      {
        path: 'services/canteen',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CanteenConfigView />
          </Suspense>
        ),
      },
      {
        path: 'services/supplies',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SuppliesConfigView />
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

