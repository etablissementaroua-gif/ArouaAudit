import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Key, 
  KeyRound,
  Edit3,
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Check, 
  X, 
  AlertCircle,
  Sparkles,
  Sliders,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { securityService } from '../services/security.service';
import { 
  SystemRole, 
  SystemRoleCode, 
  RolePermission, 
  UserProfile, 
  PermissionAction, 
  PERMISSION_MODULES 
} from '../models/security.types';
import { usePermissions } from '../context/PermissionsContext';

export const UsersPermissionsView: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'sidebar']);
  const { reloadPermissions, currentRole } = usePermissions();
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('users');
  const [selectedRole, setSelectedRole] = useState<SystemRoleCode>('super_admin');
  
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // New User Modal State
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<SystemRoleCode>('cashier');
  const [newUserEmployee, setNewUserEmployee] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // New Role Modal State
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleNameAr, setNewRoleNameAr] = useState('');
  const [newRoleNameFr, setNewRoleNameFr] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editRoleCode, setEditRoleCode] = useState<SystemRoleCode>('cashier');

  // Change Password Modal State
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, p, u] = await Promise.all([
        securityService.getSystemRoles(),
        securityService.getRolePermissions(selectedRole),
        securityService.getUserProfiles(currentRole),
      ]);
      setRoles(r);
      setPermissions(p);
      setUsers(u);
    } catch (err) {
      console.error('Error loading security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedRole]);

  // Super Admin Privacy Masking: Non-super_admin viewers NEVER see the Super Admin account!
  const visibleUsers = users.filter(u => {
    if (currentRole !== 'super_admin' && (u.role_code === 'super_admin' || u.email?.toLowerCase().trim() === 'mossaabel@arouaaudit.com')) {
      return false;
    }
    return true;
  });

  const visibleRoles = roles.filter(r => {
    if (currentRole !== 'super_admin' && r.code === 'super_admin') {
      return false;
    }
    return true;
  });

  const filteredUsers = visibleUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchUser.toLowerCase())) ||
    (u.employee_name && u.employee_name.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const handleTogglePermission = async (permissionKey: string, action: PermissionAction, currentValue: boolean) => {
    const keyId = `${permissionKey}-${action}`;
    setUpdatingKey(keyId);
    const newValue = !currentValue;

    setPermissions(prev =>
      prev.map(p => {
        if (p.permission_key === permissionKey) {
          return { ...p, [action]: newValue };
        }
        return p;
      })
    );

    try {
      await securityService.updateRolePermission(selectedRole, permissionKey, action, newValue);
      await reloadPermissions();
    } catch (err) {
      console.error('Failed to toggle permission:', err);
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    await securityService.deleteUserProfile(userId);
    showToast('تم حذف حساب المستخدم بنجاح');
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, is_suspended: nextStatus } : u))
    );
    await securityService.toggleUserSuspension(userId, nextStatus);
    showToast(nextStatus ? 'تم تعليق الحساب' : 'تم تفعيل الحساب');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const created = await securityService.createUserProfile({
      full_name: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@arouaschools.ma`,
      role_code: newUserRole,
      employee_name: newUserEmployee.trim() || newUserName.trim(),
      is_suspended: false,
    });

    if (newUserPassword.trim()) {
      await securityService.updateUserPassword(created.id, newUserPassword.trim());
    }

    setIsNewUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserEmployee('');
    setNewUserPassword('');
    showToast('تم إنشاء وتفعيل حساب المستخدم بنجاح');
    await loadAll();
  };

  // Open Edit User Modal
  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditEmail(user.email || '');
    setEditEmployeeName(user.employee_name || '');
    setEditRoleCode(user.role_code);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await securityService.updateUserProfile(editingUser.id, {
      full_name: editFullName.trim(),
      email: editEmail.trim(),
      employee_name: editEmployeeName.trim(),
      role_code: editRoleCode,
    });

    setUsers(prev =>
      prev.map(u => u.id === editingUser.id ? {
        ...u,
        full_name: editFullName.trim(),
        email: editEmail.trim(),
        employee_name: editEmployeeName.trim(),
        role_code: editRoleCode,
      } : u)
    );

    setEditingUser(null);
    showToast('تم حفظ تعديلات المستخدم والموظف والدور بنجاح');
    await reloadPermissions();
  };

  // Open Password Modal
  const openPasswordModal = (user: UserProfile) => {
    setPasswordUser(user);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordError(null);
    setShowPassword(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(res);
    setConfirmPasswordInput(res);
    setShowPassword(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;
    if (newPasswordInput.length < 6) {
      setPasswordError('يجب أن تتكون كلمة المرور من 6 أحرف/أرقام على الأقل');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    await securityService.updateUserPassword(passwordUser.id, newPasswordInput);
    setPasswordUser(null);
    showToast(`تم تحديث كلمة المرور للموظف (${passwordUser.full_name}) بنجاح`);
  };

  // Create New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleNameAr.trim()) return;

    const code = (newRoleCode.trim() || newRoleNameFr.trim() || newRoleNameAr.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `role_${Date.now()}`;

    const createdRole = await securityService.createSystemRole({
      code,
      name_ar: newRoleNameAr.trim(),
      name_fr: newRoleNameFr.trim() || newRoleNameAr.trim(),
      description_ar: newRoleDesc.trim() || 'دور وظيفي مخصص',
      description_fr: newRoleDesc.trim() || 'Rôle personnalisé',
      is_system_role: false,
      is_active: true,
    });

    setIsNewRoleModalOpen(false);
    setNewRoleNameAr('');
    setNewRoleNameFr('');
    setNewRoleCode('');
    setNewRoleDesc('');
    showToast(`تم إنشاء الدور (${createdRole.name_ar}) بنجاح وإدراجه في مصفوفة الصلاحيات`);
    await loadAll();
    setSelectedRole(createdRole.code);
  };

  const handleDeleteRole = async (roleCode: string) => {
    if (roleCode === 'super_admin') return;
    await securityService.deleteSystemRole(roleCode);
    showToast('تم حذف الدور المخصص بنجاح');
    setSelectedRole('super_admin');
    await loadAll();
  };

  const totalUsersCount = visibleUsers.length;
  const suspendedCount = visibleUsers.filter(u => u.is_suspended).length;
  const activeRolesCount = visibleRoles.length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-start">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isRtl ? 'إدارة حسابات المستخدمين ومصفوفة الصلاحيات' : 'Gestion des Utilisateurs & Matrice des Droits (RBAC)'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-mono">
                RBAC v2.0
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {isRtl 
                ? 'التحكم الدقيق في أدوار العاملين، صلاحيات الأزرار، والعمليات المحاسبية في الوقت الحقيقي' 
                : 'Contrôle granulaire des rôles, permissions d\'actions et accès comptables en temps réel'}
            </p>
          </div>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isRtl ? 'حسابات الموظفين' : 'Comptes Utilisateurs'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مصفوفة الصلاحيات' : 'Matrice des Droits'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewUserModalOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-800/10 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة حساب مستخدم جديد' : 'Ajouter Utilisateur'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              {isRtl ? 'إجمالي الحسابات المسجلة' : 'Total Utilisateurs'}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">{totalUsersCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {isRtl ? 'حساب موظف معتمد في المنظومة' : 'Comptes actifs configurés'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              {isRtl ? 'الأدوار النظامية المعرفة' : 'Rôles Définis'}
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono">{activeRolesCount}</span>
            <span className="text-[11px] text-emerald-800 block mt-0.5">
              {isRtl ? 'أدوار وظيفية محددة الصلاحيات' : 'Rôles configurés'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              {isRtl ? 'الحسابات المعلقة' : 'Comptes Suspendus'}
            </span>
            <span className="text-2xl font-black text-rose-600 font-mono">{suspendedCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {isRtl ? 'وصول مقفل بالكامل' : 'Accès temporairement bloqué'}
            </span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder={isRtl ? 'البحث باسم الموظف أو البريد الإلكتروني...' : 'Rechercher par nom ou email...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 pl-9"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={loadAll}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isRtl ? 'تحديث' : 'Actualiser'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-start">{isRtl ? 'المستخدم والموظف المرتبط' : 'Utilisateur & Salarié'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الدور المسند' : 'Rôle'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'حالة الحساب' : 'Statut'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الإجراءات والتحكم' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-600">لا توجد حسابات مستخدمين مسجلة حتى الآن</p>
                      <p className="text-xs text-slate-400 mt-1">يمكنك إضافة أول حساب مستخدم للمنظومة عبر زر «إضافة حساب مستخدم جديد»</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const isSuspended = user.is_suspended;
                    const matchedRole = roles.find(r => r.code === user.role_code);
                    const isSuperAdminUser = user.role_code === 'super_admin' || user.email?.toLowerCase().trim() === 'mossaabel@arouaaudit.com';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {user.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{user.full_name}</span>
                                {isSuperAdminUser && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    مشرف أعلى
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium block">
                                {user.employee_name || 'موظف معتمد'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-start font-mono text-slate-600">
                          {user.email || '---'}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                            {isRtl ? (matchedRole?.name_ar || user.role_code) : (matchedRole?.name_fr || user.role_code)}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <UserX className="w-3 h-3" />
                              <span>{isRtl ? 'معلق / محظور' : 'Suspendu'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3 h-3" />
                              <span>{isRtl ? 'نشط ومصرح' : 'Actif'}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit User Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              title={isRtl ? 'تعديل بيانات المستخدم والموظف والدور' : 'Modifier'}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-800 transition shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Password Change Button */}
                            <button
                              type="button"
                              onClick={() => openPasswordModal(user)}
                              title={isRtl ? 'تعديل وتعيين كلمة المرور للموظف' : 'Changer mot de passe'}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition shadow-xs cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspension Toggle Button (Protected against self) */}
                            {!isSuperAdminUser && (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspension(user.id, isSuspended)}
                                title={isSuspended ? 'إلغاء التعليق' : 'تعليق الحساب'}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                  isSuspended
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isSuspended 
                                  ? (isRtl ? 'إلغاء التعليق' : 'Réactiver') 
                                  : (isRtl ? 'تعليق' : 'Suspendre')}
                              </button>
                            )}

                            {/* Delete User Button (Protected against super_admin) */}
                            {!isSuperAdminUser && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                title={isRtl ? 'حذف الحساب نهائياً' : 'Supprimer'}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition shadow-xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isRtl ? 'مصفوفة ضبط صلاحيات الأزرار والعمليات' : 'Matrice Granulaire des Droits'}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {isRtl 
                  ? 'حدد الدور الوظيفي لتفعيل أو حجب الإجراءات بدقة في الوقت الفعلي' 
                  : 'Sélectionnez un rôle pour configurer ses permissions en temps réel'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNewRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إنشاء دور وظيفي جديد' : 'Créer Nouveau Rôle'}</span>
            </button>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {visibleRoles.map(role => {
              const isSelected = selectedRole === role.code;
              return (
                <div key={role.code} className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(role.code)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{isRtl ? role.name_ar : role.name_fr}</span>
                  </button>
                  {role.code !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role.code)}
                      title={isRtl ? 'حذف هذا الدور' : 'Supprimer ce rôle'}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Permissions Table for Selected Role */}
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 text-start">{isRtl ? 'الوحدة / الشاشة' : 'Module / Fonctionnalité'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'معاينة (View)' : 'Voir'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'إضافة (Create)' : 'Créer'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'تعديل (Edit)' : 'Modifier'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'حذف (Delete)' : 'Supprimer'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'تصدير (Export)' : 'Exporter'}</th>
                  <th className="py-3 px-2 text-center">{isRtl ? 'طباعة (Print)' : 'Imprimer'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {PERMISSION_MODULES.map(mod => {
                  const perm = permissions.find(p => p.permission_key === mod.key);
                  const isRoleSuperAdmin = selectedRole === 'super_admin';

                  return (
                    <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-start">
                        <div className="font-bold text-slate-900">{isRtl ? mod.name_ar : mod.name_fr}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{mod.key}</div>
                      </td>

                      {(['can_view', 'can_create', 'can_edit', 'can_delete', 'can_export', 'can_print'] as PermissionAction[]).map(action => {
                        const isGranted = isRoleSuperAdmin ? true : Boolean(perm?.[action]);
                        const isUpdating = updatingKey === `${mod.key}-${action}`;

                        return (
                          <td key={action} className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              disabled={isRoleSuperAdmin || isUpdating}
                              onClick={() => handleTogglePermission(mod.key, action, isGranted)}
                              className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition shadow-2xs ${
                                isGranted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                              } ${isRoleSuperAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: NEW USER */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-800" />
                <h3 className="font-black text-sm text-slate-900">
                  {isRtl ? 'إنشاء حساب مستخدم جديد' : 'Créer un Compte Utilisateur'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الاسم الكامل للمستخدم' : 'Nom Complet'}
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="مثال: ذ. عبد الرحيم العلمي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'البريد الإلكتروني المهني' : 'Email Professionnel'}
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="nom@arouaschools.ma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الدور والصلاحية المسندة' : 'Rôle Attribué'}
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as SystemRoleCode)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                >
                  {visibleRoles.map(r => (
                    <option key={r.code} value={r.code}>
                      {isRtl ? r.name_ar : r.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'ربط بسجل الموظف' : 'Salarié Associé'}
                </label>
                <input
                  type="text"
                  value={newUserEmployee}
                  onChange={e => setNewUserEmployee(e.target.value)}
                  placeholder="المعرف أو صفة الموظف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'كلمة المرور الابتدائية للموظف' : 'Mot de passe initial'}
                </label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="كلمة مرور الدخول للموظف (مثال: Aroua2026!)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ وتفعيل الحساب' : 'Créer le Compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER & EMPLOYEE & ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-800" />
                <h3 className="font-black text-sm text-slate-900">
                  {isRtl ? 'تعديل بيانات المستخدم والموظف والدور' : 'Modifier Utilisateur & Rôle'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الاسم الكامل للمستخدم' : 'Nom Complet'}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الموظف المرتبط' : 'Salarié Lié'}
                </label>
                <input
                  type="text"
                  value={editEmployeeName}
                  onChange={e => setEditEmployeeName(e.target.value)}
                  placeholder="اسم أو صفة الموظف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الدور الوظيفي والصلاحيات' : 'Rôle Attribué'}
                </label>
                <select
                  value={editRoleCode}
                  onChange={e => setEditRoleCode(e.target.value as SystemRoleCode)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                >
                  {visibleRoles.map(r => (
                    <option key={r.code} value={r.code}>
                      {isRtl ? r.name_ar : r.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ التعديلات' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CHANGE EMPLOYEE PASSWORD */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {isRtl ? 'تعديل وتعيين كلمة المرور للموظف' : 'Modifier le Mot de Passe'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {passwordUser.full_name} ({passwordUser.email})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 text-start">
                    {isRtl ? 'كلمة المرور الجديدة' : 'Nouveau Mot de Passe'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isRtl ? 'توليد كلمة سر عشوائية قوية' : 'Générer aléatoire'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={e => setNewPasswordInput(e.target.value)}
                    placeholder="6 أحرف أو أرقام على الأقل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'تأكيد كلمة المرور' : 'Confirmer le Mot de Passe'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPasswordInput}
                  onChange={e => setConfirmPasswordInput(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور للتأكيد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ كلمة المرور الجديدة' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW SYSTEM ROLE */}
      {isNewRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-800" />
                <h3 className="font-black text-sm text-slate-900">
                  {isRtl ? 'إنشاء دور وظيفي جديد وضبط صلاحياته' : 'Créer un Nouveau Rôle'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'اسم الدور الوظيفي (بالعربية)' : 'Nom du Rôle (Arabe)'}
                </label>
                <input
                  type="text"
                  required
                  value={newRoleNameAr}
                  onChange={e => setNewRoleNameAr(e.target.value)}
                  placeholder="مثال: أمين الصندوق الرئيسي، كاتب عام، مراقب مالي..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'اسم الدور (بالفرنسية)' : 'Nom du Rôle (Français)'}
                </label>
                <input
                  type="text"
                  value={newRoleNameFr}
                  onChange={e => setNewRoleNameFr(e.target.value)}
                  placeholder="Ex: Caissier Principal, Contrôleur..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'الرمز البرمجي للدور (Slug اختياري)' : 'Code Slug'}
                </label>
                <input
                  type="text"
                  value={newRoleCode}
                  onChange={e => setNewRoleCode(e.target.value)}
                  placeholder="مثال: main_cashier"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'وصف المهام والمسؤوليات' : 'Description du Rôle'}
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="تحديد نطاق المهام والمسؤوليات المخولة لصاحب هذا الدور..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isRtl ? 'إنشاء وتخصيص الصلاحيات' : 'Créer et Configurer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPermissionsView;
