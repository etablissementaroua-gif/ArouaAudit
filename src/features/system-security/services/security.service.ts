import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { 
  SystemRole, 
  SystemRoleCode, 
  RolePermission, 
  UserProfile, 
  AuditLog, 
  AuditFilterOptions,
  PermissionAction,
  PERMISSION_MODULES 
} from '../models/security.types';

// Mock Initial Data for Offline / Sandbox Mode
const MOCK_SYSTEM_ROLES: SystemRole[] = [
  {
    id: 'role-1',
    code: 'super_admin',
    name_ar: 'المدير العام والمشرف الأعلى',
    name_fr: 'Super Administrateur',
    description_ar: 'كامل الصلاحيات غير المقيدة لإدارة ومراقبة المنظومة وضبط الأمان',
    description_fr: 'Accès total sans restriction à l\'ensemble du système et sécurité',
    is_system_role: true,
    is_active: true,
  },
];

let mockUsers: UserProfile[] = [
  {
    id: 'usr-mossaabel',
    full_name: 'مصعب (المدير العام والمشرف الأعلى)',
    email: 'mossaabel@arouaaudit.com',
    role_code: 'super_admin',
    is_suspended: false,
    created_at: '2026-10-01',
  },
];

// Initialize Mock Permissions Matrix
const buildInitialPermissions = (): RolePermission[] => {
  const result: RolePermission[] = [];
  let idCounter = 1;

  for (const role of MOCK_SYSTEM_ROLES) {
    for (const mod of PERMISSION_MODULES) {
      let canView = false;
      let canCreate = false;
      let canEdit = false;
      let canDelete = false;
      let canExport = false;
      let canPrint = false;

      if (role.code === 'super_admin') {
        canView = canCreate = canEdit = canDelete = canExport = canPrint = true;
      } else if (role.code === 'finance_director') {
        canView = true;
        canCreate = canEdit = canExport = canPrint = true;
        canDelete = false;
        if (mod.key === 'system.settings' || mod.key === 'security.users') {
          canCreate = canEdit = false;
        }
      } else if (role.code === 'accountant') {
        canView = !['system.settings', 'security.audit', 'security.users'].includes(mod.key);
        canCreate = canEdit = ['caisse.operations', 'caisse.disburse', 'payroll.execute', 'payroll.advances', 'checks.portfolio', 'checks.reconcile', 'impayes.manage', 'expenses.manage'].includes(mod.key);
        canExport = canPrint = canView;
        canDelete = false;
      } else if (role.code === 'cashier') {
        canView = ['caisse.operations', 'enrollment.students', 'checks.portfolio', 'impayes.manage', 'services.config'].includes(mod.key);
        canCreate = ['caisse.operations', 'checks.portfolio'].includes(mod.key);
        canPrint = canView;
        canEdit = canDelete = canExport = false;
      } else if (role.code === 'hr_manager') {
        canView = ['payroll.execute', 'payroll.advances', 'services.config'].includes(mod.key);
        canCreate = canEdit = ['payroll.execute', 'payroll.advances'].includes(mod.key);
        canExport = canPrint = canView;
      } else if (role.code === 'viewer') {
        canView = ['enrollment.students', 'caisse.operations', 'checks.portfolio', 'impayes.manage', 'expenses.manage', 'services.config'].includes(mod.key);
      }

      result.push({
        id: `perm-${idCounter++}`,
        role_code: role.code,
        permission_key: mod.key,
        can_view: canView,
        can_create: canCreate,
        can_edit: canEdit,
        can_delete: canDelete,
        can_export: canExport,
        can_print: canPrint,
      });
    }
  }

  return result;
};

let mockPermissions: RolePermission[] = buildInitialPermissions();

let mockAuditLogs: AuditLog[] = [];

