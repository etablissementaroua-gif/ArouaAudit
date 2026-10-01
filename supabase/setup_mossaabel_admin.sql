-- =========================================================================
-- AROUAAUDIT — SETUP SINGLE SUPER ADMIN ACCOUNT & PURGE TEST ROLES
-- =========================================================================
-- الحساب الإداري المعتمد الوحيد: مصعب (mossaabel@arouaaudit.com)
-- =========================================================================

DO $$ 
BEGIN 
    -- 1. حذف الأدوار الاختبارية السابقة من مصفوفة الصلاحيات
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN 
        DELETE FROM public.role_permissions WHERE role_code != 'super_admin';
        RAISE NOTICE 'تم حذف صلاحيات الأدوار الاختبارية السابقة';
    END IF; 

    -- 2. الإبقاء حصرياً على دور المدير العام والمشرف الأعلى في جدول الأدوار
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_roles') THEN 
        DELETE FROM public.system_roles WHERE code != 'super_admin';
        RAISE NOTICE 'تم الإبقاء فقط على دور المدير العام والمشرف الأعلى';
    END IF; 

    -- 3. إدراج/تحديث حساب المستخدم مصعب كمدير عام وحيد للمنظومة
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN 
        -- تفريغ الحسابات الأخرى
        DELETE FROM public.user_profiles WHERE email != 'mossaabel@arouaaudit.com';

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

        RAISE NOTICE 'تم اعتماد وتثبيت حساب مصعب كمدير عام وحيد للمنظومة';
    END IF; 

END $$;
