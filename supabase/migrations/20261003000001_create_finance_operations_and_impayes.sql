-- ==============================================================================
-- AROUA AUDIT - STAGE 6: FINANCE OPERATIONS & IMPAYÉS MIGRATION
-- Migration Version: 20261003000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- ==============================================================================
-- 1. جدول الأرصدة الزائدة والفوائض المالية (Soldes en plus / Crédits Élèves)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_credit_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    academic_level TEXT NOT NULL,
    credit_amount DECIMAL(10, 2) NOT NULL CHECK (credit_amount > 0),
    source_payment_reference TEXT,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'carried_over', 'refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_student ON public.student_credit_balances(student_id);
CREATE INDEX IF NOT EXISTS idx_credit_status ON public.student_credit_balances(status);

-- ==============================================================================
-- 2. جدول التخفيضات والإعفاءات والمجانيات (Réductions & Gratuités)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_discounts_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    academic_level TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'reduction_mensuelle', -- تخفيض شهري (إخوة / اتفاقيات)
        'reduction_annuelle',  -- تخفيض سنوي مقطوع
        'gratuite_totale',     -- إعفاء كامل (أبناء العاملين / منح)
        'gratuite_partielle'   -- إعفاء جزئي لخدمة محددة
    )),
    service_type TEXT NOT NULL DEFAULT 'scolarite' CHECK (service_type IN ('scolarite', 'transport', 'cantine', 'all')),
    rate_or_amount DECIMAL(10, 2) NOT NULL, -- نسبة مئوية % أو مبلغ ثابت بالدرهم
    is_percentage BOOLEAN DEFAULT true,
    beneficiary_relation TEXT, -- مثال: 'ابن الأستاذ(ة)', 'أخ ثان (10%)', 'أخ ثالث (20%)'
    approved_by TEXT NOT NULL DEFAULT 'الإدارة العامة',
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discounts_student ON public.student_discounts_exemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_discounts_type ON public.student_discounts_exemptions(type);

-- ==============================================================================
-- 3. جدول يومية التسديدات والمدفوعات المدرسية (Règlements & Payments Journal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_payments_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    academic_level TEXT NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('especes', 'cheque', 'virement')),
    service_breakdown JSONB DEFAULT '{"scolarite": 0, "transport": 0, "cantine": 0, "frais_inscription": 0}'::JSONB,
    cashier_agent TEXT NOT NULL,
    check_or_bank_ref TEXT,
    period_month TEXT, -- '2026-09'
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_journal_date ON public.student_payments_journal(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_journal_student ON public.student_payments_journal(student_id);

-- ==============================================================================
-- 4. جدول المستحقات غير المؤداة والمتأخرات (Impayés & Receivables Tracker)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_impayes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    academic_level TEXT NOT NULL,
    classroom_group TEXT,
    guardian_phone TEXT,
    guardian_whatsapp TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('scolarite', 'transport', 'cantine', 'all')),
    amount_due DECIMAL(10, 2) NOT NULL CHECK (amount_due > 0),
    due_month TEXT NOT NULL, -- مثال: '2026-09'
    aging_category TEXT NOT NULL DEFAULT 'current' CHECK (aging_category IN ('current', '30_days', '60_days', '90_plus')),
    recovery_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (recovery_status IN ('unpaid', 'contacted', 'promised', 'litigation', 'settled')),
    promise_date DATE,
    last_reminder_sent_at TIMESTAMPTZ,
    reminder_count INT DEFAULT 0,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impayes_student ON public.student_impayes(student_id);
CREATE INDEX IF NOT EXISTS idx_impayes_status ON public.student_impayes(recovery_status);
CREATE INDEX IF NOT EXISTS idx_impayes_aging ON public.student_impayes(aging_category);
CREATE INDEX IF NOT EXISTS idx_impayes_service ON public.student_impayes(service_type);

-- ==============================================================================
-- 5. تفعيل أمان الصفوف (Row Level Security)
-- ==============================================================================
ALTER TABLE public.student_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_discounts_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_impayes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read credit_balances" ON public.student_credit_balances FOR SELECT USING (true);
    CREATE POLICY "Allow write credit_balances" ON public.student_credit_balances FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read discounts" ON public.student_discounts_exemptions FOR SELECT USING (true);
    CREATE POLICY "Allow write discounts" ON public.student_discounts_exemptions FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read payments_journal" ON public.student_payments_journal FOR SELECT USING (true);
    CREATE POLICY "Allow write payments_journal" ON public.student_payments_journal FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read impayes" ON public.student_impayes FOR SELECT USING (true);
    CREATE POLICY "Allow write impayes" ON public.student_impayes FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 6. بذور البيانات النموذجية والواقعية (Seed Data)
-- ==============================================================================
-- أ. الأرصدة الزائدة
INSERT INTO public.student_credit_balances (
    id, student_id, student_name, academic_level, credit_amount, source_payment_reference, academic_year, status, notes
) VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'STU-2026-001', 'ياسين المنصوري', 'CE1', 750.00, 'REC-2026-0891', '2026/2027', 'available', 'دفعة تمدرس زائدة عن شهر شتنبر'),
    ('d0000000-0000-0000-0000-000000000002', 'STU-2026-004', 'مريم الودغيري', '6ème AEP', 400.00, 'VIR-BNK-4412', '2026/2027', 'available', 'فائض تحويل بنكي للنقل المدرسي')
