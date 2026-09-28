-- ==============================================================================
-- AROUA AUDIT - STAGE 8: AUXILIARY SCHOOL SERVICES CONFIGURATION MIGRATION
-- Migration Version: 20261005000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- 1. جدول خطوط وأسطول النقل المدرسي (Transport Lines & Fleet)
CREATE TABLE IF NOT EXISTS public.transport_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_code TEXT UNIQUE NOT NULL, -- e.g. 'LINE-MHAMID-01'
    line_name TEXT NOT NULL,        -- 'خط المحاميد - أسكجور - أروى'
    bus_registration TEXT NOT NULL, -- ترقيم الحافلة / اللوحة المعدنية
    bus_brand TEXT DEFAULT 'Mercedes Sprinter',
    capacity INT NOT NULL CHECK (capacity > 0),
    driver_name TEXT NOT NULL,      -- مرتبط بالسائق المعتمد
    driver_phone TEXT,
    assistant_name TEXT,            -- المرافقة
    assistant_phone TEXT,
    zone_coverage TEXT NOT NULL,    -- الأحياء والمناطق المشمولة
    monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 350.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول صيغ واشتراكات المطعم المدرسي (Canteen Meal Plans)
CREATE TABLE IF NOT EXISTS public.canteen_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT UNIQUE NOT NULL, -- e.g. 'CANT-FULL-M'
    name_ar TEXT NOT NULL,          -- 'نصف داخلي كامل (وجبة غذاء + لمجة)'
    name_fr TEXT NOT NULL,          -- 'Demi-Pension Complète'
    frequency TEXT NOT NULL CHECK (frequency IN ('mensuel', 'trimestriel', 'annuel', 'carnet_tickets')),
    fee_amount DECIMAL(10, 2) NOT NULL CHECK (fee_amount > 0),
    daily_meal_desc TEXT,           -- وصف البرنامج الغذائي
    max_capacity INT NOT NULL DEFAULT 120,
    is_active BOOLEAN NOT NULL DEFAULT true,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول حزم اللوازم والكتب والمحفظة والمآزر (Supplies & Uniform Packs)
CREATE TABLE IF NOT EXISTS public.supplies_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_code TEXT UNIQUE NOT NULL, -- e.g. 'PACK-CP-2026'
    academic_level TEXT NOT NULL,   -- 'CP', 'CE1', 'CE2', etc.
    title_ar TEXT NOT NULL,         -- 'حزمة كتب ومستلزمات ومحفظة الأول ابتدائي'
    title_fr TEXT NOT NULL,         -- 'Pack Manuels & Fournitures CP'
    items_count INT NOT NULL DEFAULT 8,
    cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0),  -- سعر التكلفة على المؤسسة
    selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= cost_price), -- سعر البيع للأسرة
    stock_available INT NOT NULL DEFAULT 50 CHECK (stock_available >= 0),
    stock_sold INT NOT NULL DEFAULT 0,
    items_breakdown JSONB DEFAULT '[]'::JSONB, -- قائمة المقررات والكراريس المشمولة
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس تسريع البحث
CREATE INDEX IF NOT EXISTS idx_transport_year ON public.transport_lines(academic_year);
CREATE INDEX IF NOT EXISTS idx_canteen_year ON public.canteen_plans(academic_year);
CREATE INDEX IF NOT EXISTS idx_supplies_level ON public.supplies_packs(academic_level);

-- تفعيل أمان الصفوف (RLS)
ALTER TABLE public.transport_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplies_packs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read transport_lines" ON public.transport_lines FOR SELECT USING (true);
    CREATE POLICY "Allow write transport_lines" ON public.transport_lines FOR ALL USING (true);
    CREATE POLICY "Allow read canteen_plans" ON public.canteen_plans FOR SELECT USING (true);
    CREATE POLICY "Allow write canteen_plans" ON public.canteen_plans FOR ALL USING (true);
    CREATE POLICY "Allow read supplies_packs" ON public.supplies_packs FOR SELECT USING (true);
    CREATE POLICY "Allow write supplies_packs" ON public.supplies_packs FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- بذور البيانات الواقعية لمدينة مراكش ومؤسسة أروى
