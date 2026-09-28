-- ==============================================================================
-- AROUA AUDIT - STAGE 3: STAFF & TEACHERS SYNC, PAYROLL & ADVANCES LEDGER
-- Migration Version: 20260930000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- ==============================================================================
-- 0. التأكد من وجود جدول الصندوق وأنواع البيانات (Prerequisite Types & Table)
-- ==============================================================================
DO $ BEGIN
    CREATE TYPE transaction_direction AS ENUM ('encaissement', 'decaissement');
EXCEPTION WHEN duplicate_object THEN null;
END $;

DO $ BEGIN
    CREATE TYPE financial_payment_method AS ENUM ('especes', 'cheque', 'virement', 'carte');
EXCEPTION WHEN duplicate_object THEN null;
END $;

CREATE TABLE IF NOT EXISTS public.caisse_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type transaction_direction NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method financial_payment_method NOT NULL DEFAULT 'especes',
    category VARCHAR(100) NOT NULL,
    reference_number VARCHAR(100),
    description TEXT NOT NULL,
    solde_apres NUMERIC(15, 2),
    author_id UUID,
    author_name VARCHAR(150),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caisse_date ON public.caisse_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_type ON public.caisse_transactions (type);

ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;

DO $ BEGIN
    CREATE POLICY "Allow read caisse_transactions" ON public.caisse_transactions FOR SELECT USING (true);
    CREATE POLICY "Allow write caisse_transactions" ON public.caisse_transactions FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $;

