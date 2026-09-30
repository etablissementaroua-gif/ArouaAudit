export type TaskCategory = 'task' | 'idea' | 'reminder' | 'announcement';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskVisibility = 'private' | 'assigned' | 'public';

export interface SystemTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  visibility: TaskVisibility;
  creator_id: string;
  creator_name: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export type NotificationType = 'task_assigned' | 'task_completed' | 'reminder' | 'system' | 'announcement';

export interface SystemNotification {
  id: string;
  user_id?: string; // null for broadcast / public notices
  title: string;
  message: string;
  type: NotificationType;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface TaskFilter {
  tab?: 'all' | 'private' | 'assigned_to_me' | 'public' | 'ideas';
  category?: TaskCategory | 'all';
  priority?: TaskPriority | 'all';
  status?: TaskStatus | 'all';
  searchTerm?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  visibility: TaskVisibility;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
}
