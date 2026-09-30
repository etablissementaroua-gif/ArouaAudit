import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task.service';
import { SystemTask, SystemNotification, TaskFilter, CreateTaskDTO, TaskStatus } from '../models/task.types';

export const useTasks = (initialFilter?: TaskFilter) => {
  const [tasks, setTasks] = useState<SystemTask[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter || {});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, notifData] = await Promise.all([
        taskService.getTasks(filter),
        taskService.getNotifications('')
      ]);
      setTasks(taskData);
      setNotifications(notifData);
    } catch (err) {
      console.warn('[useTasks] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const createTask = useCallback(async (dto: CreateTaskDTO, user: { id: string; full_name: string }) => {
    await taskService.createTask(dto, user);
    await load();
  }, [load]);

  const updateStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    await taskService.toggleTaskCompletion(taskId, status === 'completed');
    await load();
  }, [load]);

  const deleteTask = useCallback(async (taskId: string) => {
    await taskService.deleteTask(taskId);
    await load();
  }, [load]);

  const markNotificationRead = useCallback(async (notifId: string) => {
    await taskService.markNotificationAsRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    tasks,
    notifications,
    unreadCount,
    filter,
    setFilter,
    loading,
    refresh: load,
    createTask,
    updateStatus,
    deleteTask,
    markNotificationRead
  };
};