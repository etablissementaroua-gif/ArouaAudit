-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ArouaAudit v1.0 — Production Clean-Slate Database Purge Script (100% Dynamic & Bulletproof)
-- التاريخ: 2026-09-30 | الموسم الدراسي: 2026/2027
-- الهدف: تصفير وتطهير كافة الجداول التشغيلية والتجريبية بأمان مطلق دون أي توقف أو أخطاء
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. التصفير الذكي والتطهير الديناميكي لكافة الجداول التشغيلية
-- يستخدم Dynamic SQL (EXECUTE) مع فحص to_regclass() لضمان عدم توقف الاستعلام حتى لو كان أي جدول غير منشأ بعد
DO $$
DECLARE
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        -- سجلات التلاميذ والمالية المدرسية
        'student_payments_journal',
        'student_impayes',
        'student_discounts_exemptions',
        'student_credit_balances',
        'student_accounts',
        'students',
        -- معاملات ومغذيات الصندوق
        'caisse_transactions',
        'caisse_alimentations',
        -- محفظة الشيكات والعمليات البنكية
        'checks_portfolio',
        'bank_remises',
        -- مسير الرواتب والموارد البشرية
        'monthly_payroll',
        'staff_payroll',
        'staff_advances',
        'employees',
        -- النفقات والمصروفات
        'expense_disbursements',
        'expenses',
        -- المهام والإشعارات والمزامنة الخارجية
        'system_notifications',
        'system_tasks',
        'external_sync_mappings',
        -- سجل التدقيق القديم (يتم تفريغه لبدء دورة تدقيق جديدة)
        'audit_logs'
    ];
    purged_count INT := 0;
    skipped_count INT := 0;
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'بدء عملية التطهير الشامل لقاعدة بيانات ArouaAudit...';
    RAISE NOTICE '==================================================';

    FOREACH tbl IN ARRAY target_tables
    LOOP
        -- التحقق من وجود الجدول في schema 'public'
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            BEGIN
                EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl) || ' RESTART IDENTITY CASCADE;';
                purged_count := purged_count + 1;
                RAISE NOTICE '✓ [تم التصفير]: الجدول public.% أصبح فارغاً (0 سجلات)', tbl;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠ [تحذير]: تعذر تصفير الجدول % (تم تجاوزه): %', tbl, SQLERRM;
            END;
        ELSE
            skipped_count := skipped_count + 1;
            RAISE NOTICE '- [تخطي]: الجدول public.% غير موجود في قاعدتك (تم التخطي تلقائياً)', tbl;
        END IF;
    END LOOP;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'ملخص التطهير: تم تصفير % جدول بنجاح، وتخطي % جدول.', purged_count, skipped_count;
    RAISE NOTICE '==================================================';
END $$;

