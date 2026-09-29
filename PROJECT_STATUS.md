# وثيقة حالة المنظومة والمشروع الرسمية (ArouaAudit Master Project Status)

> **تاريخ التحديث الأخير:** 28 سبتمبر 2026  
> **الإصدار الحالي:** v1.0.0 (Production-Ready)  
> **الفرع النشط:** `main`  
> **المؤسسة المالكة:** مجموعة مدارس أروى للتعليم المدرسي الخصوصي - مراكش (Groupe Scolaire Aroua)

---

## 1. نظرة عامة على النظام (Executive Summary)
منظومة **ArouaAudit** هي منصة محاسبية ورقابية مالية وإدارية مستقلة وسيادية صممت خصيصاً لمجموعة مدارس أروى الخاصة.
تقوم المنظومة بمطابقة وحوسبة كافة التدفقات المالية للمؤسسة من لحظة استيراد تسجيلات التلاميذ من منصة `arouaschools`، ومروراً بالصندوق والأجور والشيكات والذمم والنفقات، وحتى أدق إعدادات النقل والمطعم والمحفظة المدرسية.

---

## 2. المكدس التقني والمعمارية (Technology Stack & Architecture)
- **واجهة المستخدم (Frontend):** React 19, TypeScript (Strict Mode), Vite v8.3, Tailwind CSS.
- **التصميم وتجربة المستخدم (UI/UX System):** **Clean Modern Soft Slate & Pure White Theme**، متوافق مع نمط العمل المكتبي والمحاسبي ومريح للعين مع هوية بصرية متميزة لمجموعة مدارس أروى.
- **قواعد البيانات والسحابة (Backend & Cloud):**
  - **Supabase (PostgreSQL 15+):** محرك البيانات العلائقية الأساسي مع أمان صفوف مشدد (Row Level Security - RLS) ومحفزات أوتوماتيكية (Triggers).
  - **Firebase:** المزامنة الحية للبيانات المدرسية مع منظومة `arouaschools`.
- **معمارية الحزم (Architectural Pattern):** **Common Closure Principle (CCP)** - حيث تسكن كل ميزة بشكل مستقل داخل `src/features/<feature-name>/` متضمنة نماذجها، خدماتها، ومكوناتها وشاشاتها.

---

## 3. سجل الوحدات المنجزة بالكامل (Completed Modules: Stages 1 to 8)

### المرحلة 1: إعدادات المنظومة والمواسم وشبكة الأسعار (`src/features/system-settings/`)
- **الملف الترحيلي:** `supabase/migrations/20260929000001_create_system_settings_and_tarifs.sql`
- **الشاشات والمسارات:**
  - `/settings/academic-years`: إدارة المواسم الدراسية والموسم النشط.
  - `/settings/cycles` و `/settings/levels-groups`: هيكلة الأسلاك التعليمية (أولي، ابتدائي، إعدادي، تأهيلي) والأفواج.
  - `/settings/pricing-grid`: شبكة الأسعار الدورية ورسوم التسجيل والتأمين.

### المرحلة 2: استقبال وتدقيق تسجيل وتمدرس التلاميذ المزامنين (`src/features/student-enrollment/`)
- **الشاشات والمسارات:**
  - `/hr/enrolled-students`: تدقيق ومطابقة وضعية التسجيل للتلاميذ المزامنين مع منصة `arouaschools`، رصد الديون ورسوم الخدمات الملحقة.

### المرحلة 3: الأساتذة والموظفون ومسير الأجور والديون (`src/features/payroll-hr/`)
- **الملف الترحيلي:** `supabase/migrations/20260930000001_create_staff_payroll_and_sync.sql`
- **الشاشات والمسارات:**
  - `/hr/mapped-staff`: مطابقة ومزامنة الأطر التربوية والإدارية المعتمدة.
  - `/hr/payroll`: مسير الرواتب الشهري، حساب التعويضات، واقتطاعات CNSS.
  - `/hr/staff-debts`: سجل سلفات الموظفين وجدولة الديون الشهرية.

### المرحلة 4: رقم المعاملات والمداخيل اليومية والصناديق (`src/features/revenue-analytics/` & `src/features/treasury-caisse/`)
- **الملف الترحيلي:** `supabase/migrations/20261001000001_create_revenue_and_recettes.sql`
- **الشاشات والمسارات:**
  - `/revenue/monthly-ca`: رقم المعاملات الشهري ومقارنة الأداء الفعلي بالتوقعات.
  - `/revenue/annual-ca`: رقم المعاملات السنوي والهدف المالي الاستراتيجي.
  - `/revenue/regisseurs`: مداخيل وكلاء الاستقبال ومحضر إغلاق الصندوق اليومي (Clôture de Caisse).
  - `/revenue/administration`: مداخيل الإدارة العامة والتحويلات المباشرة.
  - `/revenue/global-recettes`: الرزنامة التفاعلية الشاملة للمقبوضات.
  - `/revenue/catering-stats`: سجل عمليات تغذية الصندوق ورأس المال التشغيلي.

