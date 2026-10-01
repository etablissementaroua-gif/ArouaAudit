-- =========================================================================
-- AROUAAUDIT — MASTER DATABASE CLEAN-SLATE RESET (100% FAIL-SAFE & ZERO-DATA)
-- =========================================================================
-- هذا السكريبت ذكي وآمن بنسبة 100%: يفحص كل جدول إن كان موجوداً في قاعدة البيانات
-- قبل مسحه، حتى لا يحدث أي خطأ (ERROR: relation does not exist)
-- =========================================================================

DO $$ 
DECLARE 
    tbl_name text;
    tables text[] := ARRAY[
        'student_payments_journal',
        'student_impayes',
        'student_discounts_exemptions',
        'student_credit_balances',
        'student_accounts',
        'students',
        'monthly_payroll',
        'staff_payroll',
        'staff_advances',
        'employees',
        'checks_portfolio',
        'bank_remises',
        'bank_accounts',
        'caisse_transactions',
        'caisse_alimentations',
        'expense_disbursements',
        'expenses',
        'transport_lines',
        'canteen_plans',
        'supplies_packs',
        'system_tasks',
        'system_notifications',
        'audit_logs',
        'external_sync_mappings',
        'user_profiles'
    ];
BEGIN 
    -- 1. تفريغ الجداول التشغيلية والتجريبية الموجودة (CASCADE)
    FOREACH tbl_name IN ARRAY tables LOOP 
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = tbl_name
        ) THEN 
            EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl_name) || ' CASCADE;'; 
            RAISE NOTICE 'تم مسح وتفريغ الجدول بنجاح: %', tbl_name;
        ELSE
            RAISE NOTICE 'الجدول غير موجود (تم تخطيه بأمان): %', tbl_name;
        END IF; 
    END LOOP; 

    -- 2. تصفير مخصصات أبواب النفقات إلى 0.00 MAD
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN 
        UPDATE public.expense_categories SET budget_allocation = 0.00; 
        RAISE NOTICE 'تم تصفير مخصصات أبواب النفقات';
    END IF; 

    -- 3. تصفير جميع الأفواج في المستويات لتصبح 0 أفواج
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_levels_classes') THEN 
        UPDATE public.academic_levels_classes SET groups = '{}'; 
        RAISE NOTICE 'تم تصفير أفواج المستويات الدراسية';
    END IF; 

    -- 4. تصفير كافة تسعيرات الرسوم إلى 0.00 MAD
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'level_tarifs') THEN 
        UPDATE public.level_tarifs 
        SET tuition_monthly = 0.00, 
            transport_monthly = 0.00, 
            canteen_monthly = 0.00, 
            supplies_fee = 0.00, 
            registration_fee = 0.00, 
            re_registration_fee = 0.00, 
            supplies_checklist = '[]'::jsonb; 
        RAISE NOTICE 'تم تصفير رسوم جدول الأسعار';
    END IF; 

    -- 5. تصفير رقم المعاملات التقديري للسنوات الدراسية إلى 0.00 MAD
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_years') THEN 
        UPDATE public.academic_years SET target_annual_ca = 0.00; 
        DELETE FROM public.academic_years WHERE code NOT IN ('2026/2027');
        RAISE NOTICE 'تم ضبط السنة الدراسية النشطة وتصفير هدفها المالي';
    END IF; 

END $$;
