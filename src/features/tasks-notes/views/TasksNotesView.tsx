import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare,
  Lightbulb,
  Bell,
  Megaphone,
  Plus,
  Search,
  Calendar,
  User,
  Users,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { SystemTask, TaskCategory, TaskPriority, TaskStatus, TaskVisibility, CreateTaskDTO } from '../models/task.types';
import { taskService } from '../services/task.service';
import { payrollService } from '../../payroll-hr/services/payroll.service';
import { Employee } from '../../payroll-hr/models/payroll.types';
import { usePermissions } from '../../system-security/context/PermissionsContext';

export const TasksNotesView: React.FC = () => {
  const { i18n } = useTranslation(['common']);
  const isRtl = i18n.language === 'ar' || !i18n.language?.startsWith('fr');
  const { currentUser } = usePermissions();

  const [tasks, setTasks] = useState<SystemTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'assigned_to_me' | 'public' | 'ideas'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('task');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newVisibility, setNewVisibility] = useState<TaskVisibility>('assigned');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedEmployees] = await Promise.all([
        taskService.getTasks(undefined, currentUser.id, currentUser.full_name),
        payrollService.getEmployees()
      ]);
      setTasks(fetchedTasks);
      setEmployees(fetchedEmployees);
      if (fetchedEmployees.length > 0 && !newAssignedTo) {
        setNewAssignedTo(fetchedEmployees[0].id);
      }
    } catch (err) {
      console.error('Error loading tasks or employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      taskService.getTasks(undefined, currentUser.id, currentUser.full_name).then(setTasks);
    };
    window.addEventListener('aroua_tasks_updated', handleUpdate);
    return () => window.removeEventListener('aroua_tasks_updated', handleUpdate);
  }, [currentUser]);

  // Handle task completion toggle
  const handleToggleCompletion = async (task: SystemTask) => {
    const nextState = !task.is_completed;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              is_completed: nextState,
              status: nextState ? 'completed' : 'pending',
              completed_at: nextState ? new Date().toISOString() : undefined
            }
          : t
      )
    );
    await taskService.toggleTaskCompletion(task.id, nextState);
  };

  // Handle delete task
  const handleDeleteTask = async (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه المهمة نهائياً؟' : 'Supprimer définitivement cette tâche ?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await taskService.deleteTask(id);
    }
  };

  // Handle create task submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      const selectedEmp = employees.find((emp) => emp.id === newAssignedTo);
      const dto: CreateTaskDTO = {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
        priority: newPriority,
        visibility: newVisibility,
        assigned_to: newVisibility === 'assigned' ? newAssignedTo : undefined,
        assigned_to_name: newVisibility === 'assigned' && selectedEmp ? `${selectedEmp.full_name} (${selectedEmp.role})` : undefined,
        due_date: newDueDate || undefined
      };

      await taskService.createTask(dto, currentUser);
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewCategory('task');
      setNewPriority('medium');
      setNewVisibility('assigned');
      setNewDueDate('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (activeTab === 'private') {
        if (t.visibility !== 'private') return false;
      } else if (activeTab === 'assigned_to_me') {
        if (t.visibility !== 'assigned') return false;
      } else if (activeTab === 'public') {
        if (t.visibility !== 'public' && t.category !== 'announcement' && t.category !== 'reminder') return false;
      } else if (activeTab === 'ideas') {
        if (t.category !== 'idea') return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Status filter
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesAssignee = t.assigned_to_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }

      return true;
    });
  }, [tasks, activeTab, selectedPriority, selectedStatus, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_completed).length;
    const pending = tasks.filter((t) => !t.is_completed).length;
    const urgent = tasks.filter((t) => t.priority === 'urgent' && !t.is_completed).length;
    const ideas = tasks.filter((t) => t.category === 'idea').length;
    return { total, completed, pending, urgent, ideas };
  }, [tasks]);

  const isOverdue = (dueDate?: string, isCompleted?: boolean) => {
    if (!dueDate || isCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  return (
    <div className="page-container space-y-6">
      {/* 1. Header Card (Pure Stitch Design) */}
      <div className="page-header-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isRtl ? 'مذكرة المهام والتذكيرات والإشعارات' : 'Mémos, Tâches & Notifications Collaboratives'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {isRtl 
                ? 'إدارة المذكرات اليومية، تفويض المهام للأطر والموظفين، ونظام الإشعارات المشترك لمجموعة مدارس أروى'
                : 'Gestion des mémos, délégation des tâches au personnel et notifications d’équipe'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'تسجيل مهمة أو فكرة جديدة' : 'Nouvelle Tâche ou Idée'}</span>
        </button>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Tasks */}
        <div className="standard-kpi-card relative overflow-hidden group">
          <div className="w-1.5 h-full absolute top-0 start-0 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isRtl ? 'المهام قيد الإنجاز' : 'Tâches en Cours'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="kpi-number text-slate-900">{stats.pending}</span>
            <span className="text-xs font-semibold text-slate-400">/ {stats.total}</span>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 mt-1 block">
            {stats.completed} {isRtl ? 'مهمة تم إنجازها' : 'tâches terminées'}
          </span>
        </div>

        {/* KPI 2: Assigned Tasks */}
        <div className="standard-kpi-card relative overflow-hidden group">
          <div className="w-1.5 h-full absolute top-0 start-0 bg-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isRtl ? 'المهام المسندة للأطر' : 'Tâches Déléguées'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="kpi-number text-slate-900">
              {tasks.filter((t) => t.visibility === 'assigned').length}
            </span>
          </div>
          <span className="text-[11px] font-medium text-teal-700 mt-1 block">
            {isRtl ? 'موزعة على موظفي المؤسسة' : 'Assignées au personnel'}
          </span>
        </div>

        {/* KPI 3: Urgent Tasks */}
        <div className="standard-kpi-card relative overflow-hidden group">
          <div className="w-1.5 h-full absolute top-0 start-0 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isRtl ? 'المهام المستعجلة' : 'Priorité Urgente'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="kpi-number text-rose-600">{stats.urgent}</span>
          </div>
          <span className="text-[11px] font-medium text-rose-700 mt-1 block">
            {isRtl ? 'تتطلب تدخلاً فورياً' : 'Exige une action immédiate'}
          </span>
        </div>

        {/* KPI 4: Ideas & Innovations */}
        <div className="standard-kpi-card relative overflow-hidden group">
          <div className="w-1.5 h-full absolute top-0 start-0 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isRtl ? 'الأفكار والمقترحات' : 'Boîte à Idées'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="kpi-number text-amber-700">{stats.ideas}</span>
          </div>
          <span className="text-[11px] font-medium text-amber-700 mt-1 block">
            {isRtl ? 'أفكار تطوير المنظومة' : 'Suggestions d’amélioration'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: isRtl ? 'كافة المذكرات والمهام' : 'Toutes les tâches', count: tasks.length },
          { id: 'assigned_to_me', label: isRtl ? 'المسندة للأطر' : 'Tâches assignées', count: tasks.filter(t => t.visibility === 'assigned').length },
          { id: 'private', label: isRtl ? 'ملاحظاتي الخاصة' : 'Mes notes privées', count: tasks.filter(t => t.visibility === 'private').length },
          { id: 'public', label: isRtl ? 'المهام العامة والتذكيرات' : 'Générales & Rappels', count: tasks.filter(t => t.visibility === 'public').length },
          { id: 'ideas', label: isRtl ? 'بنك الأفكار' : 'Idées & Suggestions', count: tasks.filter(t => t.category === 'idea').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Search and Multi-select Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'البحث في عناوين المهام، الشروحات، أو أسماء الموظفين...' : 'Rechercher par titre, description ou employé...'}
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">
            {isRtl ? 'الأولوية:' : 'Priorité:'}
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">{isRtl ? 'كافة الأولويات' : 'Toutes les priorités'}</option>
            <option value="urgent">{isRtl ? 'عاجل جداً' : 'Urgent'}</option>
            <option value="high">{isRtl ? 'أولوية مرتفعة' : 'Haute'}</option>
            <option value="medium">{isRtl ? 'أولوية متوسطة' : 'Moyenne'}</option>
            <option value="low">{isRtl ? 'أولوية عادية' : 'Basse'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">
            {isRtl ? 'الحالة:' : 'Statut:'}
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">{isRtl ? 'كافة الحالات' : 'Tous les statuts'}</option>
            <option value="pending">{isRtl ? 'قيد الانتظار' : 'En attente'}</option>
            <option value="in_progress">{isRtl ? 'جاري التنفيذ' : 'En cours'}</option>
            <option value="completed">{isRtl ? 'مكتملة' : 'Terminée'}</option>
          </select>
        </div>
      </div>

      {/* 5. Tasks Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs font-mono text-slate-400">
            {isRtl ? 'جاري تحميل المذكرات والمهام...' : 'Chargement des tâches...'}
          </span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {isRtl ? 'لا توجد مهام أو مذكرات مطابقة' : 'Aucune tâche correspondante'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isRtl 
              ? 'يمكنك البدء بتسجيل مهمة جديدة أو تغيير معايير البحث والتصفية المحددة أعلاه.' 
              : 'Commencez par ajouter une nouvelle tâche ou ajustez vos critères de recherche.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.due_date, task.is_completed);

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition duration-200 relative overflow-hidden flex flex-col justify-between hover:shadow-md ${
                  task.is_completed
                    ? 'border-slate-200/60 bg-slate-50/40 opacity-80'
                    : overdue
                    ? 'border-rose-300/80 ring-1 ring-rose-200'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Thin Priority Vertical Strip */}
                <div
                  className={`w-1.5 h-full absolute top-0 start-0 ${
                    task.priority === 'urgent'
                      ? 'bg-rose-500'
                      : task.priority === 'high'
                      ? 'bg-amber-500'
                      : task.priority === 'medium'
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />

                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Category Badge */}
                    <div className="flex items-center gap-1.5">
                      {task.category === 'idea' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Lightbulb className="w-3 h-3" />
                          <span>{isRtl ? 'فكرة' : 'Idée'}</span>
                        </span>
                      ) : task.category === 'announcement' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Megaphone className="w-3 h-3" />
                          <span>{isRtl ? 'إعلان' : 'Annonce'}</span>
                        </span>
                      ) : task.category === 'reminder' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Bell className="w-3 h-3" />
                          <span>{isRtl ? 'تذكير' : 'Rappel'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckSquare className="w-3 h-3" />
                          <span>{isRtl ? 'مهمة' : 'Tâche'}</span>
                        </span>
                      )}

                      {/* Visibility Badge */}
                      {task.visibility === 'private' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{isRtl ? 'خاصة' : 'Privé'}</span>
                        </span>
                      ) : task.visibility === 'public' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{isRtl ? 'عامة' : 'Public'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <User className="w-2.5 h-2.5" />
                          <span>{isRtl ? 'موجهة' : 'Assigné'}</span>
                        </span>
                      )}
                    </div>

                    {/* Priority Indicator */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : task.priority === 'medium'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {task.priority === 'urgent'
                        ? isRtl ? 'عاجل' : 'Urgent'
                        : task.priority === 'high'
                        ? isRtl ? 'مرتفع' : 'Haut'
                        : task.priority === 'medium'
                        ? isRtl ? 'متوسط' : 'Moyen'
                        : isRtl ? 'عادي' : 'Bas'}
                    </span>
                  </div>

                  {/* Title and Completion Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleCompletion(task)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer transition"
                    />
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-bold leading-snug transition-all ${
                          task.is_completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  {/* Assigned / Creator meta */}
                  <div className="flex flex-col gap-0.5">
                    {task.assigned_to_name ? (
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        <span>{task.assigned_to_name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {isRtl ? 'بواسطة:' : 'Par:'} {task.creator_name}
                      </span>
                    )}

                    {/* Due Date Indicator */}
                    {task.due_date && (
                      <span
                        className={`text-[10px] font-medium flex items-center gap-1 ${
                          overdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{task.due_date}</span>
                        {overdue && (
                          <span className="px-1 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px]">
                            {isRtl ? 'متأخر' : 'En retard'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={isRtl ? 'حذف المهمة' : 'Supprimer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Create Task / Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isRtl ? 'تسجيل مهمة أو فكرة جديدة' : 'Nouvelle Tâche ou Note'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isRtl ? 'تحديد نطاق الرؤية والأولويات والأطر المكلفة' : 'Définir la visibilité, priorités et assignation'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'عنوان المهمة أو الفكرة *' : 'Titre de la tâche ou idée *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isRtl ? 'مثال: إعداد حافظة شيكات البنك الشعبي لشهر أكتوبر' : 'Ex: Préparation du bordereau de remise...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'التفاصيل والملاحظات التوضيحية' : 'Détails & Notes explicatives'}
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={isRtl ? 'أدخل تفاصيل التكليف أو الملاحظة الإدارية...' : 'Entrez les détails ou consignes...'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Category & Priority in 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'التصنيف:' : 'Catégorie:'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="task">{isRtl ? 'مهمة عملية (Task)' : 'Tâche opérationnelle'}</option>
                    <option value="idea">{isRtl ? 'فكرة مقترحة (Idea)' : 'Idée / Suggestion'}</option>
                    <option value="reminder">{isRtl ? 'تذكير إداري (Reminder)' : 'Rappel administratif'}</option>
                    <option value="announcement">{isRtl ? 'إعلان عام (Notice)' : 'Annonce générale'}</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الأولوية:' : 'Priorité:'}
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="urgent">{isRtl ? 'عاجل جداً (Urgent)' : 'Urgent'}</option>
                    <option value="high">{isRtl ? 'مرتفع (High)' : 'Haute'}</option>
                    <option value="medium">{isRtl ? 'متوسط (Medium)' : 'Moyenne'}</option>
                    <option value="low">{isRtl ? 'عادي (Low)' : 'Basse'}</option>
                  </select>
                </div>
              </div>

              {/* Scope / Visibility */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'نطاق الرؤية والمشاركة:' : 'Niveau de visibilité :'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'private', label: isRtl ? 'خاصة بي' : 'Privé', icon: Lock },
                    { id: 'assigned', label: isRtl ? 'موجهة لموظف' : 'Assignée', icon: User },
                    { id: 'public', label: isRtl ? 'عامة للفريق' : 'Publique', icon: Globe },
                  ].map((scope) => {
                    const Icon = scope.icon;
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => setNewVisibility(scope.id as TaskVisibility)}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                          newVisibility === scope.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{scope.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Assigned Employee Select */}
              {newVisibility === 'assigned' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isRtl ? 'الموظف المسؤول (من جدول أطر أروى):' : 'Employé responsable (Personnel Aroua) :'}
                  </label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} — ({emp.role} / {emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isRtl ? 'تاريخ الاستحقاق أو الإنجاز:' : 'Date d’échéance :'}
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-4 py-2 cursor-pointer text-xs"
                >
                  {isRtl ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? (isRtl ? 'جاري الحفظ...' : 'Enregistrement...') : (isRtl ? 'حفظ ونشر' : 'Enregistrer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksNotesView;
