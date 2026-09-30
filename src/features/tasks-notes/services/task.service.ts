// ArouaAudit — Tasks & Notes Service (Production Clean — Zero Mock Data)
import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import {
  SystemTask, SystemNotification, CreateTaskDTO, TaskFilter,
  TaskPriority, TaskStatus, TaskCategory, TaskVisibility
} from '../models/task.types';
export type { TaskPriority, TaskStatus, TaskCategory, TaskVisibility };

// ── Tasks ─────────────────────────────────────────────────────────────────
export const taskService = {
  async getTasks(
    filter?: TaskFilter,
    userId?: string,
    _userName?: string
  ): Promise<SystemTask[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      let query = supabase
        .from('system_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.priority && filter.priority !== 'all') {
        query = query.eq('priority', filter.priority);
      }
      if (filter?.category && filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }
      if (filter?.tab === 'private' && userId) {
        query = query.eq('creator_id', userId).eq('visibility', 'private');
      } else if (filter?.tab === 'assigned_to_me' && userId) {
        query = query.eq('assigned_to', userId);
      } else if (filter?.tab === 'public') {
        query = query.eq('visibility', 'public');
      }

      const { data, error } = await query;
      if (error) { console.warn('[taskService] getTasks:', error.message); return []; }
      return (data as SystemTask[]) ?? [];
    } catch { return []; }
  },

  async createTask(dto: CreateTaskDTO, creator: { id: string; full_name: string }): Promise<SystemTask | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const newTask = {
        ...dto,
        creator_id: creator.id,
        creator_name: creator.full_name,
        status: 'pending' as TaskStatus,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('system_tasks')
        .insert([newTask])
        .select().single();
      if (error || !data) { console.warn('[taskService] createTask:', error?.message); return null; }
      return data as SystemTask;
    } catch { return null; }
  },

  async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const updates: any = {
        is_completed: isCompleted,
        status: isCompleted ? 'completed' : 'pending',
        updated_at: new Date().toISOString(),
      };
      if (isCompleted) updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('system_tasks').update(updates).eq('id', taskId);
      return !error;
    } catch { return false; }
  },

  async deleteTask(taskId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('system_tasks').delete().eq('id', taskId);
      return !error;
    } catch { return false; }
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(userId: string): Promise<SystemNotification[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error || !data) return [];
      return data as SystemNotification[];
    } catch { return []; }
  },

  async markNotificationAsRead(notifId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notifId);
    } catch { /* silent */ }
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
    } catch { /* silent */ }
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  async getTasksStats(): Promise<{
    pending: number; inProgress: number; done: number; urgent: number;
  }> {
    const tasks = await this.getTasks();
    return {
      pending:    tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done:       tasks.filter(t => t.is_completed).length,
      urgent:     tasks.filter(t => t.priority === 'urgent' && !t.is_completed).length,
    };
  }
};
