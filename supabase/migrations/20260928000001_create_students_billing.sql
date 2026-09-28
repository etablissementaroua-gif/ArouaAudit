-- ==============================================================================
-- AROUA AUDIT - STUDENTS SYNCHRONIZATION & BILLING TRIGGER MIGRATION
-- Migration Version: 20260928000001
-- Targets: PostgreSQL (Supabase Engine)
-- Description: Reception of students from arouaschools, accounts ledger & triggers
-- ==============================================================================

-- 1. Create or Update Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    external_id TEXT UNIQUE,
    source_platform TEXT DEFAULT 'arouaschools',
    full_name_ar TEXT NOT NULL,
    full_name_fr TEXT,
    massar_code TEXT,
    academic_level TEXT NOT NULL,
    academic_year TEXT DEFAULT '2026-2027',
    classroom TEXT,
    has_transport BOOLEAN DEFAULT false,
    has_canteen BOOLEAN DEFAULT false,
    parent_whatsapp TEXT,
    parent_phone TEXT,
    enrollment_status TEXT DEFAULT 'enrolled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist if the table was previously created
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'arouaschools',
ADD COLUMN IF NOT EXISTS full_name_ar TEXT,
ADD COLUMN IF NOT EXISTS full_name_fr TEXT,
ADD COLUMN IF NOT EXISTS massar_code TEXT,
ADD COLUMN IF NOT EXISTS academic_level TEXT,
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026-2027',
ADD COLUMN IF NOT EXISTS classroom TEXT,
ADD COLUMN IF NOT EXISTS has_transport BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_canteen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'enrolled',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Fast Lookup & Deduplication Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_external_id ON public.students(external_id);
CREATE INDEX IF NOT EXISTS idx_students_massar ON public.students(massar_code);
CREATE INDEX IF NOT EXISTS idx_students_academic_level ON public.students(academic_level);
CREATE INDEX IF NOT EXISTS idx_students_source ON public.students(source_platform);

-- 3. Student Accounts (Financial Ledger & Balances)
CREATE TABLE IF NOT EXISTS public.student_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    total_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tuition_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    transport_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    canteen_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_account UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_accounts_student_id ON public.student_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_accounts_balance ON public.student_accounts(balance);

-- 4. Audit Logs Compatibility (Create if missing or Alter)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id TEXT,
ADD COLUMN IF NOT EXISTS details JSONB;

-- 5. Automatic Billing & Audit Trigger
CREATE OR REPLACE FUNCTION public.handle_new_enrolled_student()
RETURNS TRIGGER AS $$
DECLARE
    v_tuition NUMERIC(12, 2) := 0.00;
    v_transport NUMERIC(12, 2) := 0.00;
    v_canteen NUMERIC(12, 2) := 0.00;
    v_total_due NUMERIC(12, 2) := 0.00;
BEGIN
    -- احتساب الرسوم التقديرية بناءً على المستوى الدراسي والخدمات
    CASE 
        WHEN NEW.academic_level ILIKE '%بكالوريا%' OR NEW.academic_level ILIKE '%bac%' THEN v_tuition := 32000.00;
        WHEN NEW.academic_level ILIKE '%جذع%' OR NEW.academic_level ILIKE '%tronc%' THEN v_tuition := 28000.00;
        WHEN NEW.academic_level ILIKE '%إعدادي%' OR NEW.academic_level ILIKE '%coll%' THEN v_tuition := 24000.00;
        WHEN NEW.academic_level ILIKE '%ابتدائي%' OR NEW.academic_level ILIKE '%prim%' THEN v_tuition := 20000.00;
        ELSE v_tuition := 18000.00;
    END CASE;

    IF NEW.has_transport THEN
        v_transport := 5000.00;
    END IF;

    IF NEW.has_canteen THEN
        v_canteen := 4500.00;
    END IF;

    v_total_due := v_tuition + v_transport + v_canteen;

    -- فتح ملف الحساب المالي للتلميذ إذا لم يكن موجوداً، أو تحديثه عند التعديل
    INSERT INTO public.student_accounts (
        student_id, 
        tuition_fee,
        transport_fee,
        canteen_fee,
        total_due, 
        total_paid, 
        balance, 
        updated_at
    )
    VALUES (
        NEW.student_id, 
        v_tuition,
        v_transport,
        v_canteen,
        v_total_due, 
        0.00, 
        v_total_due, 
        NOW()
    )
    ON CONFLICT (student_id) DO UPDATE SET
        tuition_fee = EXCLUDED.tuition_fee,
        transport_fee = EXCLUDED.transport_fee,
        canteen_fee = EXCLUDED.canteen_fee,
        total_due = EXCLUDED.total_due,
        balance = EXCLUDED.total_due - public.student_accounts.total_paid,
        updated_at = NOW();

    -- إضافة إشعار تدقيق في سجل المعاملات المالية بوصول تلميذ جديد
    INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
    VALUES (
        'SYNC_STUDENT_ENROLLED',
        'students',
        NEW.student_id,
        json_build_object(
            'full_name', COALESCE(NEW.full_name_ar, NEW.full_name_fr),
            'massar_code', NEW.massar_code,
            'level', NEW.academic_level,
            'transport', NEW.has_transport,
            'canteen', NEW.has_canteen,
            'source', NEW.source_platform
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إعادة ربط الـ Trigger
DROP TRIGGER IF EXISTS trg_after_student_sync ON public.students;
CREATE TRIGGER trg_after_student_sync
AFTER INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_new_enrolled_student();

-- 6. تفعيل أمان الصفوف RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read students for authenticated users" ON public.students FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow write students for authenticated users" ON public.students FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read student_accounts for authenticated users" ON public.student_accounts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow write student_accounts for authenticated users" ON public.student_accounts FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
