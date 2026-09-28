-- ==============================================================================
-- AROUA AUDIT - STAGE 5: CHECKS, BANK ACCOUNTS & REMISES MIGRATION
-- Migration Version: 20261002000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- ==============================================================================
-- 1. جدول الحسابات البنكية والخزائن (Bank Accounts & Treasury Vaults)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,          -- مثال: 'الحساب الرئيسي - التجاري وفا بنك'
    bank_name TEXT NOT NULL,             -- 'Attijariwafa Bank', 'Banque Populaire', 'CIH', 'BMCE'
    rib TEXT UNIQUE NOT NULL,            -- معرف الحساب البنكي 24 رقماً
    account_number TEXT,
    agency TEXT,
    initial_balance DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. جدول حوافظ تسليم الشيكات للبنك (Bordereaux de Remise)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bank_remises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remise_number TEXT UNIQUE NOT NULL,  -- مثال: 'REM-2026-001'
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    remise_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    checks_count INT NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'deposited' CHECK (status IN ('draft', 'deposited', 'cleared', 'rejected')),
    created_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remises_date ON public.bank_remises(remise_date DESC);
CREATE INDEX IF NOT EXISTS idx_remises_account ON public.bank_remises(bank_account_id);

-- ==============================================================================
-- 3. جدول محفظة الشيكات والكمبيالات (Checks Portfolio)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.checks_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    issuer_name TEXT NOT NULL,           -- الساحب (ولي الأمر / شريك / مزود)
    student_id TEXT,
    beneficiary TEXT NOT NULL DEFAULT 'Ets Aroua',
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,              -- تاريخ استحقاق الصرف
    deposit_date DATE,                   -- تاريخ الدفع الفعلي للبنك
    clearance_date DATE,                 -- تاريخ الصرف الفعلي في الكشف
    remise_id UUID REFERENCES public.bank_remises(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'en_portefeuille' 
        CHECK (status IN (
            'en_portefeuille',  -- في المحفظة / الخزنة
            'a_deposer',        -- حان موعد استحقاقه وجاهز للإيداع
            'remis',            -- أُرسل للبنك ضمن حافظة تسليم
            'encaisse',         -- تم صرفه وأضيف للرصيد البنكي
            'rejete',           -- شيك راجع بدون رصيد (Impayé)
            'restitue'          -- تم إرجاعه للمستفيد/ولي الأمر
        )),
    rejection_reason TEXT,
    check_image_url TEXT,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ربط student_id بجدول students إذا كان موجوداً
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_checks_student' AND table_name = 'checks_portfolio'
        ) THEN
            ALTER TABLE public.checks_portfolio 
            ADD CONSTRAINT fk_checks_student FOREIGN KEY (student_id) 
            REFERENCES public.students(student_id) ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- فهرسة سريعة للبحث برقم الشيك وتاريخ الاستحقاق
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON public.checks_portfolio(due_date);
CREATE INDEX IF NOT EXISTS idx_checks_status ON public.checks_portfolio(status);
CREATE INDEX IF NOT EXISTS idx_checks_student ON public.checks_portfolio(student_id);
CREATE INDEX IF NOT EXISTS idx_checks_remise ON public.checks_portfolio(remise_id);

-- ==============================================================================
-- 4. مشغل تلقائي لتحديث إجمالي حافظة التسليم (Trigger on Remise)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_remise_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        IF OLD.remise_id IS NOT NULL THEN
            UPDATE public.bank_remises
            SET 
                checks_count = (SELECT COUNT(*) FROM public.checks_portfolio WHERE remise_id = OLD.remise_id),
                total_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.checks_portfolio WHERE remise_id = OLD.remise_id)
            WHERE id = OLD.remise_id;
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.remise_id IS NOT NULL THEN
            UPDATE public.bank_remises
            SET 
                checks_count = (SELECT COUNT(*) FROM public.checks_portfolio WHERE remise_id = NEW.remise_id),
                total_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.checks_portfolio WHERE remise_id = NEW.remise_id)
            WHERE id = NEW.remise_id;
        END IF;
        IF (TG_OP = 'UPDATE' AND OLD.remise_id IS NOT NULL AND OLD.remise_id != NEW.remise_id) THEN
            UPDATE public.bank_remises
            SET 
                checks_count = (SELECT COUNT(*) FROM public.checks_portfolio WHERE remise_id = OLD.remise_id),
                total_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.checks_portfolio WHERE remise_id = OLD.remise_id)
            WHERE id = OLD.remise_id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_remise_totals ON public.checks_portfolio;
CREATE TRIGGER trg_sync_remise_totals
AFTER INSERT OR UPDATE OF remise_id, amount OR DELETE ON public.checks_portfolio
FOR EACH ROW EXECUTE FUNCTION public.sync_remise_totals();

-- ==============================================================================
-- 5. تفعيل أمان الصفوف (Row Level Security)
-- ==============================================================================
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_remises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks_portfolio ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read bank_accounts" ON public.bank_accounts FOR SELECT USING (true);
    CREATE POLICY "Allow write bank_accounts" ON public.bank_accounts FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read bank_remises" ON public.bank_remises FOR SELECT USING (true);
    CREATE POLICY "Allow write bank_remises" ON public.bank_remises FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Allow read checks_portfolio" ON public.checks_portfolio FOR SELECT USING (true);
    CREATE POLICY "Allow write checks_portfolio" ON public.checks_portfolio FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 6. بذور البيانات الواقعية النموذجية (Seed Data)
