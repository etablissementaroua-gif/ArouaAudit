import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { securityService } from '../../system-security/services/security.service';

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  loading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthState => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async ({ email, password, rememberMe }: AuthCredentials) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('قاعدة البيانات غير متصلة. تأكد من إعداد Supabase.');
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      try {
        await securityService.logAuditEvent({
          user_name: email,
          user_role: 'authenticated',
          action_type: 'LOGIN',
          target_entity: 'auth',
          entity_id: data.user?.id,
          new_values: { rememberMe, timestamp: new Date().toISOString() }
        });
      } catch (auditErr) {
        console.warn('[useAuth] Audit log error (non-blocking):', auditErr);
      }
      navigate('/');
    } catch (err: any) {
      const isInvalid = err?.message?.includes('Invalid login') || err?.message?.includes('credentials');
      setError(isInvalid
        ? 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.'
        : (err?.message || 'حدث خطأ غير متوقع. يرجى إعادة المحاولة.')
      );
      try {
        await securityService.logAuditEvent({
          user_name: email,
          user_role: 'unauthenticated',
          action_type: 'LOGIN',
          target_entity: 'auth',
          new_values: { error: err?.message }
        });
      } catch (_) { /* silent */ }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.auth.signOut();
      await securityService.logAuditEvent({
        user_name: user?.email || 'unknown',
        user_role: 'authenticated',
        action_type: 'LOGOUT',
        target_entity: 'auth',
        entity_id: user?.id
      });
    } catch (err) {
      console.warn('[useAuth] Logout error:', err);
    } finally {
      navigate('/login');
    }
  }, [navigate]);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, login, logout, clearError };
};
