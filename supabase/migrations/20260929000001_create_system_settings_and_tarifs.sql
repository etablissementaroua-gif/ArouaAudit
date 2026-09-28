-- ==============================================================================
-- AROUA AUDIT - SYSTEM SETTINGS & TARIFS ENGINE MIGRATION
-- Migration Version: 20260929000001
-- Targets: PostgreSQL (Supabase Engine)
-- ==============================================================================

-- 1. جدول السنوات الدراسية (Années scolaires)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- مثال: '2026/2027'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    target_annual_ca DECIMAL(12, 2) DEFAULT 0.00, -- الهدف المالي السنوي لرقم المعاملات
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الأسلاك التعليمية (Cycles ordre)
CREATE TABLE IF NOT EXISTS public.educational_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'preschool', 'primary', 'middle_school'
    name_ar TEXT NOT NULL,     -- 'التعليم الأولي', 'التعليم الابتدائي', 'التعليم الثانوي الإعدادي'
    name_fr TEXT NOT NULL,     -- 'Préscolaire', 'Primaire', 'Collège'
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المستويات الدراسية والأفواج (Niveaux & Groupes)
CREATE TABLE IF NOT EXISTS public.academic_levels_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_code TEXT NOT NULL REFERENCES public.educational_cycles(code) ON DELETE CASCADE,
    level_code TEXT UNIQUE NOT NULL, -- 'TPS', 'PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', 'CE6', '1AC', '2AC', '3AC'
    name_ar TEXT NOT NULL,           -- 'الأول ابتدائي', 'الثاني ابتدائي'...
    name_fr TEXT NOT NULL,           -- '1ère Année Primaire (CP)'...
    groups TEXT[] DEFAULT ARRAY['فوج A', 'فوج B']::TEXT[], -- الأفواج المطابقة لشاشة التلاميذ المسجلين
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول مصفوفة الأسعار والرسوم (Liste des tarifs)
CREATE TABLE IF NOT EXISTS public.level_tarifs (
    level_code TEXT PRIMARY KEY REFERENCES public.academic_levels_classes(level_code) ON DELETE CASCADE,
    academic_year_code TEXT NOT NULL,
    tuition_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,   -- واجبات التمدرس الشهرية (Tarifs scolarité)
    transport_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- واجبات النقل المدرسي (Tarifs transport)
    canteen_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,   -- واجبات المطعم المدرسي (Tarifs cantine)
    supplies_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,      -- واجبات المحفظة واللوازم (Fournitures)
    registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- رسوم التسجيل الجديد
    re_registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- رسوم إعادة التسجيل
    supplies_checklist JSONB DEFAULT '[]'::JSONB,           -- قائمة ولوازم المحفظة لكل مستوى
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج السنوات الدراسية الأساسية
INSERT INTO public.academic_years (code, start_date, end_date, is_current, target_annual_ca)
VALUES 
    ('2025/2026', '2025-09-01', '2026-06-30', false, 4200000.00),
    ('2026/2027', '2026-09-01', '2027-06-30', true, 4800000.00),
    ('2027/2028', '2027-09-01', '2028-06-30', false, 5200000.00)
ON CONFLICT (code) DO NOTHING;

-- إدراج الأسلاك التعليمية بالترتيب البيداغوجي المعتمد
INSERT INTO public.educational_cycles (code, name_ar, name_fr, display_order)
VALUES 
    ('preschool', 'التعليم الأولي', 'Préscolaire', 1),
    ('primary', 'التعليم الابتدائي', 'Primaire', 2),
    ('middle_school', 'الثانوي الإعدادي', 'Collège', 3)
ON CONFLICT (code) DO NOTHING;

-- إدراج المستويات الدراسية الأساسية
INSERT INTO public.academic_levels_classes (cycle_code, level_code, name_ar, name_fr, display_order, groups)
VALUES 
    ('preschool', 'PS', 'روض أول (صغار)', 'Petite Section', 1, ARRAY['فوج A']::TEXT[]),
    ('preschool', 'MS', 'روض ثان (متوسط)', 'Moyenne Section', 2, ARRAY['فوج A']::TEXT[]),
    ('preschool', 'GS', 'تمهيدي (كبار)', 'Grande Section', 3, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CP', 'الأول ابتدائي', '1ère Année (CP)', 10, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CE1', 'الثاني ابتدائي', '2ème Année (CE1)', 11, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CE2', 'الثالث ابتدائي', '3ème Année (CE2)', 12, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CM1', 'الرابع ابتدائي', '4ème Année (CM1)', 13, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CM2', 'الخامس ابتدائي', '5ème Année (CM2)', 14, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('primary', 'CE6', 'السادس ابتدائي', '6ème Année (CE6)', 15, ARRAY['فوج A', 'فوج B']::TEXT[]),
    ('middle_school', '1AC', 'الأولى إعدادي', '1ère Année Collège', 20, ARRAY['فوج A']::TEXT[]),
    ('middle_school', '2AC', 'الثانية إعدادي', '2ème Année Collège', 21, ARRAY['فوج A']::TEXT[]),
    ('middle_school', '3AC', 'الثالثة إعدادي', '3ème Année Collège', 22, ARRAY['فوج A']::TEXT[])
ON CONFLICT (level_code) DO NOTHING;

-- إدراج مصفوفة الأسعار والرسوم المعتمدة
INSERT INTO public.level_tarifs (level_code, academic_year_code, tuition_monthly, transport_monthly, canteen_monthly, supplies_fee, registration_fee, re_registration_fee)
VALUES 
    ('PS', '2026/2027', 1600.00, 500.00, 450.00, 600.00, 1500.00, 1000.00),
    ('MS', '2026/2027', 1700.00, 500.00, 450.00, 700.00, 1500.00, 1000.00),
    ('GS', '2026/2027', 1800.00, 500.00, 450.00, 800.00, 1500.00, 1000.00),
    ('CP', '2026/2027', 2000.00, 500.00, 450.00, 950.00, 1500.00, 1000.00),
    ('CE1', '2026/2027', 2050.00, 500.00, 450.00, 1000.00, 1500.00, 1000.00),
    ('CE2', '2026/2027', 2100.00, 500.00, 450.00, 1050.00, 1500.00, 1000.00),
    ('CM1', '2026/2027', 2150.00, 500.00, 450.00, 1100.00, 1500.00, 1000.00),
    ('CM2', '2026/2027', 2200.00, 500.00, 450.00, 1150.00, 1500.00, 1000.00),
    ('CE6', '2026/2027', 2300.00, 500.00, 450.00, 1250.00, 1500.00, 1000.00),
    ('1AC', '2026/2027', 2400.00, 500.00, 450.00, 1400.00, 1800.00, 1200.00),
    ('2AC', '2026/2027', 2500.00, 500.00, 450.00, 1500.00, 1800.00, 1200.00),
    ('3AC', '2026/2027', 2600.00, 500.00, 450.00, 1600.00, 1800.00, 1200.00)
ON CONFLICT (level_code) DO NOTHING;

-- تفعيل أمان الصفوف RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_tarifs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow read academic_years" ON public.academic_years FOR SELECT USING (true);
    CREATE POLICY "Allow write academic_years" ON public.academic_years FOR ALL USING (true);
    CREATE POLICY "Allow read educational_cycles" ON public.educational_cycles FOR SELECT USING (true);
    CREATE POLICY "Allow write educational_cycles" ON public.educational_cycles FOR ALL USING (true);
    CREATE POLICY "Allow read academic_levels_classes" ON public.academic_levels_classes FOR SELECT USING (true);
    CREATE POLICY "Allow write academic_levels_classes" ON public.academic_levels_classes FOR ALL USING (true);
    CREATE POLICY "Allow read level_tarifs" ON public.level_tarifs FOR SELECT USING (true);
    CREATE POLICY "Allow write level_tarifs" ON public.level_tarifs FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
