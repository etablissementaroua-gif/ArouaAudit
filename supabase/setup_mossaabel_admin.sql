-- =========================================================================
-- AROUAAUDIT — SETUP SINGLE SUPER ADMIN ACCOUNT (100% FAIL-SAFE & DYNAMIC)
-- =========================================================================
-- الحساب الإداري المعتمد الوحيد: مصعب (mossaabel@arouaaudit.com)
-- =========================================================================

-- 1. التأكد من وجود جدول ملفات المستخدمين user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id text PRIMARY KEY,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    role_code text NOT NULL DEFAULT 'super_admin',
    is_suspended boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- 2. تنفيذ العمليات الديناميكية بأمان دون أخطاء التجميع
DO $$ 
BEGIN 
    -- أ. تنظيف جدول الصلاحيات إن كان موجوداً عبر EXECUTE الديناميكي
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN 
        EXECUTE 'DELETE FROM public.role_permissions WHERE role_code != ''super_admin'';';
        RAISE NOTICE 'تم مسح صلاحيات الأدوار الأخرى';
    END IF; 

    -- ب. تنظيف جدول الأدوار إن كان موجوداً عبر EXECUTE الديناميكي
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_roles') THEN 
        EXECUTE 'DELETE FROM public.system_roles WHERE code != ''super_admin'';';
        RAISE NOTICE 'تم الإبقاء فقط على دور المدير العام والمشرف الأعلى';
    END IF; 

    -- ج. تفريغ أي حسابات قديمة
    DELETE FROM public.user_profiles WHERE email != 'mossaabel@arouaaudit.com';

    -- د. إدراج وتثبيت حساب مصعب كمدير عام وحيد للمنظومة
    INSERT INTO public.user_profiles (
        id, full_name, email, role_code, is_suspended, created_at
    ) VALUES (
        'usr-mossaabel', 
        'مصعب (المدير العام والمشرف الأعلى)', 
        'mossaabel@arouaaudit.com', 
        'super_admin', 
        false, 
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role_code = 'super_admin',
        is_suspended = false;

    RAISE NOTICE 'تم بنجاح اعتماد وتثبيت حساب مصعب كمدير عام وحيد للمنظومة';
END $$;
