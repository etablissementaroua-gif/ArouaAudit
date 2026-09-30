import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { 
  SystemTask, 
  SystemNotification, 
  TaskFilter, 
  CreateTaskDTO,
  TaskStatus
} from '../models/task.types';

const TASKS_STORAGE_KEY = 'aroua_system_tasks';
const NOTIFICATIONS_STORAGE_KEY = 'aroua_system_notifications';

// Initial realistic institutional tasks for ArouaAudit
const initialSampleTasks: SystemTask[] = [
  {
    id: 'tsk-001',
    title: 'مطابقة رصيد الصندوق المركزي مع سجل المقبوضات اليومية',
    description: 'إجراء الجرد الميداني للصندوق المادي ومطابقته مع إجمالي المقبوضات المحصلة من وكلاء المداخيل لشهر سبتمبر.',
    category: 'task',
    priority: 'urgent',
    status: 'in_progress',
    visibility: 'assigned',
    creator_id: 'usr-1',
    creator_name: 'أحمد بنشقرون (المشرف الأعلى)',
    assigned_to: 'emp-uuid-1',
    assigned_to_name: 'محمد العلمي (أمين الصندوق)',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'tsk-002',
    title: 'إعداد حافظة تسليم الشيكات المؤجلة للبنك الشعبي (BP)',
    description: 'تجهيز جدول الشيكات المستحقة في بداية شهر أكتوبر وطباعة إشعار التسليم المالي والتوقيع عليه.',
    category: 'task',
    priority: 'high',
    status: 'pending',
    visibility: 'assigned',
    creator_id: 'usr-1',
    creator_name: 'أحمد بنشقرون (المشرف الأعلى)',
    assigned_to: 'emp-uuid-2',
    assigned_to_name: 'فاطمة الزهراء الإدريسي (المحاسبة)',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'tsk-003',
    title: 'ملاحظة خاصة: مراجعة كشوفات استهلاك وقود حافلات النقل المدرسي',
    description: 'مقارنة فواتير محطة الوقود مع الكيلومترات المسجلة في سجل حركة السائقين للتحقق من عدم وجود تجاوزات.',
    category: 'task',
    priority: 'medium',
    status: 'pending',
    visibility: 'private',
    creator_id: 'usr-1',
    creator_name: 'أحمد بنشقرون (المشرف الأعلى)',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'tsk-004',
    title: 'إعلان عام: موعد الاجتماع الشهري للتدقيق الإداري والمالي',
    description: 'يرجى من كافة رؤساء الأقسام وأمناء الصناديق تجهيز تقارير الموازنة لشهر شتنبر لحضور الاجتماع الدوري التقييمي.',
    category: 'announcement',
    priority: 'high',
    status: 'in_progress',
    visibility: 'public',
    creator_id: 'usr-1',
    creator_name: 'الإدارة العامة',
    due_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString()
  },
  {
    id: 'tsk-005',
    title: 'فكرة: اعتماد إشعارات واتساب التلقائية لتنبيه أولياء الأمور بالمتأخرات',
    description: 'ربط نظام المستحقات غير المؤداة (Impayés) بواجهة برمجة لتوليد رسائل تذكير لطيفة قبل نهاية كل شهر.',
    category: 'idea',
    priority: 'low',
    status: 'pending',
    visibility: 'public',
    creator_id: 'usr-1',
    creator_name: 'أحمد بنشقرون (المشرف الأعلى)',
    due_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    is_completed: false,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'tsk-006',
    title: 'تسوية الديون السابقة العالقة لأساتذة التعليم الابتدائي',
    description: 'تمت مراجعة وتسوية اقتطاعات الشطر الأول من المستحقات العالقة في مسير الرواتب.',
    category: 'task',
    priority: 'medium',
    status: 'completed',
    visibility: 'public',
    creator_id: 'usr-1',
    creator_name: 'مصلحة الموارد البشرية',
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    is_completed: true,
    completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

const initialSampleNotifications: SystemNotification[] = [
  {
    id: 'notif-001',
    title: 'مهمة مسندة جديدة',
    message: 'تم إسناد مهمة "مطابقة رصيد الصندوق المركزي" إليك بأولوية عاجلة.',
    type: 'task_assigned',
    link_url: '/workspace/tasks',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-002',
    title: 'إعلان إداري عام',
    message: 'الاجتماع الشهري للتدقيق الإداري والمالي لمجموعة مدارس أروى.',
    type: 'announcement',
    link_url: '/workspace/tasks',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'notif-003',
    title: 'تذكير بالاستحقاق المالي',
    message: 'موعد إيداع حوافظ الشيكات بالبنك الشعبي اقترب (المتبقي: يومان).',
    type: 'reminder',
    link_url: '/workspace/tasks',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

export const taskService = {
  // Helper to get local tasks
  getLocalTasks(): SystemTask[] {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading tasks from localStorage', e);
    }
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(initialSampleTasks));
    return initialSampleTasks;
  },

  // Helper to save local tasks
  saveLocalTasks(tasks: SystemTask[]): void {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new CustomEvent('aroua_tasks_updated'));
    } catch (e) {
      console.error('Error saving tasks to localStorage', e);
    }
  },

  // Helper to get local notifications
  getLocalNotifications(): SystemNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading notifications from localStorage', e);
    }
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialSampleNotifications));
    return initialSampleNotifications;
  },

  // Helper to save local notifications
  saveLocalNotifications(notifs: SystemNotification[]): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
      window.dispatchEvent(new CustomEvent('aroua_notifications_updated'));
    } catch (e) {
      console.error('Error saving notifications to localStorage', e);
    }
  },

  // 1. Fetch Tasks with Filters
  async getTasks(
    filter?: TaskFilter, 
    currentUserId: string = 'usr-1',
    currentUserName: string = 'أحمد بنشقرون'
  ): Promise<SystemTask[]> {
    let tasks: SystemTask[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          tasks = data as SystemTask[];
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage', err);
      }
    }

    if (tasks.length === 0) {
      tasks = this.getLocalTasks();
    }

    // Apply filtering
    return tasks.filter((t) => {
      // Tab filter
      if (filter?.tab === 'private') {
        if (t.visibility !== 'private') return false;
      } else if (filter?.tab === 'assigned_to_me') {
        if (t.visibility !== 'assigned') return false;
      } else if (filter?.tab === 'public') {
        if (t.visibility !== 'public' && t.category !== 'announcement' && t.category !== 'reminder') return false;
      } else if (filter?.tab === 'ideas') {
        if (t.category !== 'idea') return false;
      }

      // Category filter
      if (filter?.category && filter.category !== 'all') {
        if (t.category !== filter.category) return false;
      }

      // Priority filter
      if (filter?.priority && filter.priority !== 'all') {
        if (t.priority !== filter.priority) return false;
      }

      // Status filter
      if (filter?.status && filter.status !== 'all') {
        if (t.status !== filter.status) return false;
      }

      // Search term
      if (filter?.searchTerm && filter.searchTerm.trim() !== '') {
        const term = filter.searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(term);
        const matchesDesc = t.description?.toLowerCase().includes(term);
        const matchesAssignee = t.assigned_to_name?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      return true;
    });
  },

  // 2. Create Task
  async createTask(
    dto: CreateTaskDTO,
    currentUser: { id: string; full_name: string; role_code?: string }
  ): Promise<SystemTask> {
    const newTask: SystemTask = {
      id: 'tsk-' + Date.now(),
      title: dto.title.trim(),
      description: dto.description?.trim(),
      category: dto.category,
      priority: dto.priority,
      status: 'pending',
      visibility: dto.visibility,
      creator_id: currentUser.id,
      creator_name: currentUser.full_name,
      assigned_to: dto.assigned_to,
      assigned_to_name: dto.assigned_to_name,
      due_date: dto.due_date,
      is_completed: false,
      created_at: new Date().toISOString()
    };

    // Attempt Supabase insert
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_tasks')
          .insert([newTask])
          .select()
          .single();
        if (!error && data) {
          newTask.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase task insert failed, stored locally', err);
      }
    }

    // Save to LocalStorage
    const localTasks = this.getLocalTasks();
    const updated = [newTask, ...localTasks];
    this.saveLocalTasks(updated);

    // Generate immediate Notification
    if (dto.visibility === 'assigned' && dto.assigned_to_name) {
      this.createNotification({
        title: 'مهمة جديدة مسندة إليك',
        message: `قام ${currentUser.full_name} بإسناد مهمة: "${dto.title}". الأولوية: ${dto.priority}`,
        type: 'task_assigned',
        link_url: '/workspace/tasks'
      });
    } else if (dto.visibility === 'public') {
      this.createNotification({
        title: dto.category === 'idea' ? 'فكرة مقترحة جديدة' : 'إعلان / تذكير مؤسسي عام',
        message: `${currentUser.full_name}: ${dto.title}`,
        type: dto.category === 'announcement' ? 'announcement' : 'reminder',
        link_url: '/workspace/tasks'
      });
    }

    return newTask;
  },

  // 3. Toggle Completion
  async toggleTaskCompletion(id: string, isCompleted: boolean): Promise<SystemTask | null> {
    const localTasks = this.getLocalTasks();
    const index = localTasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const task = localTasks[index];
    const updatedTask: SystemTask = {
      ...task,
      is_completed: isCompleted,
      status: isCompleted ? 'completed' : 'pending',
      completed_at: isCompleted ? new Date().toISOString() : undefined
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('system_tasks')
          .update({
            is_completed: isCompleted,
            status: updatedTask.status,
            completed_at: updatedTask.completed_at
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed', err);
      }
    }

    localTasks[index] = updatedTask;
    this.saveLocalTasks(localTasks);

    if (isCompleted) {
      this.createNotification({
        title: 'تم إنجاز المهمة بنجاح',
        message: `تم إتمام المهمة: "${updatedTask.title}".`,
        type: 'task_completed',
        link_url: '/workspace/tasks'
      });
    }

    return updatedTask;
  },

  // 4. Update Status
  async updateTaskStatus(id: string, status: TaskStatus): Promise<SystemTask | null> {
    const isCompleted = status === 'completed';
    return this.toggleTaskCompletion(id, isCompleted);
  },

  // 5. Delete Task
  async deleteTask(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('system_tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed', err);
      }
    }

    const localTasks = this.getLocalTasks();
    const updated = localTasks.filter((t) => t.id !== id);
    this.saveLocalTasks(updated);
    return true;
  },

  // 6. Notifications: Fetch
  async getNotifications(currentUserId?: string): Promise<SystemNotification[]> {
    let notifs: SystemNotification[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('system_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          notifs = data as SystemNotification[];
        }
      } catch (err) {
        console.warn('Supabase notifications fetch failed', err);
      }
    }

    if (notifs.length === 0) {
      notifs = this.getLocalNotifications();
    }

    return notifs;
  },

  // 7. Notifications: Create
  createNotification(data: {
    title: string;
    message: string;
    type: 'task_assigned' | 'task_completed' | 'reminder' | 'system' | 'announcement';
    link_url?: string;
  }): SystemNotification {
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: data.title,
      message: data.message,
      type: data.type,
      link_url: data.link_url || '/workspace/tasks',
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        supabase.from('system_notifications').insert([newNotif]).then();
      } catch {
        // silent
      }
    }

    const localNotifs = this.getLocalNotifications();
    const updated = [newNotif, ...localNotifs].slice(0, 30);
    this.saveLocalNotifications(updated);
    return newNotif;
  },

  // 8. Notifications: Mark single as read
  async markNotificationAsRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .eq('id', id);
      } catch {
        // silent
      }
    }

    const localNotifs = this.getLocalNotifications();
    const index = localNotifs.findIndex((n) => n.id === id);
    if (index !== -1) {
      localNotifs[index].is_read = true;
      this.saveLocalNotifications(localNotifs);
    }
    return true;
  },

  // 9. Notifications: Mark all as read
  async markAllNotificationsAsRead(currentUserId?: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('system_notifications')
          .update({ is_read: true })
          .eq('is_read', false);
      } catch {
        // silent
      }
    }

    const localNotifs = this.getLocalNotifications();
    const updated = localNotifs.map((n) => ({ ...n, is_read: true }));
    this.saveLocalNotifications(updated);
    return true;
  }
};
