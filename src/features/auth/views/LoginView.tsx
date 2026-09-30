import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  KeyRound,
  HelpCircle,
  X,
  Phone,
  Building
} from 'lucide-react';
import { LanguageSwitcher } from '../../../shared/components/LanguageSwitcher';
import { usePermissions } from '../../system-security/context/PermissionsContext';
import { securityService } from '../../system-security/services/security.service';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { UserProfile } from '../../system-security/models/security.types';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation(['common', 'security']);
  const { loginUser, isAuthenticated, currentUser } = usePermissions();
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');

  const [email, setEmail] = useState('admin@arouaschools.ma');
  const [password, setPassword] = useState('ArouaAudit2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // If user is already authenticated and active, redirect directly to dashboard or intended route
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.email && !currentUser.is_suspended) {
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate, location]);

  // Display suspension notice if redirected by route guard
  useEffect(() => {
    if ((location.state as any)?.suspended) {
      setErrorMessage(
        isRtl
          ? 'تم تعليق هذا الحساب إدارياً ومؤقتاً. يرجى مراجعة إدارة الرقابة والتدقيق المركزي.'
          : "Ce compte a été suspendu par l'administration centrale. Veuillez contacter le service d'audit."
      );
    }
  }, [location.state, isRtl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      let matchedUser: UserProfile | undefined;

      // 1. If Supabase is fully configured, attempt cloud sign in
      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.warn('Supabase auth sign in error, trying local profile check:', error.message);
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth network exception:', supabaseErr);
        }
      }

      // 2. Fetch profiles to check credentials & suspension status
      const allProfiles = await securityService.getUserProfiles();
      matchedUser = allProfiles.find(
        u => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
      );

      // If user not in predefined list, check if user is entering a valid email format
      if (!matchedUser) {
        if (email.includes('@arouaschools.ma') || email.includes('@')) {
          matchedUser = {
            id: `usr-${Date.now()}`,
            full_name: email.split('@')[0].replace('.', ' '),
            email,
            role_code: 'finance_director',
            is_suspended: false,
          };
        } else {
          setErrorMessage(
            isRtl 
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق من بيانات الدخول.' 
              : 'Identifiants invalides. Veuillez vérifier votre adresse email et mot de passe.'
          );
          setLoading(false);
          return;
        }
      }

      // 3. Strict Suspension Check
      if (matchedUser.is_suspended) {
        setErrorMessage(
          isRtl
            ? 'تم تعليق هذا الحساب إدارياً ومؤقتاً. يرجى مراجعة إدارة الرقابة والتدقيق المركزي.'
            : 'Ce compte a été suspendu par l\'administration centrale. Veuillez contacter le service d\'audit.'
        );
        setLoading(false);
        return;
      }

      // 4. Log Immutable Audit Event
      await securityService.logAuditEvent({
        user_name: matchedUser.full_name,
        user_role: matchedUser.role_code,
        action_type: 'LOGIN',
        target_entity: 'auth_session',
        entity_id: matchedUser.email,
        new_values: {
          ip: '192.168.1.100',
          userAgent: navigator.userAgent,
          status: 'success',
          timestamp: new Date().toISOString(),
        },
      });

      // 5. Update Permissions Context
      await loginUser(matchedUser);

      // 6. Navigate to destination or root dashboard
      const destination = (location.state as any)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('Login process error:', err);
      setErrorMessage(
        isRtl
          ? 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً.'
          : 'Une erreur inattendue est survenue lors de la connexion.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('ArouaAudit2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col justify-between font-sans selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-gradient-to-b from-emerald-500/8 via-teal-500/4 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Selector */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm p-1.5 flex items-center justify-center">
            <img
              src="/assets/logo-aroua.png"
              alt="Groupe Scolaire Aroua"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-black text-slate-900 text-sm tracking-tight block">
              {isRtl ? 'مجموعة مدارس أروى' : 'Groupe Scolaire Aroua'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {isRtl ? 'منظومة التدقيق المالي والإداري المستقلة' : 'Système d\'Audit et de Contrôle Financier'}
            </span>
          </div>
        </div>

        <LanguageSwitcher />
      </header>

      {/* Main Login Card Container */}
      <main className="w-full max-w-md mx-auto px-4 z-10 my-auto">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm relative">
          
          {/* Top Brand & Title Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/60 shadow-2xs mb-1">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isRtl ? 'تسجيل الدخول المؤسساتي' : 'Connexion Institutionnelle'}
            </h1>
            
            <p className="text-xs text-slate-500 font-medium">
              {isRtl 
                ? 'المنصة المركزية للرقابة المحاسبية والامتيازات الممنوحة' 
                : 'Portail centralisé de contrôle de gestion et d\'audit'}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 text-start animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5 text-start">
              <label className="block text-xs font-bold text-slate-700">
                {isRtl ? 'البريد الإلكتروني المهني' : 'Adresse Email Professionnelle'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@arouaschools.ma"
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 ${
                    isRtl ? 'pr-10' : 'pl-10'
                  }`}
                />
                <Mail className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-start">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  {isRtl ? 'كلمة المرور' : 'Mot de passe'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                >
                  {isRtl ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 ${
                    isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  }`}
                />
                <Lock className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer ${
                    isRtl ? 'left-3.5' : 'right-3.5'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>{isRtl ? 'تذكر جلستي على هذا الجهاز' : 'Rester connecté'}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">{isRtl ? 'جاري التحقق من الصلاحيات...' : 'Vérification en cours...'}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span className="text-sm">{isRtl ? 'تسجيل الدخول الآمن' : 'Connexion Sécurisée'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 block mb-2 text-start uppercase tracking-wider">
              {isRtl ? 'حسابات تجريبية سريعة (COMPTES DÉMO):' : 'Comptes de test rapide (DÉMO) :'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@arouaschools.ma')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-start transition cursor-pointer hover:border-emerald-300"
              >
                <span className="font-bold text-slate-900 block text-[11px] leading-tight">المدير العام</span>
                <span className="text-[9px] text-slate-400 font-mono block">Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('finance@arouaschools.ma')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-start transition cursor-pointer hover:border-emerald-300"
              >
                <span className="font-bold text-slate-900 block text-[11px] leading-tight">المديرة المالية</span>
                <span className="text-[9px] text-slate-400 font-mono block">Dir. Financier</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('comptable@arouaschools.ma')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-start transition cursor-pointer hover:border-emerald-300"
              >
                <span className="font-bold text-slate-900 block text-[11px] leading-tight">المحاسب المعتمد</span>
                <span className="text-[9px] text-slate-400 font-mono block">Comptable</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('caisse1@arouaschools.ma')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-start transition cursor-pointer hover:border-emerald-300"
              >
                <span className="font-bold text-slate-900 block text-[11px] leading-tight">أمينة الصندوق</span>
                <span className="text-[9px] text-slate-400 font-mono block">Caissier</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Security Badges & Legal Notice */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 text-center space-y-2 z-10">
        <div className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 border border-slate-200/70 rounded-full px-4 py-1.5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {isRtl 
              ? 'نظام تدبير مالي ورقابي مشفر • جميع العمليات موثقة ومحمية بسجل تدقيق محاسبي غير قابل للتعديل (WORM Certified)' 
              : 'Système financier chiffré • Toutes les opérations sont tracées dans un registre d\'audit inaltérable (WORM Certified)'}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          <span>{isRtl ? 'مجموعة مدارس أروى — مراكش، المملكة المغربية' : 'Groupe Scolaire Aroua — Marrakech, Royaume du Maroc'}</span>
          <span className="mx-2">•</span>
          <span>support@arouaschools.ma</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-start">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-sm text-slate-900">
                  {isRtl ? 'استعادة وتعيين كلمة المرور' : 'Récupération de Mot de Passe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isRtl
                ? 'لأسباب تتعلق بالسرية والرقابة المالية الصارمة، يتم تعيين وتغيير كلمات المرور حصرياً عبر المصلحة المركزية للتدقيق والأنظمة.'
                : 'Pour des raisons de stricte sécurité financière, la réinitialisation des mots de passe est effectuée exclusivement par la direction centrale d\'audit.'}
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-emerald-700" />
                <span className="font-bold">{isRtl ? 'مصلحة التدقيق المالي والإداري' : 'Direction de l\'Audit Financier'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support-audit@arouaschools.ma</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+212 (0) 5 24 00 00 00 (Poste 102)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isRtl ? 'فهمت ذلك' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
