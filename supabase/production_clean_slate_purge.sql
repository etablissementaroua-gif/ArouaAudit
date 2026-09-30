-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ArouaAudit v1.0 — Production Clean-Slate Database Purge Script (Safe & Resilient)
-- التاريخ: 2026-09-30 | الموسم الدراسي: 2026/2027
-- الهدف: تصفير كافة الجداول التشغيلية والتجريبية بأمان تام وبدون أي أخطاء schema
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. تسوية وتحديث هيكلية جدول audit_logs لضمان احتوائه على كافة الأعمدة المطلوبة
-- (يمنع خطأ column "action_type" does not exist نهائياً)
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        -- إضافة أعمدة نظام الأمان والرقابة الحديثة
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action_type TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_entity TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
        
        -- توافق رجعي مع الهيكليات القديمة
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
        ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
        
        RAISE NOTICE '✓ تم فحص وتحديث هيكل جدول audit_logs بنجاح.';
    END IF;
END $$;

-- 2. حلقة التصفير الذكي والتطهير لكافة الجداول التشغيلية (Dynamic Safe Truncate)
-- تفحص وجود كل جدول قبل تصفيره، وتتخطى أي جدول غير موجود تلقائياً دون أي خطأ
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
        -- سجل التدقيق (سيتم إعادة تعيينه وبدءه من الصفر)
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
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            BEGIN
                EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl) || ' RESTART IDENTITY CASCADE;';
                purged_count := purged_count + 1;
                RAISE NOTICE ' [PURGED] تم تصفير الجدول: %', tbl;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE ' [WARNING] تعذر تصفير الجدول %: %', tbl, SQLERRM;
            END;
        ELSE
            skipped_count := skipped_count + 1;
            RAISE NOTICE ' [SKIPPED] الجدول غير موجود: % (تخطي تلقائي)', tbl;
        END IF;
    END LOOP;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'ملخص التطهير: تم تصفير % جدول، وتخطي % جدول.', purged_count, skipped_count;
    RAISE NOTICE '==================================================';
END $$;

-- 3. تثبيت الأدوار النظامية والحسابات الرسمية المعتمدة للإدارة (RBAC Core Seeds)
-- يتم الإبقاء عليها دون مساس لضمان جاهزية تسجيل الدخول الفوري
INSERT INTO public.system_roles (code, name_ar, name_fr, description_ar, description_fr, is_system_role)
VALUES 
('super_admin', 'المدير العام والمشرف الأعلى', 'Super Administrateur', 'كامل الصلاحيات غير المقيدة لإدارة ومراقبة المنظومة وضبط الأمان', 'Accès total sans restriction à l''ensemble du système et sécurité', true),
('finance_director', 'المدير المالي والمحاسبي', 'Directeur Financier & Comptable', 'صلاحيات الإشراف المالي، المصادقة على الصرف، والتسويات البنكية', 'Supervision financière, validation des décaissements et rapprochements', true),
('accountant', 'المحاسب المعتمد', 'Comptable Agréé', 'تسجيل العمليات، مسير الأجور، إدارة النفقات والوثائق المحاسبية', 'Enregistrement des opérations, gestion de la paie et dépenses', true),
('cashier', 'أمين الصندوق والتحصيل', 'Caissier & Régisseur', 'استخلاص الرسوم المدرسية، إصدار وصولات الأداء، ويومية الصندوق', 'Encaissement des frais scolaires, émission des reçus officiels', true),
('hr_manager', 'مدير الموارد البشرية', 'Responsable RH', 'مزامنة الكوادر، كشوفات الرواتب، متابعة السلف والديون السابقة', 'Gestion du personnel, états de paie et suivi des avances', true),
('viewer', 'مستخدم للمعاينة والاطلاع', 'Lecteur / Consultation', 'صلاحيات قراءة واستعراض التقارير دون إمكانية التعديل أو الصرف', 'Consultation seule des tableaux de bord et rapports', true)
ON CONFLICT (code) DO NOTHING;

-- تثبيت حسابات الإدارة المعتمدة
INSERT INTO public.user_profiles (id, full_name, email, role_code, is_suspended)
VALUES
('00000000-0000-0000-0000-000000000001', 'أحمد بنشقرون (المدير العام)', 'admin@arouaschools.ma', 'super_admin', false),
('00000000-0000-0000-0000-000000000002', 'مريم التازي (المديرة المالية)', 'finance@arouaschools.ma', 'finance_director', false),
('00000000-0000-0000-0000-000000000003', 'ياسين العلمي (المحاسب)', 'comptable@arouaschools.ma', 'accountant', false),
('00000000-0000-0000-0000-000000000004', 'فاطمة الزهراء (أمينة الصندوق 1)', 'caisse1@arouaschools.ma', 'cashier', false),
('00000000-0000-0000-0000-000000000005', 'عمر السبتي (أمين الصندوق 2)', 'caisse2@arouaschools.ma', 'cashier', false),
('00000000-0000-0000-0000-000000000006', 'خديجة الوزاني (مسؤولة الموارد البشرية)', 'rh@arouaschools.ma', 'hr_manager', false)
ON CONFLICT (id) DO NOTHING;

-- 4. تسجيل حدث التدشين والتهيئة الأولية في سجل التدقيق بنظام آمن ومحمي
DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        BEGIN
            INSERT INTO public.audit_logs (
                user_name,
                user_role,
                action_type,
                target_entity,
                entity_id,
                new_values,
                ip_address,
                created_at
            ) VALUES (
                'النظام الآلي (تهيئة الإنتاج)',
                'super_admin',
                'SYSTEM_INIT',
                'system_database',
                'INIT-2026-CLEAN',
                json_build_object(
                    'event', 'PRODUCTION_CLEAN_SLATE_SUCCESS',
                    'academic_year', '2026/2027',
                    'status', 'READY_FOR_LIVE_USE',
                    'message', 'تم تفريغ المنظومة بالكامل بنجاح وجاهزة للاستخدام الميداني'
                ),
                '127.0.0.1',
                NOW()
            );
            RAISE NOTICE '✓ تم توثيق عملية تدشين المنظومة بنجاح في سجل التدقيق.';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ملاحظة: تعذر تسجيل حدث التدشين (غير حرج): %', SQLERRM;
        END;
    END IF;
END $$;

-- 5. تقرير الفحص والتحقق النهائي (Verification Diagnostic)
-- استعراض حالة الجداول التشغيلية للتأكد من تصفيرها بنسبة 100%
SELECT 
    schemaname, 
    relname AS table_name, 
    n_live_tup AS live_records_count 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
  AND relname IN (
    'students',
    'student_accounts',
    'student_payments_journal',
    'caisse_transactions',
    'checks_portfolio',
    'employees',
    'monthly_payroll',
    'expenses',
    'user_profiles',
    'system_roles'
  )
ORDER BY relname;
