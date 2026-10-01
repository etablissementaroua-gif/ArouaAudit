-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ArouaAudit v1.0 — Production Tarifs & Budget Targets Zero-Out Script
-- التاريخ: 2026-10-01 | الموسم الدراسي: 2026/2027
-- الهدف: تصفير كافة تسعيرات الرسوم والهدف المالي السنوي في Supabase للبدء النظيف
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. تصفير مصفوفة أسعار ورسوم كافة المستويات الدراسية
DO $$
BEGIN
    IF to_regclass('public.level_tarifs') IS NOT NULL THEN
        UPDATE public.level_tarifs 
        SET tuition_monthly = 0.00,
            transport_monthly = 0.00,
            canteen_monthly = 0.00,
            supplies_fee = 0.00,
            registration_fee = 0.00,
            re_registration_fee = 0.00,
            supplies_checklist = '[]'::jsonb;
        RAISE NOTICE '✓ تم تصفير كافة أسعار ورسوم المستويات الدراسية في level_tarifs بنجاح (0.00 MAD).';
    END IF;
END $$;

-- 2. تصفير الهدف المالي السنوي (Target CA) في السنوات الدراسية
DO $$
BEGIN
    IF to_regclass('public.academic_years') IS NOT NULL THEN
        -- تصفير الهدف السنوي لكافة السنوات
        UPDATE public.academic_years 
        SET target_annual_ca = 0.00;

        -- الإبقاء على السنة الحالية المعتمدة فقط (2026/2027) كنشطة وحذف السنوات التجريبية
        DELETE FROM public.academic_years WHERE code NOT IN ('2026/2027');

        RAISE NOTICE '✓ تم تصفير الهدف المالي السنوي وضبط السنة النشطة 2026/2027 بنجاح.';
    END IF;
END $$;

-- 3. تصفير تسعيرات خطوط النقل المدرسي والمطعم وحزم اللوازم (في حال وجودها)
DO $$
BEGIN
    IF to_regclass('public.transport_lines') IS NOT NULL THEN
        UPDATE public.transport_lines SET monthly_fee = 0.00;
        RAISE NOTICE '✓ تم تصفير تسعيرات خطوط النقل المدرسي.';
    END IF;

    IF to_regclass('public.canteen_plans') IS NOT NULL THEN
        UPDATE public.canteen_plans SET fee_amount = 0.00;
        RAISE NOTICE '✓ تم تصفير تسعيرات خطط المطعم المدرسي.';
    END IF;

    IF to_regclass('public.supplies_packs') IS NOT NULL THEN
        UPDATE public.supplies_packs 
        SET cost_price = 0.00, 
            selling_price = 0.00, 
            stock_available = 0, 
            stock_sold = 0;
        RAISE NOTICE '✓ تم تصفير تسعيرات ومخزون حزم اللوازم.';
    END IF;
END $$;

-- 4. تقرير التحقق والمعاينة
SELECT 
    level_code, 
    academic_year_code, 
    tuition_monthly, 
    registration_fee, 
    transport_monthly, 
    canteen_monthly 
FROM public.level_tarifs 
LIMIT 5;

SELECT 
    code, 
    is_current, 
    target_annual_ca 
FROM public.academic_years;