-- 1. جدول الموظفين والأساتذة (Employees & Staff Ledger)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_staff_id TEXT UNIQUE NOT NULL, -- UID أو معرف الموظف القادم من arouaschools
    full_name TEXT NOT NULL,
    cin TEXT,
    cnss_number TEXT,
    phone TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'teacher',   -- 'teacher', 'admin', 'driver', 'assistant'
    department TEXT DEFAULT 'Pedagogique',
    subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    assigned_classes TEXT[] DEFAULT ARRAY[]::TEXT[],
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    credit_ancien DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- ديون سابقة عالقة
    bank_name TEXT,
    rib_account TEXT,
    employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'departed', 'suspended')),
    source_platform TEXT DEFAULT 'arouaschools',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_external_id ON public.employees(external_staff_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- 2. جدول التسبيقات والديون الشهرية (Staff Advances)
CREATE TABLE IF NOT EXISTS public.staff_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'espece' CHECK (payment_method IN ('espece', 'cheque', 'virement')),
    check_number TEXT,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    month_reference TEXT NOT NULL, -- مثال: '2026-09'
    is_settled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advances_employee_id ON public.staff_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_month ON public.staff_advances(month_reference);

-- 3. جدول مسير الرواتب الشهري (Monthly Payroll Records)
CREATE TABLE IF NOT EXISTS public.monthly_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    month TEXT NOT NULL, -- '2026-09'
    base_salary DECIMAL(10, 2) NOT NULL,
    advances_deducted DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    credit_deducted DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_paid DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_monthly_payroll UNIQUE (employee_id, academic_year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_payroll_month ON public.monthly_payroll(month);
CREATE INDEX IF NOT EXISTS idx_monthly_payroll_status ON public.monthly_payroll(payment_status);

-- 4. ربط خصم التسبيقات آلياً مع يومية الصندوق (Caisse Outflow Trigger)
CREATE OR REPLACE FUNCTION public.handle_staff_advance_caisse()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_method financial_payment_method := 'especes';
    v_emp_name TEXT := 'موظف';
BEGIN
    SELECT full_name INTO v_emp_name FROM public.employees WHERE id = NEW.employee_id;
    
    IF NEW.payment_method = 'cheque' THEN
        v_payment_method := 'cheque';
    ELSIF NEW.payment_method = 'virement' THEN
        v_payment_method := 'virement';
    ELSE
        v_payment_method := 'especes';
    END IF;

    INSERT INTO public.caisse_transactions (
        transaction_date,
        type,
        amount,
        payment_method,
        category,
        reference_number,
        description,
        author_name,
        metadata,
        created_at
    ) VALUES (
        NEW.advance_date,
        'decaissement',
        NEW.amount,
        v_payment_method,
        'payroll_advances',
        COALESCE(NEW.check_number, NEW.id::TEXT),
        'تسبيق على الراتب (Avance) - ' || COALESCE(v_emp_name, 'موظف'),
        'مسير الأجور - النظام المالي',
        json_build_object(
            'employee_id', NEW.employee_id,
            'advance_id', NEW.id,
            'academic_year', NEW.academic_year,
            'month_reference', NEW.month_reference,
            'notes', NEW.notes
        ),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_advance_caisse ON public.staff_advances;
CREATE TRIGGER trg_staff_advance_caisse
AFTER INSERT ON public.staff_advances
FOR EACH ROW EXECUTE FUNCTION public.handle_staff_advance_caisse();

-- 5. إدراج بذور الموظفين النموذجية المعتمدة
INSERT INTO public.employees (
    external_staff_id, full_name, cin, cnss_number, phone, email, role, department, subjects, assigned_classes, base_salary, credit_ancien, bank_name, rib_account, employment_status
) VALUES 
    ('STF-AROUA-001', 'رشيد العلمي', 'EE124578', '18992011', '0661122334', 'rachid.alami@arouaschools.ma', 'teacher', 'Pedagogique', ARRAY['الرياضيات']::TEXT[], ARRAY['2Bac SM-A', '1Bac ScExp']::TEXT[], 7500.00, 0.00, 'Attijariwafa Bank', '007810000123456789012345', 'active'),
    ('STF-AROUA-002', 'سناء بنكيران', 'BK882190', '44556677', '0662233445', 'sanaa.benkiran@arouaschools.ma', 'teacher', 'Pedagogique', ARRAY['اللغة الفرنسية']::TEXT[], ARRAY['3Collège-2', '2Collège-1']::TEXT[], 7000.00, 0.00, 'Banque Populaire', '011780000987654321098765', 'active'),
    ('STF-AROUA-003', 'محمد الوردي', 'AB334455', '33669911', '0663344556', 'm.ouardi@arouaschools.ma', 'teacher', 'Pedagogique', ARRAY['اللغة العربية', 'التربية الإسلامية']::TEXT[], ARRAY['الأول ابتدائي (CP)', 'الثاني ابتدائي (CE1)']::TEXT[], 6500.00, 0.00, 'BMCE Bank of Africa', '011850000456123789654123', 'active'),
    ('STF-AROUA-004', 'حميد الناصري', 'G552211', '22883344', '0664455667', 'hamid.nassiri@arouaschools.ma', 'driver', 'Transport', ARRAY['النقل المدرسي (حافلة A)']::TEXT[], ARRAY['خط سوكوما - المحاميد']::TEXT[], 4800.00, 1200.00, 'CIH Bank', '230810000654987321456987', 'active'),
    ('STF-AROUA-005', 'فاطمة الزهراء الشاوي', 'N991122', '99887711', '0665566778', 'fz.chaoui@arouaschools.ma', 'admin', 'Administration', ARRAY['إدارة الصندوق والحسابات']::TEXT[], ARRAY['الإدارة العامة']::TEXT[], 6200.00, 0.00, 'Attijariwafa Bank', '007810000789456123012345', 'active'),
    ('STF-AROUA-006', 'نادية الإدريسي', 'HH443322', '55443322', '0666677889', 'nadia.idrissi@arouaschools.ma', 'assistant', 'Services', ARRAY['مربية ومساعدة أولي']::TEXT[], ARRAY['روض أول (PS)', 'تمهيدي (GS)']::TEXT[], 4200.00, 0.00, 'Banque Populaire', '011780000321654987012345', 'active'),
    ('STF-AROUA-007', 'كريم التازي', 'C118833', '77221100', '0667788990', 'karim.tazi@arouaschools.ma', 'teacher', 'Pedagogique', ARRAY['الفيزياء والكيمياء (مغادر)']::TEXT[], ARRAY['سلك إعدادي']::TEXT[], 0.00, 3500.00, 'CIH Bank', '230810000111222333444555', 'departed')
ON CONFLICT (external_staff_id) DO NOTHING;

-- 6. تفعيل أمان الصفوف RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payroll ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read employees" ON public.employees FOR SELECT USING (true);
    CREATE POLICY "Allow write employees" ON public.employees FOR ALL USING (true);
    CREATE POLICY "Allow read staff_advances" ON public.staff_advances FOR SELECT USING (true);
    CREATE POLICY "Allow write staff_advances" ON public.staff_advances FOR ALL USING (true);
    CREATE POLICY "Allow read monthly_payroll" ON public.monthly_payroll FOR SELECT USING (true);
    CREATE POLICY "Allow write monthly_payroll" ON public.monthly_payroll FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
