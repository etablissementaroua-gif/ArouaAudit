export const formatDateFR = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const isDateOverdue = (dueDateStr: string): boolean => {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

export const daysUntil = (dueDateStr: string): number => {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