ON CONFLICT (id) DO NOTHING;

-- ب. التخفيضات والإعفاءات
INSERT INTO public.student_discounts_exemptions (
    id, student_id, student_name, academic_level, type, service_type, rate_or_amount, is_percentage, beneficiary_relation, approved_by, academic_year, is_active
) VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'STU-2026-002', 'هبة العمراني', 'CP', 'reduction_mensuelle', 'scolarite', 10.00, true, 'أخ ثان مسجل بالمؤسسة (10%)', 'الإدارة العامة', '2026/2027', true),
    ('e0000000-0000-0000-0000-000000000002', 'STU-2026-005', 'حمزة التازي', 'CM2', 'reduction_mensuelle', 'transport', 20.00, true, 'تخفيض خط النقل المدرسي الموحد', 'إدارة النقل', '2026/2027', true),
    ('e0000000-0000-0000-0000-000000000003', 'STU-2026-008', 'أيمن الإدريسي', '1ère Année Collège', 'gratuite_totale', 'scolarite', 100.00, true, 'ابن أستاذ بالمؤسسة (منحة كاملة)', 'مجلس الإدارة', '2026/2027', true),
    ('e0000000-0000-0000-0000-000000000004', 'STU-2026-009', 'غيثة بنجلون', 'Tronc Commun', 'gratuite_partielle', 'cantine', 100.00, true, 'إعفاء وجبة المطعم المدرسي (دعم اجتماعي)', 'الإدارة العامة', '2026/2027', true)
ON CONFLICT (id) DO NOTHING;

-- ج. يومية التسديدات
INSERT INTO public.student_payments_journal (
    id, receipt_number, student_id, student_name, academic_level, payment_date, amount_paid, payment_method, service_breakdown, cashier_agent, check_or_bank_ref, period_month, academic_year, notes
) VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'REC-2026-0901', 'STU-2026-001', 'ياسين المنصوري', 'CE1', '2026-09-05', 2800.00, 'especes', '{"scolarite": 2100, "transport": 450, "cantine": 250, "frais_inscription": 0}'::JSONB, 'فاطمة الزهراء (صندوق 1)', null, '2026-09', '2026/2027', 'سداد مستحقات شتنبر كاملاً'),
    ('f0000000-0000-0000-0000-000000000002', 'REC-2026-0902', 'STU-2026-002', 'هبة العمراني', 'CP', '2026-09-08', 2340.00, 'cheque', '{"scolarite": 1890, "transport": 450, "cantine": 0, "frais_inscription": 0}'::JSONB, 'عمر السبتي (صندوق 2)', 'CHQ-774321', '2026-09', '2026/2027', 'مع تطبيق تخفيض الأخ الثاني 10%'),
    ('f0000000-0000-0000-0000-000000000003', 'REC-2026-0903', 'STU-2026-003', 'سفيان بلمقدم', 'CE2', '2026-09-12', 2600.00, 'virement', '{"scolarite": 2200, "transport": 0, "cantine": 400, "frais_inscription": 0}'::JSONB, 'المسير المركزي', 'VIR-BP-99120', '2026-09', '2026/2027', 'تحويل عبر الحساب الجاري')
ON CONFLICT (receipt_number) DO NOTHING;

-- د. المتأخرات والديون (Impayés)
INSERT INTO public.student_impayes (
    id, student_id, student_name, academic_level, classroom_group, guardian_phone, guardian_whatsapp, service_type, amount_due, due_month, aging_category, recovery_status, promise_date, reminder_count, academic_year, notes
) VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'STU-2026-006', 'أنس السبتي', '3ème AEP', 'فوج أ', '0661223344', '0661223344', 'scolarite', 2100.00, '2026-09', 'current', 'unpaid', null, 0, '2026/2027', 'مستحقات واجب التمدرس لشهر شتنبر'),
    ('c0000000-0000-0000-0000-000000000002', 'STU-2026-007', 'سلمى العلوي', 'CM1', 'فوج ب', '0662334455', '0662334455', 'transport', 600.00, '2026-09', 'current', 'contacted', '2026-10-02', 1, '2026/2027', 'متأخرات اشتراك حافلة النقل المدرسي'),
    ('c0000000-0000-0000-0000-000000000003', 'STU-2026-010', 'ريان بناني', 'CE5', 'فوج أ', '0663445566', '0663445566', 'scolarite', 4200.00, '2026-08', '60_days', 'promised', '2026-10-05', 2, '2026/2027', 'متأخرات شتنبر وغشت - تم وعد أمين الصندوق بالتسديد نقداً'),
    ('c0000000-0000-0000-0000-000000000004', 'STU-2026-011', 'عالية الفاسي', 'Tronc Commun', 'فوج ج', '0664556677', '0664556677', 'cantine', 800.00, '2026-09', 'current', 'unpaid', null, 0, '2026/2027', 'واجب المطعم المدرسي لشهرين'),
    ('c0000000-0000-0000-0000-000000000005', 'STU-2026-012', 'يحيى المرابط', '2ème BAC', 'علوم رياضية', '0665667788', '0665667788', 'all', 6800.00, '2026-06', '90_plus', 'litigation', null, 4, '2026/2027', 'ديون متراكمة من الموسم السابق - قيد المتابعة القانونية من الإدارة')
ON CONFLICT (id) DO NOTHING;
