
export const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: 'Критический',
  HIGH:     'Высокий',
  MEDIUM:   'Средний',
  LOW:      'Низкий',
};

export const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#3b82f6',
};

export const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH:     3,
  MEDIUM:   2,
  LOW:      1,
};

export const STATUS_LABEL: Record<string, string> = {
  NEW:         'Новые',
  TODO:        'К выполнению',
  IN_PROGRESS: 'В работе',
  IN_REVIEW:   'На проверке',
  DONE:        'Выполнено',
  COMPLETED:   'Выполнено',
  BLOCKED:     'Заблокировано',
  CANCELLED:   'Отменено',
};

export const STATUS_COLOR: Record<string, string> = {
  NEW:         '#6b7280',
  TODO:        '#6b7280',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW:   '#8b5cf6',
  DONE:        '#10b981',
  COMPLETED:   '#10b981',
  BLOCKED:     '#ef4444',
  CANCELLED:   '#6b7280',
};

export const STATUS_ORDER: Record<string, number> = {
  IN_PROGRESS: 5,
  IN_REVIEW:   4,
  TODO:        3,
  NEW:         3,
  BLOCKED:     2,
  DONE:        1,
  COMPLETED:   1,
  CANCELLED:   0,
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  ACTIVE:     'Активен',
  PLANNING:   'Планируется',
  COMPLETED:  'Завершён',
  ON_HOLD:    'На паузе',
  CANCELLED:  'Отменён',
};

export const PROJECT_STATUS_COLOR: Record<string, string> = {
  ACTIVE:    '#10b981',
  PLANNING:  '#3b82f6',
  COMPLETED: '#8b5cf6',
  ON_HOLD:   '#f59e0b',
  CANCELLED: '#6b7280',
};