-- ==============================================================================
-- أ. الحسابات البنكية
INSERT INTO public.bank_accounts (
    id, account_name, bank_name, rib, account_number, agency, initial_balance, current_balance, is_active
) VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'الحساب الرئيسي للمؤسسة - التجاري وفا بنك', 'Attijariwafa Bank', '007780000123456789012345', '000123456789', 'وكالة أكدال - الرباط', 250000.00, 385400.00, true),
    ('a0000000-0000-0000-0000-000000000002', 'حساب الرسوم والدراسة - البنك الشعبي', 'Banque Populaire', '101780000234567890123456', '000234567890', 'وكالة حسان - الرباط', 150000.00, 214800.00, true),
    ('a0000000-0000-0000-0000-000000000003', 'حساب الاستثمار والتجهيز - بنك CIH', 'CIH Bank', '230780000345678901234567', '000345678901', 'وكالة الرياض - الرباط', 80000.00, 142000.00, true),
    ('a0000000-0000-0000-0000-000000000004', 'حساب الخزينة والاحتياط - بنك أوف أفريقيا', 'Bank of Africa', '011780000456789012345678', '000456789012', 'وكالة السويسي - الرباط', 50000.00, 95500.00, true)
ON CONFLICT (rib) DO UPDATE 
SET current_balance = EXCLUDED.current_balance, updated_at = NOW();

-- ب. حوافظ تسليم الشيكات (Bordereaux de Remise)
INSERT INTO public.bank_remises (
    id, remise_number, bank_account_id, remise_date, total_amount, checks_count, status, created_by, notes
) VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'REM-2026-001', 'a0000000-0000-0000-0000-000000000001', '2026-09-10', 42500.00, 3, 'cleared', 'المسير العام', 'إيداع شيكات الدفعة الأولى - بداية الموسم'),
    ('b0000000-0000-0000-0000-000000000002', 'REM-2026-002', 'a0000000-0000-0000-0000-000000000001', '2026-09-22', 28000.00, 2, 'deposited', 'أمين الصندوق', 'إيداع واجبات التمدرس لشهر سبتمبر')
ON CONFLICT (remise_number) DO NOTHING;

-- ج. محفظة الشيكات
INSERT INTO public.checks_portfolio (
    id, check_number, bank_name, issuer_name, student_id, beneficiary, amount, received_date, due_date, deposit_date, clearance_date, remise_id, status, rejection_reason, academic_year
) VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'CHQ-892144', 'Attijariwafa Bank', 'محمد المنصوري', 'STU-2026-001', 'Ets Aroua', 15000.00, '2026-09-02', '2026-09-08', '2026-09-10', '2026-09-12', 'b0000000-0000-0000-0000-000000000001', 'encaisse', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000002', 'CHQ-774321', 'Banque Populaire', 'كريم العمراني', 'STU-2026-002', 'Ets Aroua', 13500.00, '2026-09-03', '2026-09-09', '2026-09-10', '2026-09-13', 'b0000000-0000-0000-0000-000000000001', 'encaisse', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000003', 'CHQ-991204', 'CIH Bank', 'رشيد بلمقدم', 'STU-2026-003', 'Ets Aroua', 14000.00, '2026-09-05', '2026-09-10', '2026-09-10', '2026-09-14', 'b0000000-0000-0000-0000-000000000001', 'encaisse', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000004', 'CHQ-331902', 'Bank of Africa', 'سعاد الودغيري', 'STU-2026-004', 'Ets Aroua', 16000.00, '2026-09-12', '2026-09-20', '2026-09-22', null, 'b0000000-0000-0000-0000-000000000002', 'remis', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000005', 'CHQ-445890', 'Société Générale', 'أحمد التازي', 'STU-2026-005', 'Ets Aroua', 12000.00, '2026-09-15', '2026-09-21', '2026-09-22', null, 'b0000000-0000-0000-0000-000000000002', 'remis', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000006', 'CHQ-112345', 'Attijariwafa Bank', 'عمر السبتي', 'STU-2026-006', 'Ets Aroua', 18500.00, '2026-09-18', '2026-09-25', null, null, null, 'a_deposer', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000007', 'CHQ-556789', 'Banque Populaire', 'فاطمة الزهراء العلوي', 'STU-2026-007', 'Ets Aroua', 9500.00, '2026-09-20', '2026-09-27', null, null, null, 'a_deposer', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000008', 'CHQ-667890', 'CIH Bank', 'طارق الإدريسي', 'STU-2026-008', 'Ets Aroua', 11000.00, '2026-09-22', '2026-10-05', null, null, null, 'en_portefeuille', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000009', 'CHQ-778901', 'Bank of Africa', 'يوسف بنجلون', 'STU-2026-009', 'Ets Aroua', 13000.00, '2026-09-24', '2026-10-15', null, null, null, 'en_portefeuille', null, '2026/2027'),
    ('c0000000-0000-0000-0000-000000000010', 'CHQ-889012', 'Attijariwafa Bank', 'سميرة بناني', 'STU-2026-010', 'Ets Aroua', 8500.00, '2026-09-10', '2026-09-18', '2026-09-19', null, null, 'rejete', 'انعدام المؤونة الكافية في الحساب (Défaut de provision)', '2026/2027'),
    ('c0000000-0000-0000-0000-000000000011', 'CHQ-990123', 'BMCI', 'نور الدين الفاسي', 'STU-2026-011', 'Ets Aroua', 6000.00, '2026-09-08', '2026-09-15', null, null, null, 'restitue', 'تم استبداله بأداء نقدي مباشر مع وصل', '2026/2027')
ON CONFLICT (id) DO NOTHING;
