-- ==============================================================================
-- AROUA AUDIT - STAGE 7: EXPENSES & CHARGES MIGRATION
-- Migration Version: 20261004000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- 1. جدول أبواب وتصنيفات النفقات ومخصصات الميزانية (Natures / Rubriques Budgétaires)
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- مثال: 'LOYER', 'ENERGIE', 'TRANSPORT_CARB', 'FOURNITURES', 'MAINTENANCE'
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    charge_type TEXT NOT NULL DEFAULT 'variable' CHECK (charge_type IN ('fixe', 'variable')),
    budget_allocation DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- الميزانية السنوية المرصودة
    color_hex TEXT DEFAULT '#6366f1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول النفقات والمصروفات المدرسية (Dépenses & Factures)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT UNIQUE NOT NULL, -- e.g. 'DEP-2026-001'
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    category_code TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    beneficiary_name TEXT NOT NULL, -- المورد / الدائن / الجهة المستفيدة
    beneficiary_ice TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('especes', 'cheque', 'virement')),
    payment_source TEXT NOT NULL DEFAULT 'caisse_centrale', -- 'caisse_centrale', 'banque_attijari', 'banque_bp', etc.
    check_or_trans_ref TEXT,
    invoice_reference TEXT, -- رقم فاتورة المورد
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    authorized_by TEXT NOT NULL DEFAULT 'الإدارة العامة',
    description TEXT NOT NULL,
    receipt_attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول وسجل سندات الصرف الرسمية (Bons de Décaissement)
CREATE TABLE IF NOT EXISTS public.expense_disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number TEXT UNIQUE NOT NULL, -- e.g. 'DEC-2026-001'
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    beneficiary TEXT NOT NULL,
    recipient_cin TEXT,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('especes', 'cheque', 'virement')),
    check_number TEXT,
    bank_name TEXT,
    treasury_source TEXT NOT NULL,
    disbursed_by TEXT NOT NULL, -- أمين الصندوق
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس تسريع الاستعلام
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_code);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_date ON public.expense_disbursements(disbursement_date DESC);

-- تفعيل أمان الصفوف (RLS)
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_disbursements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read expense_categories" ON public.expense_categories FOR SELECT USING (true);
    CREATE POLICY "Allow write expense_categories" ON public.expense_categories FOR ALL USING (true);
    CREATE POLICY "Allow read expenses" ON public.expenses FOR SELECT USING (true);
    CREATE POLICY "Allow write expenses" ON public.expenses FOR ALL USING (true);
    CREATE POLICY "Allow read expense_disbursements" ON public.expense_disbursements FOR SELECT USING (true);
    CREATE POLICY "Allow write expense_disbursements" ON public.expense_disbursements FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- بذور البيانات النموذجية لأبواب النفقات
INSERT INTO public.expense_categories (id, code, name_ar, name_fr, charge_type, budget_allocation, color_hex)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'LOYER', 'كراء المقرات والمباني المدرسية', 'Loyer des locaux scolaires', 'fixe', 360000.00, '#6366f1'),
    ('10000000-0000-0000-0000-000000000002', 'ENERGIE', 'الماء والكهرباء والإنترنت', 'Eau, Électricité & Télécoms', 'variable', 85000.00, '#06b6d4'),
    ('10000000-0000-0000-0000-000000000003', 'TRANSPORT_CARB', 'محروقات وصيانة أسطول الحافلات', 'Carburant & Entretien Transport', 'variable', 180000.00, '#f59e0b'),
    ('10000000-0000-0000-0000-000000000004', 'FOURNITURES', 'لوازم ومطبوعات ووسائل تعليمية', 'Fournitures & Supports Pédagogiques', 'variable', 95000.00, '#10b981'),
    ('10000000-0000-0000-0000-000000000005', 'MAINTENANCE', 'الصيانة العامة والنظافة والأمن', 'Maintenance générale, Hygiène & Sécurité', 'variable', 70000.00, '#ec4899'),
    ('10000000-0000-0000-0000-000000000006', 'HONORAIRES', 'أتعاب مهنية وتأمينات مدرسية', 'Honoraires, Assurance & Fiscalité', 'fixe', 110000.00, '#8b5cf6')
ON CONFLICT (code) DO NOTHING;

