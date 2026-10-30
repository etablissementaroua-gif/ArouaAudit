import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkirvdigliimfxwugaol.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key');
};

/**
 * فحص ما إذا كان الخطأ ناتجاً عن انقطاع الشبكة أو تعذر حل اسم الخادم (ERR_NAME_NOT_RESOLVED / Failed to fetch)
 */
export const isSupabaseNetworkOrDnsError = (error: any): boolean => {
  if (!error) return false;
  const msg = (error.message || error.toString() || '').toLowerCase();
  const details = (error.details || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('network') ||
    msg.includes('dns') ||
    msg.includes('fetch failed') ||
    details.includes('err_name_not_resolved') ||
    details.includes('failed to fetch')
  );
};

/**
 * إرجاع رسالة خطأ واضحة وتوجيهية للمستخدم بدلاً من الرسائل التقنية المبهمة
 */
export const getFriendlySupabaseErrorMessage = (error: any, fallbackMessage: string = 'حدث خطأ أثناء الاتصال بقاعدة البيانات'): string => {
  if (isSupabaseNetworkOrDnsError(error)) {
    return 'تعذر الاتصال بخادم قاعدة البيانات (ERR_NAME_NOT_RESOLVED). يرجى التأكد من استئناف تشغيل مشروع Supabase (Unpause) من لوحة التحكم أو التحقق من اتصال الإنترنت.';
  }
  return error?.message || fallbackMessage;
};