INSERT INTO public.transport_lines (
    id, line_code, line_name, bus_registration, bus_brand, capacity, driver_name, driver_phone, assistant_name, assistant_phone, zone_coverage, monthly_fee, is_active, academic_year
) VALUES
    ('40000000-0000-0000-0000-000000000001', 'LIGNE-01', 'خط المحاميد - صوكوما - برادي', '28-أ-49120', 'Mercedes Sprinter 516', 28, 'الحسين أيت علي', '0661998877', 'فاطمة باسو', '0665112233', 'المحاميد 7، المحاميد 9، صوكوما 1 و 2، إقامة برادي', 350.00, true, '2026/2027'),
    ('40000000-0000-0000-0000-000000000002', 'LIGNE-02', 'خط المسيرة - الضحى أبواب مراكش', '28-أ-51203', 'Iveco Daily Tourys', 30, 'عبد اللطيف الوردي', '0662334411', 'أمينة التازي', '0667889900', 'المسيرة 1 و 2، أبواب مراكش، حي السعادة', 400.00, true, '2026/2027'),
    ('40000000-0000-0000-0000-000000000003', 'LIGNE-03', 'خط الداوديات - إزيكي - تاركة', '28-ب-12904', 'Ford Transit Minibus', 24, 'مصطفى الناصري', '0664556622', 'حياة الإدريسي', '0668223344', 'إزيكي، بوعكاز، تاركة، المسار', 450.00, true, '2026/2027')
ON CONFLICT (line_code) DO NOTHING;

INSERT INTO public.canteen_plans (
    id, plan_code, name_ar, name_fr, frequency, fee_amount, daily_meal_desc, max_capacity, is_active, academic_year
) VALUES
    ('50000000-0000-0000-0000-000000000001', 'PLAN-MENS-FULL', 'نصف إقامة شهري كامل (وجبة الغداء + لمجة)', 'Demi-Pension Complète Mensuelle', 'mensuel', 450.00, 'وجبة غداء متوازنة مع مقبلات وطبق رئيسي وفاكهة + استراحة لمجة مسائية', 150, true, '2026/2027'),
    ('50000000-0000-0000-0000-000000000002', 'PLAN-TRIM-FULL', 'نصف إقامة فصلي (توفير 10%)', 'Formule Trimestrielle Économique', 'trimestriel', 1200.00, 'تغطية وجبات الغداء لشهور الفصل الدراسي الثلاثة', 100, true, '2026/2027'),
    ('50000000-0000-0000-0000-000000000003', 'PLAN-CARNET-10', 'دفتر تذاكر الوجبات الفردية (10 تذاكر مرنة)', 'Carnet de 10 Repas Flexibles', 'carnet_tickets', 250.00, 'استهلاك الوجبات حسب رغبة الأسرة في أيام محددة بالأسبوع', 80, true, '2026/2027')
ON CONFLICT (plan_code) DO NOTHING;

INSERT INTO public.supplies_packs (
    id, pack_code, academic_level, title_ar, title_fr, items_count, cost_price, selling_price, stock_available, stock_sold, items_breakdown, academic_year, is_active
) VALUES
    ('60000000-0000-0000-0000-000000000001', 'PACK-CP-2026', 'CP', 'حزمة كتب ومحفظة ومئزر الأول ابتدائي', 'Pack Scolaire CP Intégral', 12, 420.00, 580.00, 45, 32, '[{"name": "كتاب القراءة المفيد", "qty": 1}, {"name": "كتاب Dire, faire et agir", "qty": 1}, {"name": "دفاتر ومسطرة وألوان", "qty": 6}, {"name": "مئزر مدرسي موحد بشعار أروى", "qty": 1}]'::JSONB, '2026/2027', true),
    ('60000000-0000-0000-0000-000000000002', 'PACK-CE1-2026', 'CE1', 'حزمة كتب ومستلزمات الثاني ابتدائي', 'Pack Scolaire CE1 Intégral', 14, 460.00, 640.00, 40, 28, '[{"name": "كتابي في اللغة العربية", "qty": 1}, {"name": "Pour communiquer en français", "qty": 1}, {"name": "دفاتر تجارب ورسم وأدوات هندسية", "qty": 8}]'::JSONB, '2026/2027', true),
    ('60000000-0000-0000-0000-000000000003', 'PACK-6AEP-2026', '6ème AEP', 'حزمة مقررات ودفاتر السادس ابتدائي', 'Pack Scolaire 6AEP Examen', 16, 520.00, 720.00, 35, 20, '[{"name": "كتاب المنير في اللغة العربية", "qty": 1}, {"name": "Parcours Français 6e", "qty": 1}, {"name": "النجاح في الرياضيات ومراجع الدعم", "qty": 2}]'::JSONB, '2026/2027', true)
ON CONFLICT (pack_code) DO NOTHING;