class SecurityService {
  /**
   * Get all defined system roles
   */
  async getSystemRoles(): Promise<SystemRole[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_roles')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data as SystemRole[];
        }
      } catch (err) {
        console.warn('Supabase getSystemRoles error, falling back to mock:', err);
      }
    }
    return MOCK_SYSTEM_ROLES;
  }

  /**
   * Get permissions matrix for a specific role or all roles
   */
  /**
   * Create a new custom system role and initialize default permissions
   */
  async createSystemRole(roleData: Omit<SystemRole, 'id' | 'created_at'>): Promise<SystemRole> {
    const newRole: SystemRole = {
      ...roleData,
      id: `role-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    MOCK_SYSTEM_ROLES.push(newRole);

    // Initialize default permissions for this new role
    for (const mod of PERMISSION_MODULES) {
      mockPermissions.push({
        id: `perm-${Date.now()}-${mod.key}`,
        role_code: newRole.code,
        permission_key: mod.key,
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
        can_print: true,
      });
    }

    await this.logAuditEvent({
      user_name: 'مصعب (المدير العام)',
      user_role: 'super_admin',
      action_type: 'ROLE_CREATE',
      target_entity: 'system_roles',
      entity_id: newRole.code,
      new_values: newRole,
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('system_roles').insert([newRole]);
      } catch (err) {
        console.warn('Supabase createSystemRole error:', err);
      }
    }
    return newRole;
  }

  /**
   * Delete custom system role (cannot delete super_admin)
   */
  async deleteSystemRole(roleCode: string): Promise<boolean> {
    if (roleCode === 'super_admin') return false;
    const idx = MOCK_SYSTEM_ROLES.findIndex(r => r.code === roleCode);
    if (idx !== -1) {
      MOCK_SYSTEM_ROLES.splice(idx, 1);
    }
    mockPermissions = mockPermissions.filter(p => p.role_code !== roleCode);

    await this.logAuditEvent({
      user_name: 'مصعب (المدير العام)',
      user_role: 'super_admin',
      action_type: 'ROLE_DELETE',
      target_entity: 'system_roles',
      entity_id: roleCode,
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('system_roles').delete().eq('code', roleCode);
        await supabase.from('role_permissions').delete().eq('role_code', roleCode);
      } catch (err) {
        console.warn('Supabase deleteSystemRole error:', err);
      }
    }
    return true;
  }

  async getRolePermissions(roleCode?: SystemRoleCode): Promise<RolePermission[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('role_permissions').select('*');
        if (roleCode) {
          query = query.eq('role_code', roleCode);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as RolePermission[];
        }
      } catch (err) {
        console.warn('Supabase getRolePermissions error, falling back to mock:', err);
      }
    }

    if (roleCode) {
      return mockPermissions.filter(p => p.role_code === roleCode);
    }
    return mockPermissions;
  }

  /**
   * Update an individual action permission in the matrix
   */
  async updateRolePermission(
    roleCode: SystemRoleCode,
    permissionKey: string,
    action: PermissionAction,
    value: boolean
  ): Promise<boolean> {
    // 1. Update in-memory mock
    const existing = mockPermissions.find(
      p => p.role_code === roleCode && p.permission_key === permissionKey
    );
    let oldVal = false;
    if (existing) {
      oldVal = existing[action];
      existing[action] = value;
    } else {
      const newPerm: RolePermission = {
        id: `perm-${Date.now()}`,
        role_code: roleCode,
        permission_key: permissionKey,
        can_view: action === 'can_view' ? value : false,
        can_create: action === 'can_create' ? value : false,
        can_edit: action === 'can_edit' ? value : false,
        can_delete: action === 'can_delete' ? value : false,
        can_export: action === 'can_export' ? value : false,
        can_print: action === 'can_print' ? value : false,
      };
      mockPermissions.push(newPerm);
    }

    // 2. Audit the permission modification
    await this.logAuditEvent({
      user_name: 'أحمد بنشقرون (المشرف)',
      user_role: 'super_admin',
      action_type: 'ROLE_CHANGE',
      target_entity: 'role_permissions',
      entity_id: `${roleCode}:${permissionKey}`,
      old_values: { [action]: oldVal },
      new_values: { [action]: value },
    });

    // 3. Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('role_permissions')
          .upsert({
            role_code: roleCode,
            permission_key: permissionKey,
            [action]: value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'role_code,permission_key' });
      } catch (err) {
        console.warn('Supabase updateRolePermission error:', err);
      }
    }

    return true;
  }

  /**
   * Get all user profiles with linked staff info
   */
  async getUserProfiles(viewerRole?: string): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as UserProfile[];
        }
      } catch (err) {
        console.warn('Supabase getUserProfiles error, falling back to mock:', err);
      }
    }
    let result = [...mockUsers];
    if (viewerRole && viewerRole !== 'super_admin') {
      result = result.filter(u => u.role_code !== 'super_admin' && u.email?.toLowerCase().trim() !== 'mossaabel@arouaaudit.com');
    }
    return result;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRoleCode: SystemRoleCode): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const oldRole = user ? user.role_code : 'viewer';
    if (user) {
      user.role_code = newRoleCode;
    }

    await this.logAuditEvent({
      user_name: 'أحمد بنشقرون (المشرف)',
      user_role: 'super_admin',
      action_type: 'ROLE_CHANGE',
      target_entity: 'user_profiles',
      entity_id: userId,
      old_values: { role_code: oldRole },
      new_values: { role_code: newRoleCode },
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ role_code: newRoleCode, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (err) {
        console.warn('Supabase updateUserRole error:', err);
      }
    }
    return true;
  }

  /**
   * Toggle user account suspension
   */
    /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<boolean> {
    mockUsers = mockUsers.filter(u => u.id !== userId);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
      } catch (err) {
        console.warn('Supabase deleteUserProfile error:', err);
      }
    }
    return true;
  }

  /**
   * Update full user profile details (Name, Employee, Role, Email)
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const oldVals = user ? { ...user } : {};
    if (user) {
      Object.assign(user, data);
    }

    await this.logAuditEvent({
      user_name: 'مصعب (المدير العام)',
      user_role: 'super_admin',
      action_type: 'UPDATE',
      target_entity: 'user_profiles',
      entity_id: userId,
      old_values: oldVals,
      new_values: data,
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (err) {
        console.warn('Supabase updateUserProfile error:', err);
      }
    }
    return true;
  }

  /**
   * Reset / Update Employee Password
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.password = newPassword;
      user.password_hash = newPassword;
    }

    try {
      const key = 'aroua_staff_passwords';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      if (user?.email) {
        existing[user.email.toLowerCase().trim()] = newPassword;
      }
      existing[userId] = newPassword;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.warn('Password storage exception:', e);
    }

    await this.logAuditEvent({
      user_name: 'مصعب (المدير العام)',
      user_role: 'super_admin',
      action_type: 'PASSWORD_RESET',
      target_entity: 'user_profiles',
      entity_id: userId,
      new_values: { password_updated: true },
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (err) {
        console.warn('Supabase updateUserPassword error:', err);
      }
    }
    return true;
  }

  /**
   * Verify employee password for login
   */
  async verifyUserPassword(email: string, password: string): Promise<UserProfile | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === 'mossaabel@arouaaudit.com') {
      if (password === 'Mo1356365508') {
        return {
          id: 'usr-mossaabel',
          full_name: 'مصعب (المدير العام والمشرف الأعلى)',
          email: 'mossaabel@arouaaudit.com',
          role_code: 'super_admin',
          is_suspended: false,
        };
      }
      return null;
    }

    const profiles = await this.getUserProfiles();
    const user = profiles.find(u => u.email?.toLowerCase().trim() === normalizedEmail);
    if (!user) return null;

    let savedPass = user.password || user.password_hash;
    try {
      const key = 'aroua_staff_passwords';
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      savedPass = existing[normalizedEmail] || existing[user.id] || savedPass;
    } catch {}

    if (savedPass && savedPass === password) {
      return user;
    }
    return null;
  }

  async toggleUserSuspension(userId: string, isSuspended: boolean): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.is_suspended = isSuspended;
    }

    await this.logAuditEvent({
      user_name: 'أحمد بنشقرون (المشرف)',
      user_role: 'super_admin',
      action_type: 'SUSPEND',
      target_entity: 'user_profiles',
      entity_id: userId,
      old_values: { is_suspended: !isSuspended },
      new_values: { is_suspended: isSuspended },
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (err) {
        console.warn('Supabase toggleUserSuspension error:', err);
      }
    }
    return true;
  }

  /**
   * Create a new user profile linked with an employee
   */
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at'>): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...profile,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
    };

    mockUsers.unshift(newProfile);

    await this.logAuditEvent({
      user_name: 'أحمد بنشقرون (المشرف)',
      user_role: 'super_admin',
      action_type: 'CREATE',
      target_entity: 'user_profiles',
      entity_id: newProfile.id,
      new_values: newProfile,
    });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('user_profiles').insert(newProfile);
      } catch (err) {
        console.warn('Supabase createUserProfile error:', err);
      }
    }

    return newProfile;
  }

  /**
   * Get Audit Logs with search & filters
   */
  async clearAllAuditLogs(): Promise<boolean> {
    mockAuditLogs = [];
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Supabase clearAllAuditLogs error:', err);
      }
    }
    return true;
  }

  async getAuditLogs(filters?: AuditFilterOptions): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

        if (filters?.action_type && filters.action_type !== 'ALL') {
          query = query.eq('action_type', filters.action_type);
        }
        if (filters?.target_entity && filters.target_entity !== 'ALL') {
          query = query.eq('target_entity', filters.target_entity);
        }
        if (filters?.search) {
          query = query.or(`user_name.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.limit(100);
        if (!error && data && data.length > 0) {
          return data as AuditLog[];
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs error, falling back to mock:', err);
      }
    }

    let result = [...mockAuditLogs];

    if (filters) {
      if (filters.action_type && filters.action_type !== 'ALL') {
        result = result.filter(log => log.action_type === filters.action_type);
      }
      if (filters.target_entity && filters.target_entity !== 'ALL') {
        result = result.filter(log => log.target_entity === filters.target_entity);
      }
      if (filters.user_name) {
        result = result.filter(log => log.user_name.includes(filters.user_name!));
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          log =>
            log.user_name.toLowerCase().includes(q) ||
            log.target_entity.toLowerCase().includes(q) ||
            (log.entity_id && log.entity_id.toLowerCase().includes(q))
        );
      }
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Record a new audit event (Strict immutability)
   */
  async logAuditEvent(logData: {
    user_name: string;
    user_role: string;
    action_type: AuditLog['action_type'];
    target_entity: string;
    entity_id?: string;
    old_values?: any;
    new_values?: any;
  }): Promise<AuditLog> {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_name: logData.user_name,
      user_role: logData.user_role,
      action_type: logData.action_type,
      target_entity: logData.target_entity,
      entity_id: logData.entity_id,
      old_values: logData.old_values || null,
      new_values: logData.new_values || null,
      ip_address: '192.168.1.100',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    mockAuditLogs.unshift(entry);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('audit_logs').insert(entry);
      } catch (err) {
        console.warn('Supabase logAuditEvent insert error:', err);
      }
    }

    return entry;
  }
}

export const securityService = new SecurityService();
export default securityService;