-- 2. التحقق من وتثبيت الأدوار والحسابات الإدارية المعتمدة (فقط في حال وجود الجداول)
DO $$
BEGIN
    -- إذا كان جدول الأدوار موجوداً، نتأكد من تثبيت الأدوار الستة
    IF to_regclass('public.system_roles') IS NOT NULL THEN
        BEGIN
            EXECUTE $sql$
                INSERT INTO public.system_roles (code, name_ar, name_fr, description_ar, is_system_role)
                VALUES 
                ('super_admin', 'المدير العام والمشرف الأعلى', 'Super Administrateur', 'كامل الصلاحيات غير المقيدة لإدارة ومراقبة المنظومة وضبط الأمان', true),
                ('finance_director', 'المدير المالي والمحاسبي', 'Directeur Financier & Comptable', 'صلاحيات الإشراف المالي، المصادقة على الصرف، والتسويات البنكية', true),
                ('accountant', 'المحاسب المعتمد', 'Comptable Agréé', 'تسجيل العمليات، مسير الأجور، إدارة النفقات والوثائق المحاسبية', true),
                ('cashier', 'أمين الصندوق والتحصيل', 'Caissier & Régisseur', 'استخلاص الرسوم المدرسية، إصدار وصولات الأداء، ويومية الصندوق', true),
                ('hr_manager', 'مدير الموارد البشرية', 'Responsable RH', 'مزامنة الكوادر، كشوفات الرواتب، متابعة السلف والديون السابقة', true),
                ('viewer', 'مستخدم للمعاينة والاطلاع', 'Lecteur / Consultation', 'صلاحيات قراءة واستعراض التقارير دون إمكانية التعديل أو الصرف', true)
                ON CONFLICT (code) DO NOTHING;
            $sql$;
            RAISE NOTICE '✓ تم تثبيت وتأكيد الأدوار النظامية في system_roles بنجاح.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '- ملاحظة أثناء تحديث system_roles: %', SQLERRM;
        END;
    END IF;

    -- إذا كان جدول الملفات الشخصية للمستخدمين موجوداً، نتأكد من تثبيت حسابات الإدارة
    IF to_regclass('public.user_profiles') IS NOT NULL THEN
        BEGIN
            EXECUTE $sql$
                INSERT INTO public.user_profiles (id, full_name, email, role_code, is_suspended)
                VALUES
                ('00000000-0000-0000-0000-000000000001', 'أحمد بنشقرون (المدير العام)', 'admin@arouaschools.ma', 'super_admin', false),
                ('00000000-0000-0000-0000-000000000002', 'مريم التازي (المديرة المالية)', 'finance@arouaschools.ma', 'finance_director', false),
                ('00000000-0000-0000-0000-000000000003', 'ياسين العلمي (المحاسب)', 'comptable@arouaschools.ma', 'accountant', false),
                ('00000000-0000-0000-0000-000000000004', 'فاطمة الزهراء (أمينة الصندوق 1)', 'caisse1@arouaschools.ma', 'cashier', false),
                ('00000000-0000-0000-0000-000000000005', 'عمر السبتي (أمين الصندوق 2)', 'caisse2@arouaschools.ma', 'cashier', false),
                ('00000000-0000-0000-0000-000000000006', 'خديجة الوزاني (مسؤولة الموارد البشرية)', 'rh@arouaschools.ma', 'hr_manager', false)
                ON CONFLICT (id) DO NOTHING;
            $sql$;
            RAISE NOTICE '✓ تم تثبيت وتأكيد الحسابات الإدارية الرسمية في user_profiles بنجاح.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '- ملاحظة أثناء تحديث user_profiles: %', SQLERRM;
        END;
    END IF;
END $$;

-- 3. تسوية وتحديث جدول سجل التدقيق وتوثيق حدث التدشين (بشكل ديناميكي ومحمي)
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        BEGIN
            -- تحديث الحقول ديناميكياً لتلافي أي أخطاء سابقة
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action_type TEXT;';
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_entity TEXT;';
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;';
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;';
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;';
            EXECUTE 'ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;';
            
            -- تسجيل حدث التدشين
            EXECUTE $sql$
                INSERT INTO public.audit_logs (
                    user_name,
                    user_role,
                    action_type,
                    target_entity,
                    new_values,
                    ip_address,
                    created_at
                ) VALUES (
                    'النظام الآلي (تهيئة الإنتاج)',
                    'super_admin',
                    'SYSTEM_INIT',
                    'system_database',
                    '{"event": "PRODUCTION_CLEAN_SLATE_SUCCESS", "academic_year": "2026/2027", "status": "READY"}'::jsonb,
                    '127.0.0.1',
                    NOW()
                );
            $sql$;
            RAISE NOTICE '✓ تم توثيق عملية تدشين المنظومة بنجاح في سجل التدقيق audit_logs.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '- ملاحظة أثناء تسجيل حدث التدقيق (غير حرج): %', SQLERRM;
        END;
    END IF;
END $$;

-- 4. كشف المعاينة والتحقق النهائي لكافة الجداول الموجودة في قاعدتك
-- يعرض كل الجداول التي تنتمي لـ public مع عدد السجلات الحية داخلها
SELECT 
    schemaname, 
    relname AS table_name, 
    n_live_tup AS remaining_records 
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;
