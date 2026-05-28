import { useState, useEffect } from 'react';
import { api, Sprint, Task } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import {
  Loader, Plus, Play, Square, ChevronDown, ChevronRight,
  CheckCircle2, Circle, Calendar, Flag, Zap, X,
} from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

interface SprintsProps {
  projectId: number;
  onNavigateToTask?: (id: number) => void;
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED:   'Запланирован',
  ACTIVE:    'Активен',
  CLOSED:    'Закрыт',
  COMPLETED: 'Завершён',
};

const STATUS_COLOR: Record<string, string> = {
  PLANNED:   '#64748b',
  ACTIVE:    '#10b981',
  CLOSED:    '#6366f1',
  COMPLETED: '#6366f1',
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  TODO: 'К выполнению', NEW: 'Новая', IN_PROGRESS: 'В работе',
  IN_REVIEW: 'На проверке', DONE: 'Выполнено', COMPLETED: 'Выполнено',
  BLOCKED: 'Заблокировано', CANCELLED: 'Отменено',
};

export function Sprints({ projectId, onNavigateToTask }: SprintsProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [sprints, setSprints]           = useState<Sprint[]>([]);
  const [backlog, setBacklog]           = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks]   = useState<Record<number, Task[]>>({});
  const [expanded, setExpanded]         = useState<Set<number>>(new Set());
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName]             = useState('');
  const [formGoal, setFormGoal]             = useState('');
  const [formStart, setFormStart]           = useState('');
  const [formEnd, setFormEnd]               = useState('');
  const [createLoading, setCreateLoading]   = useState(false);

  const load = async () => {
    try {
      const [allSprints, allTasks] = await Promise.all([
        api.getSprints(projectId),
        api.getTasks(projectId),
      ]);
      setSprints(allSprints);

      const backlogTasks = allTasks.filter(t => !t.sprintId && t.status !== 'COMPLETED' && t.status !== 'DONE' && !t.deletedAt);
      setBacklog(backlogTasks);

      const bySprintId: Record<number, Task[]> = {};
      for (const t of allTasks) {
        if (t.sprintId) {
          if (!bySprintId[t.sprintId]) bySprintId[t.sprintId] = [];
          bySprintId[t.sprintId].push(t);
        }
      }
      setSprintTasks(bySprintId);

      const active = allSprints.find(s => s.status === 'ACTIVE');
      if (active) setExpanded(prev => new Set([...prev, active.id]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleStart = async (sprintId: number) => {
    setActionLoading(sprintId);
    try {
      await api.startSprint(sprintId);
      await load();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (sprintId: number) => {
    if (!confirm('Закрыть спринт? Незавершённые задачи вернутся в бэклог.')) return;
    setActionLoading(sprintId);
    try {
      await api.closeSprint(sprintId);
      await load();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToSprint = async (taskId: number, sprintId: number) => {
    try {
      await api.assignTaskToSprint(taskId, sprintId);
      await load();
    } catch {
    }
  };

  const handleMoveToBacklog = async (taskId: number) => {
    try {
      await api.assignTaskToSprint(taskId, null);
      await load();
    } catch {
    }
  };

  const handleCreateSprint = async () => {
    if (!formName.trim()) return;
    setCreateLoading(true);
    try {
      await api.createSprint(projectId, {
        name: formName.trim(),
        goal: formGoal.trim() || undefined,
        startDate: formStart || undefined,
        endDate: formEnd || undefined,
      });
      setFormName(''); setFormGoal(''); setFormStart(''); setFormEnd('');
      setShowCreateForm(false);
      await load();
    } catch {
    } finally {
      setCreateLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: `rgba(${primaryRgb}, 0.06)`,
    border: `1px solid rgba(${primaryRgb}, 0.15)`,
    borderRadius: '0.625rem', color: theme.text,
    padding: '0.5rem 0.75rem', fontSize: '0.875rem',
    outline: 'none', fontFamily: 'inherit',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>
          Спринты
        </h2>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.4rem 0.875rem', borderRadius: '99px', border: 'none',
            background: `rgba(${primaryRgb}, 0.12)`, color: theme.primary,
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
          }}
        >
          <Plus size={14} /> Создать спринт
        </button>
      </div>

      {/* Create sprint form */}
      {showCreateForm && (
        <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>Новый спринт</span>
            <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Название спринта *" style={inputStyle} />
          <input value={formGoal} onChange={e => setFormGoal(e.target.value)} placeholder="Цель спринта" style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Начало</div>
              <DatePicker value={formStart} onChange={setFormStart} placeholder="Начало" />
            </div>
            <div>
              <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Конец</div>
              <DatePicker value={formEnd} onChange={setFormEnd} placeholder="Конец" />
            </div>
          </div>
          <button
            onClick={handleCreateSprint}
            disabled={!formName.trim() || createLoading}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none',
              background: formName.trim() ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${primaryRgb}, 0.1)`,
              color: formName.trim() ? '#fff' : theme.textSecondary,
              cursor: formName.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {createLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
            Создать
          </button>
        </div>
      )}

      {/* Sprint list */}
      {sprints.map(sprint => {
        const tasks = sprintTasks[sprint.id] ?? [];
        const done = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;
        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
        const color = STATUS_COLOR[sprint.status] ?? theme.primary;
        const isExpanded = expanded.has(sprint.id);

        return (
          <div key={sprint.id} style={{ ...getGlassCardStyle(theme), overflow: 'visible' }}>
            {/* Sprint header */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
              onClick={() => toggleExpand(sprint.id)}
            >
              {isExpanded ? <ChevronDown size={16} style={{ color: theme.textSecondary, flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: theme.textSecondary, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem' }}>{sprint.name}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 700, background: `${color}18`, color }}>{STATUS_LABEL[sprint.status] ?? sprint.status}</span>
                  {sprint.startDate && (
                    <span style={{ color: theme.textSecondary, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} />
                      {new Date(sprint.startDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                      {sprint.endDate ? ` — ${new Date(sprint.endDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}` : ''}
                    </span>
                  )}
                </div>
                {sprint.goal && <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', marginTop: '2px' }}>{sprint.goal}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>{done}/{tasks.length}</span>
                {tasks.length > 0 && (
                  <div style={{ width: 64, height: 5, borderRadius: 99, background: `rgba(${primaryRgb}, 0.1)`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
                  </div>
                )}
                {sprint.status === 'PLANNED' && (
                  <button
                    onClick={e => { e.stopPropagation(); handleStart(sprint.id); }}
                    disabled={actionLoading === sprint.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: 99, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {actionLoading === sprint.id ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />} Старт
                  </button>
                )}
                {sprint.status === 'ACTIVE' && (
                  <button
                    onClick={e => { e.stopPropagation(); handleClose(sprint.id); }}
                    disabled={actionLoading === sprint.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: 99, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {actionLoading === sprint.id ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Square size={12} />} Закрыть
                  </button>
                )}
              </div>
            </div>

            {/* Tasks */}
            {isExpanded && (
              <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.08)`, padding: '0.5rem 1.25rem 1rem' }}>
                {tasks.length === 0 ? (
                  <div style={{ color: theme.textSecondary, fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0', opacity: 0.6 }}>
                    Нет задач в спринте
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                    {tasks.map(task => {
                      const isDone = task.status === 'COMPLETED' || task.status === 'DONE';
                      return (
                        <div key={task.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          cursor: onNavigateToTask ? 'pointer' : 'default',
                        }}
                          onClick={() => onNavigateToTask?.(task.id)}
                        >
                          {isDone
                            ? <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                            : <Circle size={14} style={{ color: theme.textSecondary, flexShrink: 0 }} />
                          }
                          <span style={{ color: isDone ? theme.textSecondary : theme.text, fontSize: '0.875rem', flex: 1, textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: `${PRIORITY_COLOR[task.priority] ?? '#6b7280'}18`, color: PRIORITY_COLOR[task.priority] ?? '#6b7280', flexShrink: 0 }}>
                            {task.priority}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: theme.textSecondary, flexShrink: 0 }}>
                            {TASK_STATUS_LABEL[task.status] ?? task.status}
                          </span>
                          {sprint.status !== 'CLOSED' && sprint.status !== 'COMPLETED' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleMoveToBacklog(task.id); }}
                              title="Убрать из спринта"
                              style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', display: 'flex', padding: 0, opacity: 0.5 }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sprints.length === 0 && (
        <div style={{ ...getGlassCardStyle(theme), padding: '3rem', textAlign: 'center' }}>
          <Zap size={40} style={{ color: theme.textSecondary, margin: '0 auto 1rem', opacity: 0.3 }} />
          <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: '0.5rem' }}>Спринтов пока нет</h3>
          <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>Создайте первый спринт для этого проекта</p>
        </div>
      )}

      {/* Backlog */}
      {backlog.length > 0 && (
        <div style={{ ...getGlassCardStyle(theme) }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
            onClick={() => toggleExpand(-1)}
          >
            {expanded.has(-1) ? <ChevronDown size={16} style={{ color: theme.textSecondary }} /> : <ChevronRight size={16} style={{ color: theme.textSecondary }} />}
            <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem', flex: 1 }}>Бэклог</span>
            <span style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>{backlog.length} задач</span>
          </div>

          {expanded.has(-1) && (
            <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.08)`, padding: '0.5rem 1.25rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                {backlog.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    cursor: onNavigateToTask ? 'pointer' : 'default',
                  }}
                    onClick={() => onNavigateToTask?.(task.id)}
                  >
                    <Circle size={14} style={{ color: theme.textSecondary, flexShrink: 0 }} />
                    <span style={{ color: theme.text, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: `${PRIORITY_COLOR[task.priority] ?? '#6b7280'}18`, color: PRIORITY_COLOR[task.priority] ?? '#6b7280', flexShrink: 0 }}>
                      {task.priority}
                    </span>
                    {/* Move to sprint dropdown */}
                    {sprints.filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE').length > 0 && (
                      <div onClick={e => e.stopPropagation()}>
                        <Select value="" onValueChange={v => { if (v) handleMoveToSprint(task.id, Number(v)); }}>
                          <SelectTrigger style={{ background: `rgba(${primaryRgb}, 0.1)`, border: `1px solid rgba(${primaryRgb}, 0.15)`, borderRadius: '0.375rem', color: theme.primary, fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', height: 'auto', minWidth: 80 }}>
                            <SelectValue placeholder="+ спринт" />
                          </SelectTrigger>
                          <SelectContent>
                            {sprints
                              .filter(s => s.status === 'PLANNED' || s.status === 'ACTIVE')
                              .map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
