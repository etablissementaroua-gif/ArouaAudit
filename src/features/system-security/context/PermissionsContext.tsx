import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  SystemRole, 
  SystemRoleCode, 
  RolePermission, 
  UserProfile, 
  PermissionAction 
} from '../models/security.types';
import { securityService } from '../services/security.service';

interface PermissionsContextType {
  currentUser: UserProfile;
  currentRole: SystemRoleCode;
  roles: SystemRole[];
  permissions: Map<string, RolePermission>;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permissionKey: string, action?: PermissionAction) => boolean;
  canAccessRoute: (routePermissionKey: string) => boolean;
  switchRole: (roleCode: SystemRoleCode) => Promise<void>;
  loginUser: (user: UserProfile) => Promise<void>;
  logoutUser: () => void;
  reloadPermissions: () => Promise<void>;
  isSuperAdmin: boolean;
  isFinanceDirector: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const STORAGE_ROLE_KEY = 'aroua_active_role';
const STORAGE_USER_KEY = 'aroua_active_user';

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // ignore
    }
    return {
      id: 'usr-1',
      full_name: 'أحمد بنشقرون (المشرف الأعلى)',
      email: 'admin@arouaschools.ma',
      role_code: 'super_admin',
      is_suspended: false,
      employee_name: 'الإدارة المركزية العامة',
    };
  });

  const [currentRole, setCurrentRole] = useState<SystemRoleCode>(() => {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    return (saved as SystemRoleCode) || currentUser.role_code || 'super_admin';
  });

  const [permissionsList, setPermissionsList] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (role: SystemRoleCode) => {
    setLoading(true);
    try {
      const [allRoles, rolePerms] = await Promise.all([
        securityService.getSystemRoles(),
        securityService.getRolePermissions(role),
      ]);
      setRoles(allRoles);
      setPermissionsList(rolePerms);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentRole);
  }, [currentRole]);

  // Map permissions by module key for O(1) lookup
  const permissionsMap = useMemo(() => {
    const map = new Map<string, RolePermission>();
    permissionsList.forEach(p => {
      map.set(p.permission_key, p);
    });
    return map;
  }, [permissionsList]);

  const hasPermission = (permissionKey: string, action: PermissionAction = 'can_view'): boolean => {
    // Super Admin has universal access
    if (currentRole === 'super_admin') {
      return true;
    }

    const perm = permissionsMap.get(permissionKey);
    if (!perm) return false;

    return Boolean(perm[action]);
  };

  const canAccessRoute = (routePermissionKey: string): boolean => {
    if (currentRole === 'super_admin') return true;
    return hasPermission(routePermissionKey, 'can_view');
  };

  const switchRole = async (newRole: SystemRoleCode) => {
    setCurrentRole(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
    const updatedUser: UserProfile = {
      ...currentUser,
      role_code: newRole,
      full_name: newRole === 'super_admin' ? 'أحمد بنشقرون (المشرف الأعلى)' : `مستخدم تجريبي (${newRole})`,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    await loadData(newRole);
  };

  const loginUser = async (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentRole(user.role_code);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_ROLE_KEY, user.role_code);
    await loadData(user.role_code);
  };

  const logoutUser = () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    // Set minimal viewer profile or reset
    const defaultProfile: UserProfile = {
      id: 'usr-guest',
      full_name: 'مستخدم زائر',
      email: '',
      role_code: 'viewer',
      is_suspended: false,
    };
    setCurrentUser(defaultProfile);
    setCurrentRole('viewer');
  };

  const reloadPermissions = async () => {
    await loadData(currentRole);
  };

  const isSuperAdmin = currentRole === 'super_admin';
  const isFinanceDirector = currentRole === 'finance_director';
  const isAuthenticated = Boolean(currentUser && currentUser.email);

  return (
    <PermissionsContext.Provider
      value={{
        currentUser,
        currentRole,
        roles,
        permissions: permissionsMap,
        loading,
        isAuthenticated,
        hasPermission,
        canAccessRoute,
        switchRole,
        loginUser,
        logoutUser,
        reloadPermissions,
        isSuperAdmin,
        isFinanceDirector,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export default PermissionsContext;
