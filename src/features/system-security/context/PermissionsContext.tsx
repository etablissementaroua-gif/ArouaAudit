import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  SystemRole, 
  SystemRoleCode, 
  RolePermission, 
  UserProfile, 
  PermissionAction 
} from '../models/security.types';
import { securityService } from '../services/security.service';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';

export const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'usr-mossaabel',
  full_name: 'مصعب (المدير العام والمشرف الأعلى)',
  email: 'mossaabel@arouaaudit.com',
  role_code: 'super_admin',
  is_suspended: false,
};

export const GUEST_USER_PROFILE: UserProfile = {
  id: 'usr-guest',
  full_name: 'زائر غير مسجل',
  email: '',
  role_code: 'viewer',
  is_suspended: false,
};

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
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email && parsed.id !== 'usr-guest') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return GUEST_USER_PROFILE;
  });

  const [currentRole, setCurrentRole] = useState<SystemRoleCode>(() => {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    return (saved as SystemRoleCode) || currentUser.role_code || 'viewer';
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

  // Synchronize with Supabase Auth Session
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user?.email && (!currentUser || currentUser.id === 'usr-guest')) {
          try {
            const profiles = await securityService.getUserProfiles();
            const match = profiles.find(
              (p) => p.email?.toLowerCase().trim() === session.user.email?.toLowerCase().trim()
            );
            if (match) {
              await loginUser(match);
            }
          } catch (syncErr) {
            console.warn('Error syncing profile with Supabase session:', syncErr);
          }
        }
      }).catch(err => {
        console.warn('Supabase getSession initial check error:', err);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT') {
          logoutUser();
        } else if (event === 'SIGNED_IN' && session?.user?.email) {
          try {
            const profiles = await securityService.getUserProfiles();
            const match = profiles.find(
              (p) => p.email?.toLowerCase().trim() === session.user.email?.toLowerCase().trim()
            );
            if (match) {
              await loginUser(match);
            }
          } catch (syncErr) {
            console.warn('Error syncing profile on auth change:', syncErr);
          }
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    }
  }, []);

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

    // Finance Director has guaranteed permissions for system.settings (tarifs, pricing-grid, academic years)
    if (currentRole === 'finance_director' && permissionKey === 'system.settings' && action !== 'can_delete') {
      return true;
    }

    const perm = permissionsMap.get(permissionKey);
    if (!perm) return false;

    return Boolean(perm[action]);
  };

  const canAccessRoute = (routePermissionKey: string): boolean => {
    if (currentRole === 'super_admin') return true;
    if (currentRole === 'finance_director' && (routePermissionKey === 'system.settings' || routePermissionKey === 'settings/pricing-grid')) return true;
    return hasPermission(routePermissionKey, 'can_view');
  };

  const switchRole = async (newRole: SystemRoleCode) => {
    setCurrentRole(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
    const updatedUser: UserProfile = {
      ...currentUser,
      role_code: newRole,
      full_name: newRole === 'super_admin' ? 'مصعب (المدير العام والمشرف الأعلى)' : (currentUser.id === 'usr-mossaabel' ? currentUser.full_name : `مستخدم تجريبي (${newRole})`),
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
    setCurrentUser(GUEST_USER_PROFILE);
    setCurrentRole('viewer');
  };

  const reloadPermissions = async () => {
    await loadData(currentRole);
  };

  const isSuperAdmin = currentRole === 'super_admin';
  const isFinanceDirector = currentRole === 'finance_director';
  const isAuthenticated = Boolean(
    currentUser && 
    currentUser.email && 
    currentUser.email.trim().length > 0 && 
    currentUser.id !== 'usr-guest'
  );

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
