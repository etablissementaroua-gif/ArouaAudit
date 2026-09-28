import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { Employee, StaffSyncResult } from '../models/payroll.types';

// Mock registry representing data in arouaschools (staff_members / users)
export const arouaSchoolsExternalStaffRegistry: Partial<Employee>[] = [
  {
    external_staff_id: 'STF-AROUA-001',
    full_name: 'رشيد العلمي',
    cin: 'EE124578',
    cnss_number: '18992011',
    phone: '0661122334',
    email: 'rachid.alami@arouaschools.ma',
    role: 'teacher',
    department: 'Pedagogique',
    subjects: ['الرياضيات'],
    assigned_classes: ['2Bac SM-A', '1Bac ScExp'],
    base_salary: 7500,
    credit_ancien: 0,
    bank_name: 'Attijariwafa Bank',
    rib_account: '007810000123456789012345',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-002',
    full_name: 'سناء بنكيران',
    cin: 'BK882190',
    cnss_number: '44556677',
    phone: '0662233445',
    email: 'sanaa.benkiran@arouaschools.ma',
    role: 'teacher',
    department: 'Pedagogique',
    subjects: ['اللغة الفرنسية'],
    assigned_classes: ['3Collège-2', '2Collège-1'],
    base_salary: 7000,
    credit_ancien: 0,
    bank_name: 'Banque Populaire',
    rib_account: '011780000987654321098765',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-003',
    full_name: 'محمد الوردي',
    cin: 'AB334455',
    cnss_number: '33669911',
    phone: '0663344556',
    email: 'm.ouardi@arouaschools.ma',
    role: 'teacher',
    department: 'Pedagogique',
    subjects: ['اللغة العربية', 'التربية الإسلامية'],
    assigned_classes: ['الأول ابتدائي (CP)', 'الثاني ابتدائي (CE1)'],
    base_salary: 6500,
    credit_ancien: 0,
    bank_name: 'BMCE Bank of Africa',
    rib_account: '011850000456123789654123',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-004',
    full_name: 'حميد الناصري',
    cin: 'G552211',
    cnss_number: '22883344',
    phone: '0664455667',
    email: 'hamid.nassiri@arouaschools.ma',
    role: 'driver',
    department: 'Transport',
    subjects: ['النقل المدرسي (حافلة A)'],
    assigned_classes: ['خط سوكوما - المحاميد'],
    base_salary: 4800,
    credit_ancien: 1200,
    bank_name: 'CIH Bank',
    rib_account: '230810000654987321456987',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-005',
    full_name: 'فاطمة الزهراء الشاوي',
    cin: 'N991122',
    cnss_number: '99887711',
    phone: '0665566778',
    email: 'fz.chaoui@arouaschools.ma',
    role: 'admin',
    department: 'Administration',
    subjects: ['إدارة الصندوق والحسابات'],
    assigned_classes: ['الإدارة العامة'],
    base_salary: 6200,
    credit_ancien: 0,
    bank_name: 'Attijariwafa Bank',
    rib_account: '007810000789456123012345',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-006',
    full_name: 'نادية الإدريسي',
    cin: 'HH443322',
    cnss_number: '55443322',
    phone: '0666677889',
    email: 'nadia.idrissi@arouaschools.ma',
    role: 'assistant',
    department: 'Services',
    subjects: ['مربية ومساعدة أولي'],
    assigned_classes: ['روض أول (PS)', 'تمهيدي (GS)'],
    base_salary: 4200,
    credit_ancien: 0,
    bank_name: 'Banque Populaire',
    rib_account: '011780000321654987012345',
    employment_status: 'active',
    source_platform: 'arouaschools'
  },
  {
    external_staff_id: 'STF-AROUA-007',
    full_name: 'كريم التازي',
    cin: 'C118833',
    cnss_number: '77221100',
    phone: '0667788990',
    email: 'karim.tazi@arouaschools.ma',
    role: 'teacher',
    department: 'Pedagogique',
    subjects: ['الفيزياء والكيمياء (مغادر)'],
    assigned_classes: ['سلك إعدادي'],
    base_salary: 0,
    credit_ancien: 3500,
    bank_name: 'CIH Bank',
    rib_account: '230810000111222333444555',
    employment_status: 'departed',
    source_platform: 'arouaschools'
  }
];