-- بذور عينة من النفقات الواقعية
INSERT INTO public.expenses (
    id, reference_no, category_id, category_code, expense_date, amount, beneficiary_name, beneficiary_ice, payment_method, payment_source, check_or_trans_ref, invoice_reference, status, academic_year, authorized_by, description
) VALUES
    ('20000000-0000-0000-0000-000000000001', 'DEP-2026-001', '10000000-0000-0000-0000-000000000001', 'LOYER', '2026-09-01', 30000.00, 'السيد أحمد بنجلون (مالك العقار)', '001234567890123', 'virement', 'banque_attijari', 'VIR-ATJ-8812', 'QUITT-LOY-0926', 'paid', '2026/2027', 'المدير العام', 'واجب كراء المقر المدرسي لشهر شتنبر 2026'),
    ('20000000-0000-0000-0000-000000000002', 'DEP-2026-002', '10000000-0000-0000-0000-000000000002', 'ENERGIE', '2026-09-08', 6450.00, 'شركة ريضال للماء والكهرباء', '000112233445566', 'prelevement', 'banque_bp', 'PRL-RED-901', 'FAC-RED-2026-90', 'paid', '2026/2027', 'المدير المالي', 'فاتورة استهلاك الكهرباء والماء لشهر غشت للمبنى أ و ب'),
    ('20000000-0000-0000-0000-000000000003', 'DEP-2026-003', '10000000-0000-0000-0000-000000000003', 'TRANSPORT_CARB', '2026-09-12', 12800.00, 'محطة إفريقيا للمحروقات - حسان', '000334455667788', 'cheque', 'banque_attijari', 'CHQ-990142', 'FAC-AFR-4412', 'paid', '2026/2027', 'مسؤول النقل', 'شحن بطاقات وقود الديزل لأسطول 4 حافلات مدرسية'),
    ('20000000-0000-0000-0000-000000000004', 'DEP-2026-004', '10000000-0000-0000-0000-000000000004', 'FOURNITURES', '2026-09-15', 8900.00, 'مكتبة ومطبعة النجاح الرباط', '000445566778899', 'especes', 'caisse_centrale', null, 'FAC-NJH-1082', 'paid', '2026/2027', 'الإدارة العامة', 'طباعة دفاتر المراسلة وسجلات الحضور والملفات المدرسية'),
    ('20000000-0000-0000-0000-000000000005', 'DEP-2026-005', '10000000-0000-0000-0000-000000000005', 'MAINTENANCE', '2026-09-20', 3500.00, 'مؤسسة الأمان للصيانة والتكييف', '000556677889900', 'especes', 'caisse_centrale', null, 'BON-LIV-0931', 'paid', '2026/2027', 'المقتصد', 'صيانة مكيفات القاعات الدراسية وتبديل مصابيح LED'),
    ('20000000-0000-0000-0000-000000000006', 'DEP-2026-006', '10000000-0000-0000-0000-000000000006', 'HONORAIRES', '2026-09-25', 9200.00, 'شركة سهام للتأمين المدرسي', '000667788990011', 'cheque', 'banque_bp', 'CHQ-445109', 'POL-ASS-2026', 'paid', '2026/2027', 'المدير العام', 'قسط التأمين السنوي الشامل على التلاميذ والأطر التربوية')
ON CONFLICT (reference_no) DO NOTHING;

-- بذور عينة من سندات الصرف (Bons de Décaissement)
INSERT INTO public.expense_disbursements (
    id, voucher_number, expense_id, disbursement_date, amount, beneficiary, recipient_cin, payment_mode, check_number, bank_name, treasury_source, disbursed_by, notes
) VALUES
    ('30000000-0000-0000-0000-000000000001', 'DEC-2026-001', '20000000-0000-0000-0000-000000000004', '2026-09-15', 8900.00, 'مكتبة ومطبعة النجاح (السيد رشيد السالمي)', 'AB554433', 'especes', null, null, 'الصندوق المركزي', 'فاطمة الزهراء (أمينة الصندوق)', 'صرف نقدي مقابل تسليم مطبوعات ودفاتر المراسلة'),
    ('30000000-0000-0000-0000-000000000002', 'DEC-2026-002', '20000000-0000-0000-0000-000000000005', '2026-09-20', 3500.00, 'مؤسسة الأمان (السيد مراد الفاسي)', 'CD112233', 'especes', null, null, 'الصندوق المركزي', 'فاطمة الزهراء (أمينة الصندوق)', 'صرف نقدي لأعمال الصيانة والتكييف')
ON CONFLICT (voucher_number) DO NOTHING;
