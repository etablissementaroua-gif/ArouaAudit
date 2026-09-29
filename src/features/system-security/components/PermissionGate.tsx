import React, { ReactNode } from 'react';
import { usePermissions } from '../context/PermissionsContext';
import { PermissionAction } from '../models/security.types';

interface PermissionGateProps {
  permission: string;
  action?: PermissionAction;
  fallback?: 'hide' | 'disable';
  tooltipText?: string;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  action = 'can_view',
  fallback = 'hide',
  tooltipText = 'غير مصرح لك بتنفيذ هذه العملية • Opération non autorisée',
  children,
}) => {
  const { hasPermission, isSuperAdmin } = usePermissions();

  const allowed = isSuperAdmin || hasPermission(permission, action);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback === 'hide') {
    return null;
  }

  // Fallback = disable
  return (
    <div className="relative inline-flex group" title={tooltipText}>
      <div className="opacity-50 cursor-not-allowed select-none pointer-events-none">
        {children}
      </div>
      <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg shadow-lg whitespace-nowrap z-50">
        {tooltipText}
      </div>
    </div>
  );
};

export default PermissionGate;
