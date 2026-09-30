import { useState, useEffect, useCallback } from 'react';
import { enrollmentService } from '../../student-enrollment/services/enrollmentService';
import { checksManagementService } from '../../checks-management/services/checksManagement.service';
import { taskService } from '../../tasks-notes/services/task.service';
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { CheckItem } from '../../checks-management/models/check.types';
import { SystemTask } from '../../tasks-notes/models/task.types';

export interface DashboardBillingStats {
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
  studentsCount: number;
}

export interface DashboardState {
  loading: boolean;
  billingStats: DashboardBillingStats;
  checksList: CheckItem[];
  criticalTasks: SystemTask[];
  refresh: () => void;
}

export const useDashboard = (): DashboardState => {
  const [loading, setLoading] = useState(true);
  const [billingStats, setBillingStats] = useState<DashboardBillingStats>({
    totalDue: 0,
    totalPaid: 0,
    totalBalance: 0,
    studentsCount: 0
  });
  const [checksList, setChecksList] = useState<CheckItem[]>([]);
  const [criticalTasks, setCriticalTasks] = useState<SystemTask[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [students, checks, tasks] = await Promise.all([
        enrollmentService.getStudents(),
        checksManagementService.getChecksList(),
        taskService.getTasks({})
      ]);

      const totalDue = students.reduce((s, st) => s + (Number((st as any).total_due) || 0), 0);
      const totalPaid = students.reduce((s, st) => s + (Number((st as any).total_paid) || 0), 0);

      setBillingStats({
        totalDue,
        totalPaid,
        totalBalance: totalDue - totalPaid,
        studentsCount: students.length
      });

      // شيكات قيد الحافظة والمستحقة للإيداع فقط
      setChecksList(checks.filter(c => c.status === 'en_portefeuille' || c.status === 'a_deposer'));

      // المهام الحرجة والعاجلة (5 كحد أقصى للوحة القيادة)
      setCriticalTasks(
        tasks
          .filter(t => !t.is_completed && (t.priority === 'urgent' || t.priority === 'high'))
          .slice(0, 5)
      );
    } catch (err) {
      console.warn('[useDashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // مزامنة لحظية مع Supabase Realtime
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('dashboard-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'caisse_transactions' }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'checks_portfolio' }, load)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_fee_records' }, load)
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [load]);

  return { loading, billingStats, checksList, criticalTasks, refresh: load };
};