### المرحلة 5: الحسابات البنكية ومحفظة الشيكات وحوافظ الإيداع (`src/features/checks-management/`)
- **الملف الترحيلي:** `supabase/migrations/20261002000001_create_checks_and_bank_accounts.sql`
- **الشاشات والمسارات:**
  - `/checks/accounts`: الحسابات البنكية والخزائن المركزية، أرقام RIB، والأرصدة اللحظية.
  - `/checks/portfolio`: محفظة الشيكات والكمبيالات وتتبع دورة حياتها ومؤشر الخطر المالي.
  - `/checks/deposited`: شيكات قيد الإيداع وسلة إنشاء الحوافظ البنكية.
  - `/checks/delivery-slips`: أرشيف حوافظ تسليم الشيكات مع نافذة الطباعة البنكية الرسمية A4 بالتفقيط والتأشيرات.
  - `/checks/receipts`: سجل الوصولات وسندات القبض وإعادة الطباعة الرسمية عبر `OfficialReceiptModal`.
  - `/checks/invoices`: كشوفات الحساب والمطابقة البنكية ورصد الشيكات المتداولة.

### المرحلة 6: القوائم والعمليات المالية والذمم والمتأخرات (`src/features/finance-operations/`)
- **الملف الترحيلي:** `supabase/migrations/20261003000001_create_finance_operations_and_impayes.sql`
- **الشاشات والمسارات:**
  - `/finance/impayes`: محرك الذمم والمتأخرات، فترات التقادم (Aging)، التذكير بواتساب، ومحاضر وعود الأداء (Promesse de paiement).
  - `/finance/credit-balances`: الأرصدة الزائدة (Soldes en plus)، الترحيل للشهر القادم أو الاسترداد النقدي.
  - `/finance/discounts`: تخفيضات الإخوة (Fratrie) واتفاقيات الشراكة وتفعيلها بنقرة زر.
  - `/finance/exemptions`: الإعفاءات الكاملة 100% لأبناء الأطر والمنح الاجتماعية.
  - `/finance/payments-journal`: دفتر الأستاذ وسجل المقبوضات التاريخي الشامل وتصدير Excel.

### المرحلة 7: النفقات والمصروفات ومراكز التكلفة وسندات الصرف (`src/features/expenses/`)
- **الملف الترحيلي:** `supabase/migrations/20261004000001_create_expenses_and_charges.sql`
- **الشاشات والمسارات:**
  - `/expenses/categories`: أبواب وتصنيفات النفقات ومخصصات الميزانية ونسبة الاستهلاك.
  - `/expenses/list`: سجل النفقات والفواتير المدرسية والموردين (مع أرقام ICE).
  - `/expenses/monthly-stats`: التحليل الإحصائي لتطور النفقات ومقارنة التكاليف الثابتة والمتغيرة.
  - `/expenses/register`: سجل سندات الصرف (Décaissements) ومعاينة وطباعة سند الصرف المالي الرسمي A4 (`OfficialDisbursementModal`).

### المرحلة 8: الخدمات الملحقة: النقل المدرسي، المطعم، واللوازم والمحفظة (`src/features/services-config/`)
- **الملف الترحيلي:** `supabase/migrations/20261005000001_create_services_config.sql`
- **الشاشات والمسارات:**
  - `/services/transport`: خطوط وأسطول النقل، السائقين والمرافقات، المناطق المغطاة، ومعدل ملء المقاعد.
  - `/services/canteen`: صيغ المطعم المدرسي (نصف إقامة)، الطاقة الاستيعابية، وجدول التغذية الأسبوعي.
  - `/services/supplies`: حزم المقررات والمستلزمات والمآزر، تتبع المخزون، وهوامش الأرباح التجارية.

---

## 4. قائمة المسارات المعتمدة في النظام (28 مساراً نشطاً)
1. `/hr/enrolled-students` (الرئيسية)
2. `/settings/academic-years`
3. `/settings/cycles`
4. `/settings/levels-groups`
5. `/settings/pricing-grid`
6. `/hr/mapped-staff`
7. `/hr/payroll`
8. `/hr/staff-debts`
9. `/revenue/monthly-ca`
10. `/revenue/annual-ca`
11. `/revenue/regisseurs`
12. `/revenue/administration`
13. `/revenue/global-recettes`
14. `/revenue/catering-stats`
15. `/checks/accounts`
16. `/checks/portfolio`
17. `/checks/delivery-slips`
18. `/checks/receipts`
19. `/checks/deposited`
20. `/checks/invoices`
21. `/finance/credit-balances`
22. `/finance/discounts`
23. `/finance/exemptions`
24. `/finance/payments-journal`
25. `/finance/impayes`
26. `/expenses/categories`
27. `/expenses/list`
28. `/expenses/monthly-stats`
29. `/expenses/register`
30. `/services/transport`
31. `/services/canteen`
32. `/services/supplies`

---

## 5. حالة البناء والتحقق البرمجي (Production Verification)
- **أمر البناء:** `npm run build` (`tsc -b && vite build`)
- **النتيجة:** `✓ built in ~2.7s` مع **0 أخطاء** برمجية.
- **تجزئة الحزم:** تحميل كسول (Code Splitting & Lazy Loading) لكافة الشاشات.
- **استجابة الخادم:** استجابة جميع المسارات بالرمز `HTTP 200 OK`.
