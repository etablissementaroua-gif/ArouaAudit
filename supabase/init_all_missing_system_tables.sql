-- ==============================================================================
-- AROUAAUDIT — COMPLETE RECOVERY & INITIALIZATION SCRIPT FOR SUPABASE
-- ==============================================================================
-- هذا الملف يقوم بإنشاء وتفعيل كافة الجداول الناقصة لحل جميع أخطاء 404 و 400:
-- 1. system_roles (404)
-- 2. role_permissions (404)
-- 3. user_profiles
-- 4. audit_logs (400)
-- 5. system_tasks (404)
-- 6. system_notifications (404)
-- 7. employees & approved_staff (404)
-- 8. حساب المشرف الأعلى في auth.users لتفادي خطأ كلمة المرور
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. جدول الأدوار النظامية (system_roles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    description_ar TEXT,
    description_fr TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج الأدوار الأساسية
INSERT INTO public.system_roles (code, name_ar, name_fr, description_ar, description_fr, is_system_role, is_active)
VALUES 
    ('super_admin', 'المدير العام والمشرف الأعلى', 'Super Administrateur', 'كامل الصلاحيات غير المقيدة لإدارة المنظومة وضبط الأمان', 'Accès total sans restriction', true, true),
    ('finance_director', 'المدير المالي والتنفيذي', 'Directeur Financier', 'إدارة الحركات المالية والمحاسبية والمصادقة على الصرفيات', 'Gestion financière et validation des dépenses', false, true),
    ('accountant', 'المحاسب المالي العام', 'Comptable Général', 'تسجيل القيود المحاسبية، متابعة اليومية والخزينة والتحصيلات', 'Enregistrement comptable et suivi de trésorerie', false, true),
    ('cashier', 'أمين الصندوق والتحصيل', 'Caissier / Agent Recouvrement', 'استلام الرسوم المدرسية وإصدار الوصولات وإيداع الشيكات', 'Encaissement des frais et gestion des reçus', false, true),
    ('hr_manager', 'مدير الموارد البشرية والرواتب', 'Responsable RH & Paie', 'إدارة ملفات الموظفين والأساتذة وإعداد جداول الرواتب والتسبيقات', 'Gestion du personnel et de la paie', false, true),
    ('viewer', 'معاينة ورقابة فقط', 'Auditeur / Observateur', 'اطلاع وقراءة التقارير دون إمكانية التعديل أو الحذف', 'Consultation uniquement', false, true)
ON CONFLICT (code) DO UPDATE SET 
    name_ar = EXCLUDED.name_ar,
    name_fr = EXCLUDED.name_fr,
    is_active = true;

-- ------------------------------------------------------------------------------
-- 2. جدول صلاحيات الأدوار (role_permissions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code TEXT NOT NULL REFERENCES public.system_roles(code) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_export BOOLEAN NOT NULL DEFAULT false,
    can_print BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_role_permission UNIQUE (role_code, permission_key)
);

-- إدراج الصلاحيات الكاملة للمشرف الأعلى
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
SELECT 
    'super_admin', 
    unnest(ARRAY[
        'enrollment.students', 'caisse.operations', 'caisse.disburse', 
        'payroll.execute', 'payroll.advances', 'checks.portfolio', 
        'checks.reconcile', 'impayes.manage', 'expenses.manage', 
        'services.config', 'system.settings', 'security.audit', 'security.users'
    ]),
    true, true, true, true, true, true
ON CONFLICT (role_code, permission_key) DO UPDATE SET 
    can_view = true, can_create = true, can_edit = true, can_delete = true, can_export = true, can_print = true;

-- إدراج الصلاحيات الأساسية للمدير المالي والتنفيذي (finance_director)
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
    ('finance_director', 'enrollment.students', true, true, true, false, true, true),
    ('finance_director', 'caisse.operations',    true, true, true, false, true, true),
    ('finance_director', 'caisse.disburse',      true, true, true, false, true, true),
    ('finance_director', 'payroll.execute',      true, true, true, false, true, true),
    ('finance_director', 'payroll.advances',     true, true, true, false, true, true),
    ('finance_director', 'checks.portfolio',     true, true, true, false, true, true),
    ('finance_director', 'checks.reconcile',     true, true, true, false, true, true),
    ('finance_director', 'impayes.manage',       true, true, true, false, true, true),
    ('finance_director', 'expenses.manage',      true, true, true, false, true, true),
    ('finance_director', 'services.config',      true, true, true, false, true, true),
    ('finance_director', 'system.settings',      true, true, true, false, true, true),
    ('finance_director', 'security.audit',       true, false, false, false, true, true),
    ('finance_director', 'security.users',       true, false, false, false, true, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET 
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_export = EXCLUDED.can_export,
    can_print = EXCLUDED.can_print;

-- ------------------------------------------------------------------------------
-- 3. جدول الموظفين المعينين (employees) وعرض (approved_staff)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_staff_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    matricule TEXT,
    function_title TEXT,
    department TEXT,
    phone TEXT,
    email TEXT,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء منظر approved_staff ليتوافق مع الاستعلامات
CREATE OR REPLACE VIEW public.approved_staff AS 
SELECT id, full_name, matricule, function_title, department, phone, email, is_active, created_at
FROM public.employees;

-- ------------------------------------------------------------------------------
-- 4. جدول ملفات المستخدمين (user_profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    auth_user_id UUID,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role_code TEXT NOT NULL REFERENCES public.system_roles(code) DEFAULT 'viewer',
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    password TEXT,
    password_hash TEXT,
    custom_permissions JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج وتثبيت حساب مصعب
INSERT INTO public.user_profiles (
    id, full_name, email, role_code, is_suspended, password, created_at
) VALUES (
    'usr-mossaabel',
    'مصعب (المدير العام والمشرف الأعلى)',
    'mossaabel@arouaaudit.com',
    'super_admin',
    false,
    'Mo1356365508',
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role_code = 'super_admin',
    is_suspended = false,
    password = 'Mo1356365508';

-- ------------------------------------------------------------------------------
-- 5. جدول سجل التدقيق والأمان (audit_logs) - يدعم المعرفات النصية
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action_type);

-- ------------------------------------------------------------------------------
-- 6. جدول المهام النظامية (system_tasks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'task',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    visibility TEXT NOT NULL DEFAULT 'public',
    creator_id UUID,
    creator_name TEXT NOT NULL DEFAULT 'النظام',
    assigned_to UUID,
    assigned_to_name TEXT,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_tasks_status ON public.system_tasks(status);

-- ------------------------------------------------------------------------------
-- 7. جدول التنبيهات والإشعارات (system_notifications)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'task',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON public.system_notifications(is_read);

-- ------------------------------------------------------------------------------
-- 8. حساب مصعب في auth.users لتفادي خطأ 400 Invalid Login Credentials
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    super_admin_uid UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mossaabel@arouaaudit.com') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            super_admin_uid,
            'authenticated',
            'authenticated',
            'mossaabel@arouaaudit.com',
            crypt('Mo1356365508', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"مصعب (المدير العام والمشرف الأعلى)","role_code":"super_admin"}',
            NOW(),
            NOW()
        );
    ELSE
        UPDATE auth.users 
        SET encrypted_password = crypt('Mo1356365508', gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = 'mossaabel@arouaaudit.com';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.users skipped or handled by Supabase Dashboard: %', SQLERRM;
END $$;

-- ------------------------------------------------------------------------------
-- 9. تفعيل صلاحيات القراءة والكتابة (Grants & RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['system_roles', 'role_permissions', 'user_profiles', 'audit_logs', 'system_tasks', 'system_notifications', 'employees'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access to %I" ON public.%I;', t, t);
        EXECUTE format('CREATE POLICY "Public access to %I" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', t, t);
        EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', t);
    END LOOP;
END $$;

GRANT ALL ON public.approved_staff TO anon, authenticated, service_role;

SELECT '✅ تم بنجاح إنشاء وتهيئة كافة الجداول والأدوار وحساب المشرف الأعلى بنجاح!' AS result;
