import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';
import { usePermissions } from '../context/PermissionsContext';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { INSTITUTION_INFO } from '../../../shared/lib/receiptPdfGenerator';

interface RequireAuthProps {
  children?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { currentUser, isAuthenticated, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyLiveSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error in RequireAuth:', error.message);
          }
          // If we have an active Supabase session or authenticated profile
        }
      } catch (err) {
        console.warn('Live session verification failed:', err);
      } finally {
        if (isMounted) {
          // Brief smoothing delay to prevent UI micro-flicker
          setCheckingSession(false);
        }
      }
    };

    verifyLiveSession();

    // Listen to real-time auth state transitions
    let authListener: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          // Immediate re-check when signed out
          setCheckingSession(false);
        }
      });
      authListener = subscription;
    }

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, []);

  // 1. Prevent Flash of Unauthenticated Content (FOUC) with Emerald Luxury Loader
  if (checkingSession || permissionsLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 select-none font-sans">
        {/* Subtle Ambient Glow */}
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Institution Logo Card */}
          <div className="w-20 h-20 bg-white rounded-3xl p-3 border border-slate-200/90 shadow-xl shadow-slate-200/60 flex items-center justify-center">
            <img
              src={INSTITUTION_INFO.logoPath}
              alt="Groupe Scolaire Aroua"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Luxury Emerald Spinner Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200/80 rounded-full shadow-xs">
            <Loader2 className="w-4 h-4 text-emerald-700 animate-spin" />
            <span className="text-xs font-black text-emerald-900 tracking-wide">
              جاري التحقق من أمان الجلسة والصلاحيات...
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">
              منظومة أروى للرقابة والتدقيق المالي (ArouaAudit)
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Vérification sécurisée de la session en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Strict Suspension Check
  if (currentUser && currentUser.is_suspended) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location, 
          suspended: true,
          reason: 'account_suspended'
        }} 
        replace 
      />
    );
  }

  // 3. Strict Unauthenticated Check
  if (!isAuthenticated || !currentUser || !currentUser.email) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 4. Authorized Access Granted
  return children ? <>{children}</> : <Outlet />;
};

export default RequireAuth;
