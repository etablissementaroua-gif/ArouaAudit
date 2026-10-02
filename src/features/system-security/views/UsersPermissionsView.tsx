import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Users, 
  Lock, 
  Plus, 
  Check, 
  Search, 
  Save, 
  RotateCcw, 
  KeyRound, 
  Pencil, 
  Trash2, 
  UserCheck, 
  UserX, 
  Eye, 
  EyeOff,
  CheckCheck,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  SystemRole, 
  SystemRoleCode, 
  RolePermission, 
  UserProfile, 
  PermissionAction,
  PERMISSION_MODULES 
} from '../models/security.types';
import { securityService, buildInitialPermissions } from '../services/security.service';
import { usePermissions } from '../context/PermissionsContext';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';

export const UsersPermissionsView: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'sidebar']);
  const { reloadPermissions, currentRole } = usePermissions();
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('matrix');
  const [selectedRole, setSelectedRole] = useState<SystemRoleCode>('super_admin');
  
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Matrix State: Decoupled draft state from saved state
  const [draftPermissions, setDraftPermissions] = useState<RolePermission[]>([]);
  const [savedPermissions, setSavedPermissions] = useState<RolePermission[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Switch Role Confirmation Modal State
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<SystemRoleCode | null>(null);

  // Modals
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);

  // Target User for Edit / Password
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserProfile | null>(null);

  // Form Fields - New User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<SystemRoleCode>('viewer');
  const [newUserStaffId, setNewUserStaffId] = useState('');

  // Form Fields - Edit User
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<SystemRoleCode>('viewer');
  const [editUserStaffId, setEditUserStaffId] = useState('');

  // Form Fields - Password
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Form Fields - New Role
  const [newRoleNameAr, setNewRoleNameAr] = useState('');
  const [newRoleNameFr, setNewRoleNameFr] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Helper to ensure all modules exist in permissions array
  const normalizePermissions = (rawPerms: RolePermission[], roleCode: string): RolePermission[] => {
    const defaultRolePerms = buildInitialPermissions().filter(p => p.role_code === roleCode);
    return PERMISSION_MODULES.map(mod => {
      const found = rawPerms.find(p => p.permission_key === mod.key);
      const def = defaultRolePerms.find(p => p.permission_key === mod.key);
      const isSuper = roleCode === 'super_admin';
      return {
        id: found?.id || `perm-${roleCode}-${mod.key}`,
        role_code: roleCode,
        permission_key: mod.key,
        can_view: isSuper ? true : (found?.can_view !== undefined ? Boolean(found.can_view) : (def?.can_view ?? false)),
        can_create: isSuper ? true : (found?.can_create !== undefined ? Boolean(found.can_create) : (def?.can_create ?? false)),
        can_edit: isSuper ? true : (found?.can_edit !== undefined ? Boolean(found.can_edit) : (def?.can_edit ?? false)),
        can_delete: isSuper ? true : (found?.can_delete !== undefined ? Boolean(found.can_delete) : (def?.can_delete ?? false)),
        can_export: isSuper ? true : (found?.can_export !== undefined ? Boolean(found.can_export) : (def?.can_export ?? false)),
        can_print: isSuper ? true : (found?.can_print !== undefined ? Boolean(found.can_print) : (def?.can_print ?? false)),
      };
    });
  };

  // 1. Initial Load of Roles, Users, and Staff (Mount only)
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [r, u] = await Promise.all([
        securityService.getSystemRoles(),
        securityService.getUserProfiles(currentRole),
      ]);
      setRoles(r);
      setUsers(u);

      // Fetch approved staff list for linking
      if (isSupabaseConfigured()) {
        try {
          const { data: st } = await supabase.from('approved_staff').select('id, full_name, matricule, function_title');
          if (st) setStaffList(st);
        } catch (e) {
          // ignore
        }
      }

      // Default role selection
      const initialRole: SystemRoleCode = currentRole === 'super_admin' ? 'super_admin' : (r[0]?.code || 'accountant');
      setSelectedRole(initialRole);
      await loadRolePermissionsOnly(initialRole);
    } catch (err) {
      console.error('Error loading initial security data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Permissions ONLY for a specific role (Without full page reload)
  const loadRolePermissionsOnly = async (roleCode: SystemRoleCode) => {
    setMatrixLoading(true);
    try {
      const raw = await securityService.getRolePermissions(roleCode);
      const normalized = normalizePermissions(raw, roleCode);
      setDraftPermissions(normalized);
      setSavedPermissions(JSON.parse(JSON.stringify(normalized)));
    } catch (err) {
      console.error('Error loading role permissions:', err);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Check if draft permissions differ from saved permissions
  const hasUnsavedChanges = useMemo(() => {
    if (selectedRole === 'super_admin') return false;
    if (draftPermissions.length === 0 || savedPermissions.length === 0) return false;
    return draftPermissions.some(d => {
      const s = savedPermissions.find(p => p.permission_key === d.permission_key);
      if (!s) return true;
      return (
        Boolean(d.can_view) !== Boolean(s.can_view) ||
        Boolean(d.can_create) !== Boolean(s.can_create) ||
        Boolean(d.can_edit) !== Boolean(s.can_edit) ||
        Boolean(d.can_delete) !== Boolean(s.can_delete) ||
        Boolean(d.can_export) !== Boolean(s.can_export) ||
        Boolean(d.can_print) !== Boolean(s.can_print)
      );
    });
  }, [draftPermissions, savedPermissions, selectedRole]);

  // Count changed actions
  const unsavedChangesCount = useMemo(() => {
    if (selectedRole === 'super_admin') return 0;
    let count = 0;
    const actions: PermissionAction[] = ['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export', 'can_print'];
    draftPermissions.forEach(d => {
      const s = savedPermissions.find(p => p.permission_key === d.permission_key);
      if (!s) return;
      actions.forEach(act => {
        if (Boolean(d[act]) !== Boolean(s[act])) {
          count++;
        }
      });
    });
    return count;
  }, [draftPermissions, savedPermissions, selectedRole]);

  // Privacy Filtering
  const visibleUsers = useMemo(() => {
    return users.filter(u => {
      if (currentRole !== 'super_admin' && (u.role_code === 'super_admin' || u.email?.toLowerCase().trim() === 'mossaabel@arouaaudit.com')) {
        return false;
      }
      return true;
    });
  }, [users, currentRole]);

  const visibleRoles = useMemo(() => {
    return roles.filter(r => {
      if (currentRole !== 'super_admin' && r.code === 'super_admin') {
        return false;
      }
      return true;
    });
  }, [roles, currentRole]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(u =>
      u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.employee_name && u.employee_name.toLowerCase().includes(searchUser.toLowerCase()))
    );
  }, [visibleUsers, searchUser]);

  // Switch Role with Protection
  const handleSelectRole = (newRole: SystemRoleCode) => {
    if (newRole === selectedRole) return;
    if (hasUnsavedChanges) {
      setPendingRoleSwitch(newRole);
      return;
    }
    setSelectedRole(newRole);
    loadRolePermissionsOnly(newRole);
  };

  const confirmSwitchRole = async (saveFirst: boolean) => {
    if (!pendingRoleSwitch) return;
    const targetRole = pendingRoleSwitch;
    setPendingRoleSwitch(null);

    if (saveFirst) {
      await handleSavePermissions();
    }
    setSelectedRole(targetRole);
    await loadRolePermissionsOnly(targetRole);
  };

  // Checkbox Click (Instant Local State - ZERO Page Reload)
  const handleToggleSinglePermission = (permissionKey: string, action: PermissionAction) => {
    if (selectedRole === 'super_admin') return;

    setDraftPermissions(prev =>
      prev.map(p => {
        if (p.permission_key === permissionKey) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      })
    );
  };

  // Column-level Bulk Select (اختيار كل في كل إجراء)
  const getActionColumnStatus = (action: PermissionAction) => {
    const total = draftPermissions.length;
    if (total === 0) return { allGranted: false, noneGranted: true, count: 0 };
    const count = draftPermissions.filter(p => Boolean(p[action])).length;
    return {
      allGranted: count === total,
      noneGranted: count === 0,
      count,
      total
    };
  };

  const handleToggleColumnAction = (action: PermissionAction) => {
    if (selectedRole === 'super_admin') return;
    const status = getActionColumnStatus(action);
    const targetVal = !status.allGranted; // If all checked -> uncheck all, otherwise -> check all

    setDraftPermissions(prev =>
      prev.map(p => ({
        ...p,
        [action]: targetVal,
      }))
    );
  };

  // Row-level Bulk Select
  const isRowAllGranted = (permissionKey: string) => {
    const row = draftPermissions.find(p => p.permission_key === permissionKey);
    if (!row) return false;
    return Boolean(row.can_view && row.can_create && row.can_edit && row.can_delete && row.can_export && row.can_print);
  };

  const handleToggleRow = (permissionKey: string) => {
    if (selectedRole === 'super_admin') return;
    const allGranted = isRowAllGranted(permissionKey);
    const targetVal = !allGranted;

    setDraftPermissions(prev =>
      prev.map(p => {
        if (p.permission_key === permissionKey) {
          return {
            ...p,
            can_view: targetVal,
            can_create: targetVal,
            can_edit: targetVal,
            can_delete: targetVal,
            can_export: targetVal,
            can_print: targetVal,
          };
        }
        return p;
      })
    );
  };

  // Role-level Bulk Actions
  const handleGrantAllRole = () => {
    if (selectedRole === 'super_admin') return;
    setDraftPermissions(prev =>
      prev.map(p => ({
        ...p,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_export: true,
        can_print: true,
      }))
    );
  };

  const handleRevokeAllRole = () => {
    if (selectedRole === 'super_admin') return;
    setDraftPermissions(prev =>
      prev.map(p => ({
        ...p,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
        can_print: false,
      }))
    );
  };

  // Reset Draft to Saved State
  const handleDiscardChanges = () => {
    setDraftPermissions(JSON.parse(JSON.stringify(savedPermissions)));
    showToast('تم التراجع عن التعديلات غير المحفوظة وإعادة تعيين الصلاحيات', 'info');
  };

  // Save Permissions to Database & Security Audit
  const handleSavePermissions = async () => {
    if (selectedRole === 'super_admin') {
      showToast('حساب المشرف الأعلى يتمتع بكامل الصلاحيات غير المقيدة تلقائياً');
      return;
    }

    setIsSaving(true);
    try {
      await securityService.saveRolePermissions(selectedRole, draftPermissions);
      setSavedPermissions(JSON.parse(JSON.stringify(draftPermissions)));
      await reloadPermissions();
      
      const roleObj = roles.find(r => r.code === selectedRole);
      const roleName = isRtl ? (roleObj?.name_ar || selectedRole) : (roleObj?.name_fr || selectedRole);
      showToast(`تم حفظ وتطبيق صلاحيات الدور (${roleName}) بنجاح في قاعدة البيانات ✨`);
    } catch (err) {
      console.error('Failed to save role permissions:', err);
      showToast('حدث خطأ أثناء حفظ الصلاحيات، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // User Actions
  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    await securityService.deleteUserProfile(userId);
    showToast('تم حذف حساب المستخدم بنجاح');
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    const updated = await securityService.toggleUserSuspension(userId, !currentStatus);
    if (updated) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u));
      showToast(currentStatus ? 'تم إلغاء تجميد الحساب وتفعيله بنجاح' : 'تم تجميد وتعطيل حساب المستخدم بنجاح');
    }
  };

  // Open Edit User Modal
  const openEditUser = (user: UserProfile) => {
    setSelectedUserForEdit(user);
    setEditUserName(user.full_name);
    setEditUserEmail(user.email || '');
    setEditUserRole(user.role_code);
    setEditUserStaffId(user.linked_employee_id || user.employee_id || '');
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    const staffObj = staffList.find(s => s.id === editUserStaffId);
    const success = await securityService.updateUserProfile(selectedUserForEdit.id, {
      full_name: editUserName,
      email: editUserEmail,
      role_code: editUserRole,
      employee_id: editUserStaffId || undefined,
      linked_employee_id: editUserStaffId || undefined,
      employee_name: staffObj?.full_name || selectedUserForEdit.employee_name,
    });

    if (success) {
      setUsers(prev => prev.map(u => u.id === selectedUserForEdit.id ? {
        ...u,
        full_name: editUserName,
        email: editUserEmail,
        role_code: editUserRole,
        employee_id: editUserStaffId || undefined,
        linked_employee_id: editUserStaffId || undefined,
        employee_name: staffObj?.full_name || selectedUserForEdit.employee_name,
      } : u));
      setShowEditUserModal(false);
      showToast(`تم تحديث بيانات المستخدم (${editUserName}) بنجاح`);
    }
  };

  // Open Password Modal
  const openPasswordModal = (user: UserProfile) => {
    setSelectedUserForPassword(user);
    setNewPasswordVal('');
    setConfirmPasswordVal('');
    setShowPasswordModal(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (newPasswordVal.length < 6) {
      showToast('يجب أن تتكون كلمة المرور من 6 خانات على الأقل', 'error');
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      showToast('كلمة المرور وتأكيدها غير متطابقين', 'error');
      return;
    }

    const success = await securityService.updateUserPassword(selectedUserForPassword.id, newPasswordVal);
    if (success) {
      setShowPasswordModal(false);
      showToast(`تم تعيين وتحديث كلمة المرور للموظف (${selectedUserForPassword.full_name}) بنجاح`);
    } else {
      showToast('فشل تحديث كلمة المرور', 'error');
    }
  };

  // Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const staffObj = staffList.find(s => s.id === newUserStaffId);
    const created = await securityService.createUserProfile({
      full_name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role_code: newUserRole,
      employee_id: newUserStaffId || undefined,
      linked_employee_id: newUserStaffId || undefined,
      employee_name: staffObj?.full_name,
      is_suspended: false,
    });

    setUsers(prev => [created, ...prev]);
    setShowNewUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserStaffId('');
    showToast(`تم إنشاء حساب المستخدم (${created.full_name}) بنجاح`);
  };

  // Create Role Submit
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleNameAr.trim()) {
      showToast('يرجى ملء اسم الدور ورمزه النظامي', 'error');
      return;
    }

    const createdRole = await securityService.createSystemRole({
      code: newRoleCode.trim().toLowerCase(),
      name_ar: newRoleNameAr.trim(),
      name_fr: newRoleNameFr.trim() || newRoleNameAr.trim(),
      description_ar: newRoleDesc.trim(),
      description_fr: newRoleDesc.trim(),
      is_system_role: false,
      is_active: true,
    });

    setRoles(prev => [...prev, createdRole]);
    setShowNewRoleModal(false);
    setNewRoleNameAr('');
    setNewRoleNameFr('');
    setNewRoleCode('');
    setNewRoleDesc('');
    showToast(`تم إنشاء الدور (${createdRole.name_ar}) بنجاح`);
    setSelectedRole(createdRole.code);
    await loadRolePermissionsOnly(createdRole.code);
  };

  const handleDeleteRole = async (roleCode: string) => {
    if (roleCode === 'super_admin') return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الدور الوظيفي المخصص؟')) return;
    await securityService.deleteSystemRole(roleCode);
    showToast('تم حذف الدور المخصص بنجاح');
    setRoles(prev => prev.filter(r => r.code !== roleCode));
    const fallbackRole = roles.find(r => r.code !== roleCode)?.code || 'super_admin';
    setSelectedRole(fallbackRole);
    await loadRolePermissionsOnly(fallbackRole);
  };

  const totalUsersCount = visibleUsers.length;
  const suspendedCount = visibleUsers.filter(u => u.is_suspended).length;
  const activeRolesCount = visibleRoles.length;
  const currentRoleObj = roles.find(r => r.code === selectedRole);
  const isSelectedSuperAdmin = selectedRole === 'super_admin';

  const actionColumns: { action: PermissionAction; labelAr: string; labelFr: string; color: string }[] = [
    { action: 'can_view', labelAr: 'عرض', labelFr: 'Voir', color: 'emerald' },
    { action: 'can_create', labelAr: 'إضافة', labelFr: 'Créer', color: 'blue' },
    { action: 'can_edit', labelAr: 'تعديل', labelFr: 'Modifier', color: 'amber' },
    { action: 'can_delete', labelAr: 'حذف', labelFr: 'Supprimer', color: 'rose' },
    { action: 'can_export', labelAr: 'تصدير', labelFr: 'Exporter', color: 'indigo' },
    { action: 'can_print', labelAr: 'طباعة', labelFr: 'Imprimer', color: 'teal' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed bottom-6 left-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold text-white ${
            feedbackToast.type === 'error' ? 'bg-rose-600' : feedbackToast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-800'
          }`}>
            <CheckCheck className="w-5 h-5" />
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {isRtl ? 'إدارة المستخدمين والأدوار والصلاحيات' : 'Gestion des Utilisateurs & Rôles'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isRtl
                ? 'التحكم الشامل في صلاحيات الأقسام، إنشاء الأدوار وتعديل الموظفين وضبط كلمات المرور'
                : 'Contrôle complet des permissions RBAC, gestion des profils et mots de passe'}
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isRtl ? 'مصفوفة الأدوار والصلاحيات' : 'Matrice des Permissions'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isRtl ? 'المستخدمون والحسابات' : 'Utilisateurs & Profils'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Role Selection Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {isRtl ? 'اختر الدور الوظيفي لضبط صلاحياته:' : 'Sélectionnez le rôle à configurer:'}
              </span>
              <button
                type="button"
                onClick={() => setShowNewRoleModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'إضافة دور وظيفي جديد' : 'Nouveau Rôle'}</span>
              </button>
            </div>

            {/* Role Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {visibleRoles.map(role => {
                const isSelected = selectedRole === role.code;
                return (
                  <div key={role.code} className="inline-flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectRole(role.code)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/10 ring-2 ring-emerald-800/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{isRtl ? role.name_ar : role.name_fr}</span>
                      {isSelected && hasUnsavedChanges && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </button>
                    {role.code !== 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.code)}
                        title={isRtl ? 'حذف الدور المخصص' : 'Supprimer'}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky / Prominent Action & Save Bar */}
          <div className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            hasUnsavedChanges
              ? 'bg-amber-50/90 border-amber-200 shadow-md ring-2 ring-amber-400/20'
              : 'bg-white border-slate-100 shadow-xs'
          }`}>
            {/* Left: Role Info & Status */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isSelectedSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">
                    {isRtl ? currentRoleObj?.name_ar : currentRoleObj?.name_fr}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
                    {selectedRole}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {isSelectedSuperAdmin ? (
                    <span className="text-purple-700 font-bold">
                      {isRtl ? 'المشرف الأعلى يمتلك كافة الصلاحيات بدون قيود تلقائياً' : 'Super Admin a tous les privilèges sans restriction'}
                    </span>
                  ) : hasUnsavedChanges ? (
                    <span className="text-amber-800 font-black flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isRtl ? `لديك (${unsavedChangesCount}) تعديل غير محفوظ على هذا الدور` : `${unsavedChangesCount} modifications non enregistrées`}
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {isRtl ? 'جميع الصلاحيات محفوظة ومطبقة' : 'Toutes les permissions sont enregistrées'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Bulk Role Controls & Save Button */}
            {!isSelectedSuperAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Role-level Quick Actions */}
                <button
                  type="button"
                  onClick={handleGrantAllRole}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {isRtl ? 'تحديد كل الصلاحيات' : 'Tout cocher'}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllRole}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء كل الصلاحيات' : 'Tout décocher'}
                </button>

                {/* Discard Changes */}
                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تراجع' : 'Annuler'}</span>
                  </button>
                )}

                {/* Prominent Save Button */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSavePermissions}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer shadow-md ${
                    hasUnsavedChanges
                      ? 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-800/20'
                      : 'bg-emerald-800 hover:bg-emerald-900 shadow-emerald-800/10'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Enregistrement...') : (isRtl ? 'حفظ صلاحيات الدور' : 'Enregistrer les Permissions')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Matrix Table with Column-level Bulk Actions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase">
                    <th className="py-4 px-4 text-start min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span>{isRtl ? 'الوحدة / القسم' : 'Module / Section'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({PERMISSION_MODULES.length} وحدات)</span>
                      </div>
                    </th>

                    {/* Column Headers with Bulk Action Toggle */}
                    {actionColumns.map(col => {
                      const status = getActionColumnStatus(col.action);
                      return (
                        <th key={col.action} className="py-3 px-2 text-center min-w-[95px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-slate-800 font-bold">{isRtl ? col.labelAr : col.labelFr}</span>
                            {!isSelectedSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleColumnAction(col.action)}
                                title={isRtl ? `تحديد أو إلغاء الكل لإجراء (${col.labelAr})` : `Tout basculer pour ${col.labelFr}`}
                                className={`group flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  status.allGranted
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : status.noneGranted
                                    ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {status.allGranted ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : status.noneGranted ? (
                                  <span className="w-2.5 h-2.5 rounded-xs border border-slate-400 inline-block" />
                                ) : (
                                  <span className="text-[10px] font-mono leading-none">~</span>
                                )}
                                <span>{isRtl ? 'الكل' : 'Tous'}</span>
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}

                    <th className="py-4 px-4 text-center min-w-[110px]">
                      {isRtl ? 'إجراءات السطر' : 'Ligne'}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {PERMISSION_MODULES.map(mod => {
                    const perm = draftPermissions.find(p => p.permission_key === mod.key);
                    const rowAllGranted = isRowAllGranted(mod.key);

                    return (
                      <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-start">
                          <div className="font-bold text-slate-900">{isRtl ? mod.name_ar : mod.name_fr}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{mod.key}</div>
                        </td>

                        {/* Action Checkboxes (Instant local toggle) */}
                        {actionColumns.map(col => {
                          const isGranted = isSelectedSuperAdmin ? true : Boolean(perm?.[col.action]);
                          return (
                            <td key={col.action} className="py-3.5 px-2 text-center">
                              <button
                                type="button"
                                disabled={isSelectedSuperAdmin}
                                onClick={() => handleToggleSinglePermission(mod.key, col.action)}
                                title={isRtl ? `${col.labelAr}: ${isGranted ? 'مفعلة' : 'معطلة'}` : `${col.labelFr}`}
                                className={`w-7 h-7 rounded-xl inline-flex items-center justify-center transition-all shadow-2xs ${
                                  isGranted
                                    ? 'bg-emerald-600 text-white scale-100'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                                } ${isSelectedSuperAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'}`}
                              >
                                <Check className={`w-4 h-4 stroke-[2.5] ${isGranted ? 'opacity-100' : 'opacity-0'}`} />
                              </button>
                            </td>
                          );
                        })}

                        {/* Row Bulk Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          {!isSelectedSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleRow(mod.key)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                rowAllGranted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {rowAllGranted ? (isRtl ? 'إلغاء السطر' : 'Décocher') : (isRtl ? 'تحديد السطر' : 'Cocher')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Save Bar */}
            {!isSelectedSuperAdmin && (
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {hasUnsavedChanges
                    ? (isRtl ? '⚠️ اضغط حفظ لتطبيق التعديلات على النظام وقاعدة البيانات' : 'Appuyez sur enregistrer pour valider')
                    : (isRtl ? '✓ جميع خيارات الصلاحيات مطبقة' : 'Toutes les permissions sont validées')}
                </span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSavePermissions}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 shadow-md shadow-emerald-800/10 cursor-pointer transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Enregistrement...') : (isRtl ? 'حفظ صلاحيات الدور' : 'Enregistrer')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{totalUsersCount}</div>
                <div className="text-xs text-slate-500">{isRtl ? 'إجمالي حسابات المستخدمين' : 'Total Utilisateurs'}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{activeRolesCount}</div>
                <div className="text-xs text-slate-500">{isRtl ? 'الأدوار الوظيفية المعرفة' : 'Rôles Définis'}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{suspendedCount}</div>
                <div className="text-xs text-slate-500">{isRtl ? 'حسابات مجمدة وموقوفة' : 'Comptes Suspendus'}</div>
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                type="text"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder={isRtl ? 'بحث بالاسم أو البريد أو الموظف...' : 'Rechercher utilisateur...'}
                className="w-full ps-9 pe-4 py-2 rounded-2xl bg-slate-50 border-none text-xs focus:ring-2 focus:ring-emerald-800/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowNewUserModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md shadow-emerald-800/10 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة مستخدم جديد' : 'Ajouter un utilisateur'}</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase">
                    <th className="py-4 px-4 text-start">{isRtl ? 'المستخدم' : 'Utilisateur'}</th>
                    <th className="py-4 px-4 text-start">{isRtl ? 'الموظف المرتبط' : 'Employé lié'}</th>
                    <th className="py-4 px-4 text-start">{isRtl ? 'الدور الوظيفي' : 'Rôle'}</th>
                    <th className="py-4 px-4 text-center">{isRtl ? 'الحالة' : 'Statut'}</th>
                    <th className="py-4 px-4 text-center">{isRtl ? 'إجراءات الحساب' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map(user => {
                    const role = roles.find(r => r.code === user.role_code);
                    const isUserSuperAdmin = user.role_code === 'super_admin';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700">
                              {user.full_name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.full_name}</span>
                                {isUserSuperAdmin && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-100 text-purple-800 font-black">
                                    {isRtl ? 'المشرف الأعلى' : 'Super Admin'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{user.email || '—'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {user.employee_name ? (
                            <span className="text-slate-800 font-bold">{user.employee_name}</span>
                          ) : (
                            <span className="text-slate-400 italic">{isRtl ? 'غير مرتبط بموظف' : 'Non lié'}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
                            {isRtl ? role?.name_ar || user.role_code : role?.name_fr || user.role_code}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {user.is_suspended ? (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-600">
                              {isRtl ? 'مجمد' : 'Suspendu'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800">
                              {isRtl ? 'نشط' : 'Actif'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditUser(user)}
                              title={isRtl ? 'تعديل المستخدم والموظف والدور' : 'Modifier'}
                              className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Password Button */}
                            <button
                              type="button"
                              onClick={() => openPasswordModal(user)}
                              title={isRtl ? 'تعيين / تغيير كلمة المرور' : 'Changer mot de passe'}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Suspension Toggle */}
                            {!isUserSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspension(user.id, user.is_suspended)}
                                title={user.is_suspended ? (isRtl ? 'إلغاء التجميد' : 'Activer') : (isRtl ? 'تجميد الحساب' : 'Suspendre')}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                              >
                                {user.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete Button */}
                            {!isUserSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                title={isRtl ? 'حذف الحساب' : 'Supprimer'}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SWITCH ROLE MODAL IF UNSAVED CHANGES */}
      {pendingRoleSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-black text-slate-900 text-sm">
                {isRtl ? 'تعديلات غير محفوظة على الصلاحيات' : 'Modifications non enregistrées'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isRtl
                ? 'لقد قمت بإجراء تعديلات على صلاحيات الدور الحالي ولم يتم حفظها بعد. هل ترغب في حفظ التعديلات قبل الانتقال للدور الآخر؟'
                : 'Vous avez des modifications non enregistrées sur ce rôle. Voulez-vous enregistrer avant de changer?'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingRoleSwitch(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isRtl ? 'البقاء هنا' : 'Rester'}
              </button>
              <button
                type="button"
                onClick={() => confirmSwitchRole(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                {isRtl ? 'تجاهل والانتقال' : 'Ignorer'}
              </button>
              <button
                type="button"
                onClick={() => confirmSwitchRole(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition cursor-pointer"
              >
                {isRtl ? 'حفظ ثم انتقال' : 'Enregistrer et changer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT USER */}
      {showEditUserModal && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-800" />
                <span>{isRtl ? 'تعديل بيانات المستخدم والموظف والدور' : 'Modifier le profil utilisateur'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الاسم الكامل للمستخدم' : 'Nom complet'}
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={e => setEditUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={e => setEditUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ربط الحساب بملف موظف معتمد' : 'Lier à un employé'}
                </label>
                <select
                  value={editUserStaffId}
                  onChange={e => setEditUserStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                >
                  <option value="">{isRtl ? '-- بدون ربط بموظف معتمد --' : '-- Aucun --'}</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.function_title || st.matricule || 'موظف'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الدور الوظيفي والصلاحيات' : 'Rôle système'}
                </label>
                <select
                  value={editUserRole}
                  onChange={e => setEditUserRole(e.target.value as SystemRoleCode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                >
                  {visibleRoles.map(r => (
                    <option key={r.code} value={r.code}>
                      {isRtl ? r.name_ar : r.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-sm"
                >
                  {isRtl ? 'حفظ التعديلات' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PASSWORD CHANGE */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>{isRtl ? 'تعيين كلمة المرور للموظف' : 'Changer mot de passe'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 text-blue-800 rounded-2xl text-xs">
              <span className="font-bold">{selectedUserForPassword.full_name}</span> ({selectedUserForPassword.email})
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={newPasswordVal}
                    onChange={e => setNewPasswordVal(e.target.value)}
                    placeholder="******"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20 pe-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirmer mot de passe'}
                </label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  value={confirmPasswordVal}
                  onChange={e => setConfirmPasswordVal(e.target.value)}
                  placeholder="******"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  {isRtl ? 'تحديث كلمة المرور' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW USER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-800" />
                <span>{isRtl ? 'إضافة مستخدم جديد للنظام' : 'Nouvel utilisateur'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الاسم الكامل' : 'Nom complet'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder={isRtl ? 'مثال: محمد العمري' : 'Ex: Jean Dupont'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'البريد الإلكتروني (لتسجيل الدخول)' : 'Adresse Email'}
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="user@arouaaudit.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'كلمة المرور' : 'Mot de passe'}
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="******"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'ربط الحساب بملف موظف معتمد (اختياري)' : 'Lier à un employé'}
                </label>
                <select
                  value={newUserStaffId}
                  onChange={e => setNewUserStaffId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                >
                  <option value="">{isRtl ? '-- بدون ربط --' : '-- Aucun --'}</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.function_title || st.matricule || 'موظف'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الدور الوظيفي' : 'Rôle'}
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as SystemRoleCode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                >
                  {visibleRoles.map(r => (
                    <option key={r.code} value={r.code}>
                      {isRtl ? r.name_ar : r.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-sm"
                >
                  {isRtl ? 'إنشاء المستخدم' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW ROLE */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-800" />
                <span>{isRtl ? 'إضافة دور وظيفي جديد ومخصص' : 'Créer un nouveau rôle'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'مسمى الدور بالعربية' : 'Nom du rôle (Ar)'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoleNameAr}
                  onChange={e => setNewRoleNameAr(e.target.value)}
                  placeholder={isRtl ? 'مثال: مدقق ميداني، محاسب مساعد' : 'Ex: Auditeur Terrain'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'مسمى الدور بالفرنسية (اختياري)' : 'Nom du rôle (Fr)'}
                </label>
                <input
                  type="text"
                  value={newRoleNameFr}
                  onChange={e => setNewRoleNameFr(e.target.value)}
                  placeholder="Ex: Auditeur Terrain"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'الرمز البرمجي للدور (System Code بالإنجليزية)' : 'Code système (identifiant unique)'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoleCode}
                  onChange={e => setNewRoleCode(e.target.value)}
                  placeholder="field_auditor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'وصف المهام والمسؤوليات' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder={isRtl ? 'تفاصيل المهام المناطة بهذا الدور...' : 'Description des tâches...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-sm"
                >
                  {isRtl ? 'حفظ الدور الجديد' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