export const staffSyncService = {
  /**
   * مزامنة الأطر مع منظومة arouaschools:
   * يقوم بعمل Upsert مع الاحتفاظ الصارم بالراتب الأساسي والديون السابقة المسجلة بالنظام المالي.
   */
  async syncStaffFromArouaSchools(): Promise<StaffSyncResult> {
    const rawExternal = arouaSchoolsExternalStaffRegistry;
    let newAdded = 0;
    let updated = 0;

    if (isSupabaseConfigured()) {
      try {
        // 1. جلب الموظفين الحاليين للاحتفاظ بالقيم المالية
        const { data: existingEmployees, error: fetchErr } = await supabase
          .from('employees')
          .select('id, external_staff_id, base_salary, credit_ancien, employment_status');

        const existingMap = new Map<string, any>();
        if (!fetchErr && existingEmployees) {
          existingEmployees.forEach((emp: any) => {
            existingMap.set(emp.external_staff_id, emp);
          });
        }

        // 2. معالجة كل موظف
        for (const item of rawExternal) {
          if (!item.external_staff_id) continue;
          const existing = existingMap.get(item.external_staff_id);

          if (existing) {
            // تحديث البيانات الشخصية والبيداغوجية مع الحفاظ على الراتب والديون
            await supabase
              .from('employees')
              .update({
                full_name: item.full_name,
                cin: item.cin,
                cnss_number: item.cnss_number,
                phone: item.phone,
                email: item.email,
                role: item.role,
                department: item.department,
                subjects: item.subjects,
                assigned_classes: item.assigned_classes,
                bank_name: item.bank_name,
                rib_account: item.rib_account,
                // الحفاظ على الراتب والديون إن كانت محددة
                base_salary: existing.base_salary ?? item.base_salary ?? 0,
                credit_ancien: existing.credit_ancien ?? item.credit_ancien ?? 0,
                employment_status: existing.employment_status ?? item.employment_status ?? 'active',
                updated_at: new Date().toISOString()
              })
              .eq('external_staff_id', item.external_staff_id);
            updated++;
          } else {
            // إدراج موظف جديد
            await supabase
              .from('employees')
              .insert([{
                ...item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            newAdded++;
          }
        }
      } catch (err) {
        console.warn('Supabase staff sync warning:', err);
      }
    }

    // المزامنة في التخزين المحلي (Local Storage Backup)
    const local = localStorage.getItem('aroua_staff_employees');
    let localList: Employee[] = local ? JSON.parse(local) : (rawExternal as Employee[]);

    const localMap = new Map<string, Employee>();
    localList.forEach(e => localMap.set(e.external_staff_id, e));

    rawExternal.forEach(ext => {
      if (!ext.external_staff_id) return;
      const ex = localMap.get(ext.external_staff_id);
      if (ex) {
        localMap.set(ext.external_staff_id, {
          ...ex,
          ...ext,
          // حماية الراتب والديون السابقة
          base_salary: ex.base_salary,
          credit_ancien: ex.credit_ancien,
          employment_status: ex.employment_status,
          updated_at: new Date().toISOString()
        } as Employee);
      } else {
        localMap.set(ext.external_staff_id, {
          id: 'emp-' + Date.now() + Math.random().toString(36).substr(2, 4),
          ...ext,
          created_at: new Date().toISOString()
        } as Employee);
      }
    });

    localStorage.setItem('aroua_staff_employees', JSON.stringify(Array.from(localMap.values())));

    return {
      totalSynced: rawExternal.length,
      newAdded,
      updated,
      timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
      details: `تم مزامنة وتحديث ${rawExternal.length} موظفاً بنجاح مع الحفاظ على الكتل الأجرية.`
    };
  }
};
