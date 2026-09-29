-- ==============================================================================
-- AROUA AUDIT - STAGE 9: GRANULAR RBAC, USER PROFILES & IMMUTABLE AUDIT LOG
-- Migration Version: 20261006000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- ==============================================================================
-- 1. جدول الأدوار والامتيازات النظامية (System Roles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'super_admin', 'finance_director', 'accountant', 'cashier', 'hr_manager', 'viewer'
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    description_ar TEXT,
    description_fr TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON public.system_roles(code);

-- ==============================================================================
-- 2. جدول صلاحيات الأدوار الدقيقة (Role Permissions Matrix)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code TEXT NOT NULL REFERENCES public.system_roles(code) ON DELETE CASCADE,
    permission_key TEXT NOT NULL, 
    -- e.g.: 'enrollment.students', 'caisse.operations', 'caisse.disburse', 'payroll.execute', 
    -- 'payroll.advances', 'checks.portfolio', 'checks.reconcile', 'impayes.manage', 
    -- 'expenses.manage', 'services.config', 'system.settings', 'security.audit', 'security.users'
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

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON public.role_permissions(permission_key);

-- ==============================================================================
-- 3. جدول ملفات تعريف المستخدمين والموظفين (User Profiles & Staff Linkage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID, -- REFERENCES auth.users(id) ON DELETE CASCADE (nullable if created before auth)
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role_code TEXT NOT NULL REFERENCES public.system_roles(code) DEFAULT 'viewer',
    is_suspended BOOLEAN NOT NULL DEFAULT false,
    custom_permissions JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.user_profiles(role_code);
CREATE INDEX IF NOT EXISTS idx_profiles_employee ON public.user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth ON public.user_profiles(auth_user_id);

-- ==============================================================================
-- 4. سجل التدقيق والرقابة المحاسبية غير القابل للتعديل (Immutable Audit Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'DISBURSEMENT', 'EXPORT', 'RECONCILE', 'ROLE_CHANGE', 'SUSPEND'
    target_entity TEXT NOT NULL, -- e.g. 'caisse_transactions', 'expenses', 'student_payments_journal', 'employees', 'user_profiles'
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(target_entity);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);

-- ==============================================================================
-- 5. تريغر منع التعديل والحذف الصارم لسجل التدقيق (Strict Tamper Prevention)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'سجل التدقيق والرقابة المالي مشفر ومحمي نهائياً ولا يمكن تعديله أو حذفه.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_tampering
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();

-- ==============================================================================
-- 6. دالة وتريغر تسجيل العمليات المالية الحساسة تلقائياً (Financial Audit Trigger)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.log_financial_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_user_role TEXT;
    v_action TEXT;
    v_entity_id TEXT;
    v_old JSONB := NULL;
    v_new JSONB := NULL;
BEGIN
    -- Determine current action
    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_new := row_to_json(NEW)::jsonb;
        v_entity_id := COALESCE(NEW.id::text, '');
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE';
        v_old := row_to_json(OLD)::jsonb;
        v_new := row_to_json(NEW)::jsonb;
        v_entity_id := COALESCE(NEW.id::text, OLD.id::text, '');
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_old := row_to_json(OLD)::jsonb;
        v_entity_id := COALESCE(OLD.id::text, '');
    END IF;

    -- Special handling for financial disbursements
    IF (TG_TABLE_NAME = 'caisse_transactions' AND TG_OP = 'INSERT' AND NEW.type = 'decaissement') THEN
        v_action := 'DISBURSEMENT';
    END IF;

    -- Retrieve User Information from Context or session
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF v_user_id IS NOT NULL THEN
        SELECT full_name, role_code INTO v_user_name, v_user_role
        FROM public.user_profiles
        WHERE auth_user_id = v_user_id OR id = v_user_id
        LIMIT 1;
    END IF;

    v_user_name := COALESCE(v_user_name, current_user, 'Système Automatique');
    v_user_role := COALESCE(v_user_role, 'super_admin');

    -- Insert Audit Record (Will bypass user level checks because it's in a trigger)
    INSERT INTO public.audit_logs (
        user_id,
        user_name,
        user_role,
        action_type,
        target_entity,
        entity_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        v_user_id,
        v_user_name,
        v_user_role,
        v_action,
        TG_TABLE_NAME,
        v_entity_id,
        v_old,
        v_new,
        NOW()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach financial audit triggers to sensitive tables if they exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'caisse_transactions') THEN
        DROP TRIGGER IF EXISTS trg_audit_caisse_transactions ON public.caisse_transactions;
        CREATE TRIGGER trg_audit_caisse_transactions
        AFTER INSERT OR UPDATE OR DELETE ON public.caisse_transactions
        FOR EACH ROW EXECUTE FUNCTION public.log_financial_audit();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
        CREATE TRIGGER trg_audit_expenses
        AFTER INSERT OR UPDATE OR DELETE ON public.expenses
        FOR EACH ROW EXECUTE FUNCTION public.log_financial_audit();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_payments_journal') THEN
        DROP TRIGGER IF EXISTS trg_audit_student_payments_journal ON public.student_payments_journal;
        CREATE TRIGGER trg_audit_student_payments_journal
        AFTER INSERT OR UPDATE OR DELETE ON public.student_payments_journal
        FOR EACH ROW EXECUTE FUNCTION public.log_financial_audit();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_impayes') THEN
        DROP TRIGGER IF EXISTS trg_audit_student_impayes ON public.student_impayes;
        CREATE TRIGGER trg_audit_student_impayes
        AFTER INSERT OR UPDATE OR DELETE ON public.student_impayes
        FOR EACH ROW EXECUTE FUNCTION public.log_financial_audit();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        DROP TRIGGER IF EXISTS trg_audit_employees ON public.employees;
        CREATE TRIGGER trg_audit_employees
        AFTER INSERT OR UPDATE OR DELETE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION public.log_financial_audit();
    END IF;
END $$;

-- ==============================================================================
-- 7. دوال مساعدة لفحص الصلاحيات وأمان الصفوف (RLS Helper Functions)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role_code INTO v_role
    FROM public.user_profiles
    WHERE auth_user_id = auth.uid() OR id = auth.uid()
    LIMIT 1;

    RETURN COALESCE(v_role, 'viewer');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_permission(p_key TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_allowed BOOLEAN := false;
BEGIN
    v_role := public.get_current_user_role();
    
    -- Super Admin has universal access
    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;

    -- Query role_permissions matrix
    SELECT 
        CASE 
            WHEN p_action = 'view' THEN can_view
            WHEN p_action = 'create' THEN can_create
            WHEN p_action = 'edit' THEN can_edit
            WHEN p_action = 'delete' THEN can_delete
            WHEN p_action = 'export' THEN can_export
            WHEN p_action = 'print' THEN can_print
            ELSE false
        END INTO v_allowed
    FROM public.role_permissions
    WHERE role_code = v_role AND permission_key = p_key
    LIMIT 1;

    RETURN COALESCE(v_allowed, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 8. تفعيل أمان الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies
DO $$ BEGIN
    CREATE POLICY "Allow read system_roles" ON public.system_roles FOR SELECT USING (true);
    CREATE POLICY "Allow read role_permissions" ON public.role_permissions FOR SELECT USING (true);
    CREATE POLICY "Allow read user_profiles" ON public.user_profiles FOR SELECT USING (true);
    CREATE POLICY "Allow read audit_logs" ON public.audit_logs FOR SELECT USING (
        public.get_current_user_role() IN ('super_admin', 'finance_director')
        OR public.has_permission('security.audit', 'view')
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Write policies (Restricted to super_admin or admin roles)
DO $$ BEGIN
    CREATE POLICY "Allow write system_roles" ON public.system_roles FOR ALL USING (
        public.get_current_user_role() = 'super_admin'
    );
    CREATE POLICY "Allow write role_permissions" ON public.role_permissions FOR ALL USING (
        public.get_current_user_role() = 'super_admin'
    );
    CREATE POLICY "Allow write user_profiles" ON public.user_profiles FOR ALL USING (
        public.get_current_user_role() IN ('super_admin', 'finance_director')
    );
    CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 9. تغذية البيانات الأولية للأدوار والصلاحيات (Seed Roles & Permissions Matrix)
-- ==============================================================================
INSERT INTO public.system_roles (code, name_ar, name_fr, description_ar, description_fr, is_system_role)
VALUES 
('super_admin', 'المدير العام والمشرف الأعلى', 'Super Administrateur', 'كامل الصلاحيات غير المقيدة لإدارة ومراقبة المنظومة وضبط الأمان', 'Accès total sans restriction à l''ensemble du système et sécurité', true),
('finance_director', 'المدير المالي والمحاسبي', 'Directeur Financier & Comptable', 'صلاحيات الإشراف المالي، المصادقة على الصرف، والتسويات البنكية', 'Supervision financière, validation des décaissements et rapprochements', true),
('accountant', 'المحاسب المعتمد', 'Comptable Agréé', 'تسجيل العمليات، مسير الأجور، إدارة النفقات والوثائق المحاسبية', 'Enregistrement des opérations, gestion de la paie et dépenses', true),
('cashier', 'أمين الصندوق والتحصيل', 'Caissier & Régisseur', 'استخلاص الرسوم المدرسية، إصدار وصولات الأداء، ويومية الصندوق', 'Encaissement des frais scolaires, émission des reçus officiels', true),
('hr_manager', 'مدير الموارد البشرية', 'Responsable RH', 'مزامنة الكوادر، كشوفات الرواتب، متابعة السلف والديون السابقة', 'Gestion du personnel, états de paie et suivi des avances', true),
('viewer', 'مستخدم للمعاينة والاطلاع', 'Lecteur / Consultation', 'صلاحيات قراءة واستعراض التقارير دون إمكانية التعديل أو الصرف', 'Consultation seule des tableaux de bord et rapports', true)
ON CONFLICT (code) DO NOTHING;

-- تغذية مصفوفة الصلاحيات الأولية لكافة الأدوار
-- الوحدات الأساسية:
-- enrollment.students, caisse.operations, caisse.disburse, payroll.execute, payroll.advances,
-- checks.portfolio, checks.reconcile, impayes.manage, expenses.manage, services.config,
-- system.settings, security.audit, security.users

-- 1. Super Admin: كافة الصلاحيات مفعلة
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
('super_admin', 'enrollment.students', true, true, true, true, true, true),
('super_admin', 'caisse.operations',    true, true, true, true, true, true),
('super_admin', 'caisse.disburse',      true, true, true, true, true, true),
('super_admin', 'payroll.execute',      true, true, true, true, true, true),
('super_admin', 'payroll.advances',     true, true, true, true, true, true),
('super_admin', 'checks.portfolio',     true, true, true, true, true, true),
('super_admin', 'checks.reconcile',     true, true, true, true, true, true),
('super_admin', 'impayes.manage',       true, true, true, true, true, true),
('super_admin', 'expenses.manage',      true, true, true, true, true, true),
('super_admin', 'services.config',      true, true, true, true, true, true),
('super_admin', 'system.settings',      true, true, true, true, true, true),
('super_admin', 'security.audit',       true, true, true, true, true, true),
('super_admin', 'security.users',       true, true, true, true, true, true)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- 2. Finance Director: صلاحيات واسعة مع حظر حذف السجلات أو تغيير إعدادات الأمان الحساسة
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
('finance_director', 'system.settings',      true, false, false, false, true, true),
('finance_director', 'security.audit',       true, false, false, false, true, true),
('finance_director', 'security.users',       true, false, false, false, true, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- 3. Accountant: محاسبة، أجور، ونفقات دون صلاحيات حذف أو صرف مباشر بدون موافقة
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
('accountant', 'enrollment.students', true, false, false, false, true, true),
('accountant', 'caisse.operations',    true, true, false, false, true, true),
('accountant', 'caisse.disburse',      true, true, false, false, true, true),
('accountant', 'payroll.execute',      true, true, true, false, true, true),
('accountant', 'payroll.advances',     true, true, true, false, true, true),
('accountant', 'checks.portfolio',     true, true, true, false, true, true),
('accountant', 'checks.reconcile',     true, true, true, false, true, true),
('accountant', 'impayes.manage',       true, true, true, false, true, true),
('accountant', 'expenses.manage',      true, true, true, false, true, true),
('accountant', 'services.config',      true, false, false, false, true, true),
('accountant', 'system.settings',      false, false, false, false, false, false),
('accountant', 'security.audit',       false, false, false, false, false, false),
('accountant', 'security.users',       false, false, false, false, false, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- 4. Cashier: تحصيل رسوم، إصدار وصولات، واستعراض الصندوق اليومي فقط
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
('cashier', 'enrollment.students', true, false, false, false, false, true),
('cashier', 'caisse.operations',    true, true, false, false, false, true),
('cashier', 'caisse.disburse',      false, false, false, false, false, false), -- ممنوع الصرف نهائياً
('cashier', 'payroll.execute',      false, false, false, false, false, false),
('cashier', 'payroll.advances',     false, false, false, false, false, false),
('cashier', 'checks.portfolio',     true, true, false, false, false, true),
('cashier', 'checks.reconcile',     false, false, false, false, false, false),
('cashier', 'impayes.manage',       true, false, false, false, false, true),
('cashier', 'expenses.manage',      false, false, false, false, false, false),
('cashier', 'services.config',      true, false, false, false, false, false),
('cashier', 'system.settings',      false, false, false, false, false, false),
('cashier', 'security.audit',       false, false, false, false, false, false),
('cashier', 'security.users',       false, false, false, false, false, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- 5. HR Manager: شؤون الموظفين والرواتب
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
('hr_manager', 'enrollment.students', false, false, false, false, false, false),
('hr_manager', 'caisse.operations',    false, false, false, false, false, false),
('hr_manager', 'caisse.disburse',      false, false, false, false, false, false),
('hr_manager', 'payroll.execute',      true, true, true, false, true, true),
('hr_manager', 'payroll.advances',     true, true, true, false, true, true),
('hr_manager', 'checks.portfolio',     false, false, false, false, false, false),
('hr_manager', 'checks.reconcile',     false, false, false, false, false, false),
('hr_manager', 'impayes.manage',       false, false, false, false, false, false),
('hr_manager', 'expenses.manage',      false, false, false, false, false, false),
('hr_manager', 'services.config',      true, false, false, false, false, false),
('hr_manager', 'system.settings',      false, false, false, false, false, false),
('hr_manager', 'security.audit',       false, false, false, false, false, false),
('hr_manager', 'security.users',       false, false, false, false, false, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- 6. Viewer: قراءة واستعراض فقط
INSERT INTO public.role_permissions (role_code, permission_key, can_view, can_create, can_edit, can_delete, can_export, can_print)
VALUES
('viewer', 'enrollment.students', true, false, false, false, false, false),
('viewer', 'caisse.operations',    true, false, false, false, false, false),
('viewer', 'caisse.disburse',      false, false, false, false, false, false),
('viewer', 'payroll.execute',      false, false, false, false, false, false),
('viewer', 'payroll.advances',     false, false, false, false, false, false),
('viewer', 'checks.portfolio',     true, false, false, false, false, false),
('viewer', 'checks.reconcile',     false, false, false, false, false, false),
('viewer', 'impayes.manage',       true, false, false, false, false, false),
('viewer', 'expenses.manage',      true, false, false, false, false, false),
('viewer', 'services.config',      true, false, false, false, false, false),
('viewer', 'system.settings',      false, false, false, false, false, false),
('viewer', 'security.audit',       false, false, false, false, false, false),
('viewer', 'security.users',       false, false, false, false, false, false)
ON CONFLICT (role_code, permission_key) DO UPDATE SET
can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create, can_edit = EXCLUDED.can_edit,
can_delete = EXCLUDED.can_delete, can_export = EXCLUDED.can_export, can_print = EXCLUDED.can_print;

-- تغذية مستخدمين نموذجية (Initial Default User Profiles)
INSERT INTO public.user_profiles (id, full_name, email, role_code, is_suspended)
VALUES
('00000000-0000-0000-0000-000000000001', 'أحمد بنشقرون (المدير العام)', 'admin@arouaschools.ma', 'super_admin', false),
('00000000-0000-0000-0000-000000000002', 'مريم التازي (المديرة المالية)', 'finance@arouaschools.ma', 'finance_director', false),
('00000000-0000-0000-0000-000000000003', 'ياسين العلمي (المحاسب)', 'comptable@arouaschools.ma', 'accountant', false),
('00000000-0000-0000-0000-000000000004', 'فاطمة الزهراء (أمينة الصندوق 1)', 'caisse1@arouaschools.ma', 'cashier', false),
('00000000-0000-0000-0000-000000000005', 'عمر السبتي (أمين الصندوق 2)', 'caisse2@arouaschools.ma', 'cashier', false),
('00000000-0000-0000-0000-000000000006', 'خديجة الوزاني (مسؤولة الموارد البشرية)', 'rh@arouaschools.ma', 'hr_manager', false)
ON CONFLICT (id) DO NOTHING;

-- تسجيل عملية أولية في سجل التدقيق لتوثيق تطبيق معمارية الأمان
INSERT INTO public.audit_logs (
    user_name,
    user_role,
    action_type,
    target_entity,
    entity_id,
    new_values,
    created_at
) VALUES (
    'Système Automatique (Architecture)',
    'super_admin',
    'CREATE',
    'security_system',
    'RBAC-INIT',
    '{"version": "20261006000001", "status": "active", "security_level": "military_grade_financial"}'::jsonb,
    NOW()
);
