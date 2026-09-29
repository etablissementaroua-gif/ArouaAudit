export type SystemRoleCode = 
  | 'super_admin' 
  | 'finance_director' 
  | 'accountant' 
  | 'cashier' 
  | 'hr_manager' 
  | 'viewer';

export type PermissionAction = 
  | 'can_view' 
  | 'can_create' 
  | 'can_edit' 
  | 'can_delete' 
  | 'can_export' 
  | 'can_print';

export interface SystemRole {
  id: string;
  code: SystemRoleCode;
  name_ar: string;
  name_fr: string;
  description_ar?: string;
  description_fr?: string;
  is_system_role: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface RolePermission {
  id: string;
  role_code: SystemRoleCode;
  permission_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_print: boolean;
}

export interface UserProfile {
  id: string;
  auth_user_id?: string;
  employee_id?: string;
  employee_name?: string;
  full_name: string;
  email?: string;
  role_code: SystemRoleCode;
  is_suspended: boolean;
  custom_permissions?: Record<string, Partial<Record<PermissionAction, boolean>>>;
  last_login_at?: string;
  created_at?: string;
}

export type AuditActionType = 
  | 'LOGIN' 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'DISBURSEMENT' 
  | 'EXPORT' 
  | 'RECONCILE' 
  | 'ROLE_CHANGE' 
  | 'SUSPEND';

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action_type: AuditActionType;
  target_entity: string;
  entity_id?: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditFilterOptions {
  user_name?: string;
  action_type?: string;
  target_entity?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface PermissionMatrixModule {
  key: string;
  name_ar: string;
  name_fr: string;
  category: 'core' | 'finance' | 'hr' | 'operations' | 'security';
  description_ar: string;
  description_fr: string;
}

export const PERMISSION_MODULES: PermissionMatrixModule[] = [
  {
    key: 'enrollment.students',
    name_ar: 'التلاميذ والملفات الدراسية',
    name_fr: 'Élèves & Dossiers Scolaires',
    category: 'core',
    description_ar: 'إدارة ملفات التلاميذ، الأسلاك، والتسجيل',
    description_fr: 'Gestion des élèves, cycles et inscriptions',
  },
  {
    key: 'caisse.operations',
    name_ar: 'يومية الصندوق والتحصيل',
    name_fr: 'Journal de Caisse & Recettes',
    category: 'finance',
    description_ar: 'استخلاص الرسوم المدرسية وإصدار الوصولات الرسمية',
    description_fr: 'Encaissements scolaires et émission des reçus officiels',
  },
  {
    key: 'caisse.disburse',
    name_ar: 'الصرف المالي وسندات الخزينة',
    name_fr: 'Bons de Décaissement & Dépenses',
    category: 'finance',
    description_ar: 'إصدار أوامر الصرف المالي من الصندوق المركزي',
    description_fr: 'Émission des décaissements et bons de caisse',
  },
  {
    key: 'payroll.execute',
    name_ar: 'مسير الرواتب والأجور',
    name_fr: 'Gestion de la Paie & Rémunérations',
    category: 'hr',
    description_ar: 'احتساب أجور الأساتذة والموظفين وتصدير أوامر التحويل',
    description_fr: 'Calcul de la paie, virements et bulletins',
  },
  {
    key: 'payroll.advances',
    name_ar: 'التسبيقات والسلفات المالية',
    name_fr: 'Avances sur Salaire & Dettes',
    category: 'hr',
    description_ar: 'تسجيل السلفات ومتابعة الديون السابقة العالقة',
    description_fr: 'Gestion des avances et dettes antérieures',
  },
  {
    key: 'checks.portfolio',
    name_ar: 'محفظة الشيكات والكمبيالات',
    name_fr: 'Portefeuille des Chèques & Effets',
    category: 'finance',
    description_ar: 'تتبع الشيكات وحوافظ التسليم البنكية',
    description_fr: 'Suivi des chèques et bordereaux de remise',
  },
  {
    key: 'checks.reconcile',
    name_ar: 'المطابقة والتسوية البنكية',
    name_fr: 'Rapprochement Bancaire',
    category: 'finance',
    description_ar: 'مطابقة الكشوفات البنكية مع مقبوضات الخزينة',
    description_fr: 'Rapprochement des extraits et trésorerie',
  },
  {
    key: 'impayes.manage',
    name_ar: 'المستحقات غير المؤداة والمتأخرات',
    name_fr: 'Impayés & Reste à Recouvrer',
    category: 'finance',
    description_ar: 'متابعة الديون، خطط الاستخلاص، وتنبيهات أولياء الأمور',
    description_fr: 'Relances des impayés et recouvrement',
  },
  {
    key: 'expenses.manage',
    name_ar: 'النفقات وتصنيفات المصاريف',
    name_fr: 'Dépenses & Rubriques Budgétaires',
    category: 'finance',
    description_ar: 'تسجيل الفواتير، الموردين، ومخصصات الميزانية',
    description_fr: 'Enregistrement des charges et fournisseurs',
  },
  {
    key: 'services.config',
    name_ar: 'الخدمات الملحقة (النقل، المطعم، اللوازم)',
    name_fr: 'Services Annexes (Transport, Cantine, Packs)',
    category: 'operations',
    description_ar: 'إدارة أسطول الحافلات، الاشتراكات ومخزون الكتب',
    description_fr: 'Gestion flotte bus, restauration et fournitures',
  },
  {
    key: 'system.settings',
    name_ar: 'إعدادات المنظومة وجداول الرسوم',
    name_fr: 'Paramètres Système & Grille Tarifaire',
    category: 'core',
    description_ar: 'السنوات الدراسية، المستويات، وتعريفات الرسوم',
    description_fr: 'Années scolaires, niveaux et grilles tarifaires',
  },
  {
    key: 'security.audit',
    name_ar: 'سجل التدقيق والرقابة المالية المشفر',
    name_fr: 'Piste d\'Audit & Contrôle Immuable',
    category: 'security',
    description_ar: 'استعراض العمليات وتتبع التعديلات اللحظية',
    description_fr: 'Consultation du journal d\'audit non modifiable',
  },
  {
    key: 'security.users',
    name_ar: 'إدارة حسابات الموظفين والصلاحيات',
    name_fr: 'Gestion des Utilisateurs & Droits',
    category: 'security',
    description_ar: 'إنشاء حسابات المستخدمين ومصفوفة الأذونات',
    description_fr: 'Gestion des comptes et matrice des permissions',
  },
];

