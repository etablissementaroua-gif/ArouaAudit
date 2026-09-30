import { useState, useEffect, useCallback } from 'react';
import { securityService } from '../services/security.service';
import {
  AuditLog,
  UserProfile,
  SystemRole,
  RolePermission,
  AuditFilterOptions,
  SystemRoleCode,
  PermissionAction,
  PERMISSION_MODULES
} from '../models/security.types';

export const useSecurity = (initialFilters?: AuditFilterOptions) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filters, setFilters] = useState<AuditFilterOptions>(initialFilters || {});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logs, userList] = await Promise.all([
        securityService.getAuditLogs(filters),
        securityService.getUserProfiles()
      ]);
      setAuditLogs(logs);
      setUsers(userList);
    } catch (err) {
      console.warn('[useSecurity] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateUserRole = useCallback(async (userId: string, roleCode: string) => {
    await securityService.updateUserRole(userId, roleCode as SystemRoleCode);
    await load();
  }, [load]);

  const toggleUserSuspension = useCallback(async (userId: string, isSuspended: boolean) => {
    await securityService.toggleUserSuspension(userId, isSuspended);
    await load();
  }, [load]);

  const updatePermission = useCallback(async (
    roleCode: string,
    permKey: string,
    action: PermissionAction,
    value: boolean
  ) => {
    await securityService.updateRolePermission(roleCode as any, permKey, action, value);
    await load();
  }, [load]);

  return {
    auditLogs,
    users,
    filters,
    setFilters,
    loading,
    refresh: load,
    updateUserRole,
    toggleUserSuspension,
    updatePermission
  };
};