import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Key, 
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
  Trash2
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
  const { reloadPermissions } = usePermissions();
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('users');
  const [selectedRole, setSelectedRole] = useState<SystemRoleCode>('super_admin');
  
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  // New User Modal State
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<SystemRoleCode>('cashier');
  const [newUserEmployee, setNewUserEmployee] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, p, u] = await Promise.all([
        securityService.getSystemRoles(),
        securityService.getRolePermissions(selectedRole),
        securityService.getUserProfiles(),
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

  const handleTogglePermission = async (permissionKey: string, action: PermissionAction, currentValue: boolean) => {
    const keyId = `${permissionKey}-${action}`;
    setUpdatingKey(keyId);
    const newValue = !currentValue;

    // Optimistic UI update
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
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, is_suspended: nextStatus } : u))
    );
    await securityService.toggleUserSuspension(userId, nextStatus);
  };

  const handleRoleChange = async (userId: string, newRole: SystemRoleCode) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role_code: newRole } : u))
    );
    await securityService.updateUserRole(userId, newRole);
    await reloadPermissions();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    await securityService.createUserProfile({
      full_name: newUserName,
      email: newUserEmail || `${newUserName.toLowerCase().replace(/\s+/g, '')}@arouaschools.ma`,
      role_code: newUserRole,
      employee_name: newUserEmployee || newUserName,
      is_suspended: false,
    });

    setIsNewUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserEmployee('');
    const updatedUsers = await securityService.getUserProfiles();
    setUsers(updatedUsers);
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchUser.toLowerCase())) ||
    (u.employee_name && u.employee_name.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const totalUsers = users.length;
  const suspendedCount = users.filter(u => u.is_suspended).length;
  const activeRolesCount = roles.length;

  return (
    <div className="space-y-6">
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
          </div>

          <button
            type="button"
            onClick={() => loadAll()}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl shadow-xs transition cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-emerald-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'إجمالي الحسابات المسجلة' : 'Total Utilisateurs'}
          </span>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">{totalUsers}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'حساب موظف معتمد في المنظومة' : 'Comptes enregistrés'}
          </span>
        </div>

        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-teal-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'الأدوار النظامية المعرفة' : 'Rôles Définis'}
          </span>
          <p className="text-3xl font-black text-teal-700 font-mono tracking-tight">{activeRolesCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'رتب وظيفية محددة الصلاحيات' : 'Rôles avec profils d\'accès'}
          </span>
        </div>

        <div className="standard-kpi-card text-start"><div className={`w-1.5 h-full absolute top-0 ${isRtl ? 'right-0' : 'left-0'} bg-rose-500`} />
          <span className="text-xs text-slate-500 font-bold block mb-1">
            {isRtl ? 'الحسابات المعلقة' : 'Comptes Suspendus'}
          </span>
          <p className="text-3xl font-black text-rose-600 font-mono tracking-tight">{suspendedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block font-medium">
            {isRtl ? 'وصول مقفل بالكامل' : 'Accès bloqués temporairement'}
          </span>
        </div>
      </div>

      {/* TAB 1: PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Roles Selector Pills */}
          <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 px-2 shrink-0">
              {isRtl ? 'اختر الدور لضبط صلاحياته:' : 'Sélectionner le rôle :'}
            </span>
            {roles.map(r => (
              <button
                key={r.code}
                type="button"
                onClick={() => setSelectedRole(r.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRole === r.code
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isRtl ? r.name_ar : r.name_fr}
              </button>
            ))}
          </div>

          {/* Matrix Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-start">
                <Key className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-slate-900">
                  {isRtl 
                    ? `مصفوفة أذونات الدور: [${roles.find(r => r.code === selectedRole)?.name_ar || selectedRole}]`
                    : `Matrice des privilèges pour : [${roles.find(r => r.code === selectedRole)?.name_fr || selectedRole}]`}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{isRtl ? 'التعديل يطبق لحظياً في قاعدة البيانات' : 'Modifications enregistrées instantanément'}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-start">{isRtl ? 'الوحدة / الميزة الحساسة' : 'Module / Fonctionnalité'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'معاينة (View)' : 'Voir'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'إنشاء (Create)' : 'Créer'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'تعديل (Edit)' : 'Modifier'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'حذف (Delete)' : 'Supprimer'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'تصدير (Export)' : 'Exporter'}</th>
                    <th className="py-3.5 px-3 text-center">{isRtl ? 'طباعة (Print)' : 'Imprimer'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {PERMISSION_MODULES.map(mod => {
                    const perm = permissions.find(p => p.permission_key === mod.key);
                    const isSuperAdminRole = selectedRole === 'super_admin';

                    const actions: PermissionAction[] = [
                      'can_view',
                      'can_create',
                      'can_edit',
                      'can_delete',
                      'can_export',
                      'can_print',
                    ];

                    return (
                      <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-start">
                          <span className="font-bold text-slate-900 block text-xs">
                            {isRtl ? mod.name_ar : mod.name_fr}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                            {mod.key} • {isRtl ? mod.description_ar : mod.description_fr}
                          </span>
                        </td>

                        {actions.map(act => {
                          const val = isSuperAdminRole ? true : Boolean(perm?.[act]);
                          const isUpdating = updatingKey === `${mod.key}-${act}`;

                          return (
                            <td key={act} className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={isSuperAdminRole || isUpdating}
                                onClick={() => handleTogglePermission(mod.key, act, val)}
                                className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all ${
                                  isSuperAdminRole
                                    ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed opacity-90'
                                    : val
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer active:scale-95'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 cursor-pointer'
                                }`}
                                title={val ? 'مفعل (Cliquer pour désactiver)' : 'معطل (Cliquer pour activer)'}
                              >
                                {val ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5" />}
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
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
              <input
                type="text"
                placeholder={isRtl ? 'البحث باسم الموظف أو البريد الإلكتروني...' : 'Recherche par nom ou email...'}
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className={`w-full bg-white border border-slate-200 rounded-xl ${
                  isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                } py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600`}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة حساب مستخدم جديد' : 'Nouvel Utilisateur'}</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-4 text-start">{isRtl ? 'المستخدم والموظف المرتبط' : 'Utilisateur & Salarié'}</th>
                    <th className="py-4 px-4 text-start">{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="py-4 px-4 text-start">{isRtl ? 'الدور المسند' : 'Rôle Attribué'}</th>
                    <th className="py-4 px-4 text-start">{isRtl ? 'آخر تسجيل دخول' : 'Dernière Connexion'}</th>
                    <th className="py-4 px-4 text-center">{isRtl ? 'حالة الحساب' : 'Statut'}</th>
                    <th className="py-4 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
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
                  ) : filteredUsers.map(user => {
                    const isSuspended = user.is_suspended;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {user.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{user.full_name}</span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {user.employee_name || 'موظف مستقل'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-600 text-start">
                          {user.email || '—'}
                        </td>

                        <td className="py-4 px-4 text-start">
                          <select
                            value={user.role_code}
                            onChange={e => handleRoleChange(user.id, e.target.value as SystemRoleCode)}
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                          >
                            {roles.map(r => (
                              <option key={r.code} value={r.code}>
                                {isRtl ? r.name_ar : r.name_fr}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-500 text-start">
                          {user.last_login_at || 'لم يسجل دخول'}
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
                            <button
                              type="button"
                              onClick={() => handleToggleSuspension(user.id, isSuspended)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                isSuspended
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isSuspended 
                                ? (isRtl ? 'إلغاء التعليق' : 'Réactiver') 
                                : (isRtl ? 'تعليق الحساب' : 'Suspendre')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              title="حذف الحساب نهائياً"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* NEW USER MODAL */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
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

            <form onSubmit={handleCreateUser} className="space-y-4">
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
                  {roles.map(r => (
                    <option key={r.code} value={r.code}>
                      {isRtl ? r.name_ar : r.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
                  {isRtl ? 'ربط بسجل الموظف (اختياري)' : 'Salarié Associé (Optionnel)'}
                </label>
                <input
                  type="text"
                  value={newUserEmployee}
                  onChange={e => setNewUserEmployee(e.target.value)}
                  placeholder="المعرف أو صفة الموظف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {isRtl ? 'حفظ وتفعيل الحساب' : 'Créer le Compte'}
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
