import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { usePermissions } from '../context/PermissionsContext';

interface AccessDeniedViewProps {
  requiredPermission?: string;
  customMessage?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ 
  requiredPermission,
  customMessage 
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common', 'sidebar']);
  const { currentRole, switchRole } = usePermissions();
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center space-y-6">
        {/* Shield Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            <span>{isRtl ? 'صلاحيات غير كافية • 403 Forbidden' : 'Droits Insuffisants • 403 Forbidden'}</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isRtl ? 'غير مصرح لك بالوصول إلى هذه الشاشة' : 'Accès Refusé à cette Section'}
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            {customMessage || (isRtl 
              ? `دورك الحالي [${currentRole}] لا يمتلك الصلاحية المطلوبة [${requiredPermission || 'ACCESS_DENIED'}] لتنفيذ هذه العملية أو معاينة البيانات.`
              : `Votre rôle actuel [${currentRole}] ne dispose pas des privilèges nécessaires [${requiredPermission || 'ACCESS_DENIED'}] pour accéder à ces données.`)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{isRtl ? 'الرجوع للخلف' : 'Retour'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/enrolled-students')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isRtl ? 'الرئيسية' : 'Accueil'}</span>
          </button>
        </div>

        {/* Quick Switcher for Testing */}
        {currentRole !== 'super_admin' && (
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            <span>{isRtl ? 'لأغراض الاختبار والتطوير: ' : 'Mode test : '}</span>
            <button
              type="button"
              onClick={() => switchRole('super_admin')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              {isRtl ? 'العودة لصلاحية المدير العام' : 'Repasser en Super Admin'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessDeniedView;
