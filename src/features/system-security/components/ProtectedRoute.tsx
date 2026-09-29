import React, { ReactNode } from 'react';
import { usePermissions } from '../context/PermissionsContext';
import { PermissionAction, SystemRoleCode } from '../models/security.types';
import { AccessDeniedView } from '../views/AccessDeniedView';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredAction?: PermissionAction;
  requiredRole?: SystemRoleCode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredAction = 'can_view',
  requiredRole,
}) => {
  const { loading, currentRole, hasPermission, isSuperAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-emerald-600 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-mono text-slate-400">جاري التحقق من أذونات الأمان...</span>
      </div>
    );
  }

  // Super Admin always bypasses route restrictions
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check specific required role if specified
  if (requiredRole && currentRole !== requiredRole) {
    return <AccessDeniedView requiredPermission={`ROLE_${requiredRole}`} />;
  }

  // Check required permission key
  if (requiredPermission && !hasPermission(requiredPermission, requiredAction)) {
    return <AccessDeniedView requiredPermission={`${requiredPermission}:${requiredAction}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
