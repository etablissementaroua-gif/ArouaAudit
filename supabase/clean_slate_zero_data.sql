-- =========================================================================
-- AROUAAUDIT — MASTER DATABASE CLEAN-SLATE RESET (100% ZERO-DATA)
-- =========================================================================
-- Description:
-- Truncates all 25 operational/transactional and seed tables with CASCADE,
-- clears all dummy budget allocations, groups, and mock fee schedules,
-- leaving a 100% clean-slate production database ready for fresh real-world operations.
-- =========================================================================

-- 1. تفريغ الجداول التشغيلية والمعاملات والبيانات الوهمية بالكامل (CASCADE)
TRUNCATE TABLE 
    public.student_payments_journal,
    public.student_impayes,
    public.student_discounts_exemptions,
    public.student_credit_balances,
    public.student_accounts,
    public.students,
    public.monthly_payroll,
    public.staff_advances,
    public.staff_payroll,
    public.employees,
    public.checks_portfolio,
    public.bank_remises,
    public.bank_accounts,
    public.caisse_transactions,
    public.caisse_alimentations,
    public.expense_disbursements,
    public.expenses,
    public.transport_lines,
    public.canteen_plans,
    public.supplies_packs,
    public.system_tasks,
    public.system_notifications,
    public.audit_logs,
    public.external_sync_mappings,
    public.user_profiles
CASCADE;

-- 2. تصفير مخصصات أبواب النفقات إلى 0.00 MAD
UPDATE public.expense_categories
SET budget_allocation = 0.00;

-- 3. تصفير جميع الأفواج في المستويات الدراسية لتصبح خالية تماماً (0 أفواج)
UPDATE public.academic_levels_classes
SET groups = '{}';

-- 4. تصفير كافة رسوم جدول الأسعار لجميع المستويات إلى 0.00 MAD
UPDATE public.level_tarifs
SET 
    tuition_monthly = 0.00,
    transport_monthly = 0.00,
    canteen_monthly = 0.00,
    supplies_fee = 0.00,
    registration_fee = 0.00,
    re_registration_fee = 0.00,
    supplies_checklist = '[]'::jsonb;

-- 5. تصفير رقم المعاملات التقديري للسنوات الدراسية إلى 0.00 MAD
UPDATE public.academic_years
SET target_annual_ca = 0.00;

-- 6. حذف السنوات الدراسية الأرشيفية والإبقاء على 2026/2027
DELETE FROM public.academic_years
WHERE code NOT IN ('2026/2027');
