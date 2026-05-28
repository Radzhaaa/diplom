import { useState, useEffect } from 'react';
import { api, Task } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Archive, Loader, RotateCcw, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type Tab = 'completed' | 'archived';

export function TaskArchive() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('completed');
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCompletedTasks(), api.getArchivedTasks()])
      .then(([completed, archived]) => {
        setCompletedTasks(completed);
        setArchivedTasks(archived);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRestore = async (taskId: number) => {
    try {
      await api.restoreTask(taskId);
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {}
  };

  const handleReopen = async (taskId: number) => {
    try {
      await api.updateTask(taskId, { status: 'TODO' });
      setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {}
  };

  const tasks = tab === 'completed' ? completedTasks : archivedTasks;

  const tabStyle = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all 0.15s',
    background: active
      ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
      : `rgba(${primaryRgb}, 0.06)`,
    color: active ? '#fff' : theme.textSecondary,
    boxShadow: active ? `0 2px 8px rgba(${primaryRgb}, 0.32)` : 'none',
  } as React.CSSProperties);

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: 0 }}>Архив задач</h1>
        <p style={{ color: theme.textSecondary, marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Выполненные и удалённые задачи · удалённые хранятся 90 дней
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle(tab === 'completed')} onClick={() => setTab('completed')}>
          <CheckCircle2 size={15} />
          Выполненные
          {completedTasks.length > 0 && (
            <span style={{
              background: tab === 'completed' ? 'rgba(255,255,255,0.25)' : `rgba(${primaryRgb},0.15)`,
              color: tab === 'completed' ? '#fff' : theme.primary,
              borderRadius: '0.5rem',
              padding: '0 0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {completedTasks.length}
            </span>
          )}
        </button>
        <button style={tabStyle(tab === 'archived')} onClick={() => setTab('archived')}>
          <Trash2 size={15} />
          Удалённые и отменённые
          {archivedTasks.length > 0 && (
            <span style={{
              background: tab === 'archived' ? 'rgba(255,255,255,0.25)' : `rgba(${primaryRgb},0.15)`,
              color: tab === 'archived' ? '#fff' : theme.primary,
              borderRadius: '0.5rem',
              padding: '0 0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {archivedTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ ...getGlassCardStyle(theme), padding: '4rem', textAlign: 'center' }}>
          <Archive size={48} style={{ color: theme.textSecondary, margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: '0.5rem' }}>
            {tab === 'completed' ? 'Нет выполненных задач' : 'Архив пуст'}
          </h3>
          <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
            {tab === 'completed'
              ? 'Выполненные задачи появятся здесь'
              : 'Удалённые и отменённые задачи появятся здесь'}
          </p>
        </div>
      ) : (
        <div style={{ ...getGlassCardStyle(theme), overflow: 'hidden' }}>
          {tasks.map((task, i) => {
            const isCancelled = task.status === 'CANCELLED';
            const isDeleted = !!task.deletedAt;
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < tasks.length - 1 ? `1px solid rgba(${primaryRgb}, 0.08)` : 'none',
                }}
              >
                {/* Icon */}
                <div style={{ flexShrink: 0 }}>
                  {tab === 'completed' ? (
                    <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                  ) : isCancelled ? (
                    <XCircle size={20} style={{ color: '#6b7280' }} />
                  ) : (
                    <Trash2 size={20} style={{ color: '#ef4444', opacity: 0.7 }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: theme.text,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    textDecoration: tab === 'archived' ? 'line-through' : 'none',
                    opacity: 0.75,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    {task.projectName && `${task.projectName} · `}
                    {tab === 'completed' && task.completedAt && (
                      <>Выполнена: {format(new Date(task.completedAt), 'd MMM yyyy', { locale: ru })}</>
                    )}
                    {tab === 'archived' && isCancelled && (
                      <>Статус: Отменена</>
                    )}
                    {tab === 'archived' && isDeleted && task.deletedAt && (
                      <>Удалена: {format(new Date(task.deletedAt), 'd MMM yyyy', { locale: ru })}</>
                    )}
                  </div>
                </div>

                {/* Action */}
                {tab === 'completed' && (
                  <button
                    onClick={() => handleReopen(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                      background: `rgba(${primaryRgb}, 0.08)`,
                      border: `1px solid rgba(${primaryRgb}, 0.18)`,
                      color: theme.textSecondary, cursor: 'pointer',
                      fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    <RotateCcw size={13} /> Переоткрыть
                  </button>
                )}
                {tab === 'archived' && isDeleted && (
                  <button
                    onClick={() => handleRestore(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                      background: `rgba(${primaryRgb}, 0.08)`,
                      border: `1px solid rgba(${primaryRgb}, 0.18)`,
                      color: theme.text, cursor: 'pointer',
                      fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    <RotateCcw size={13} /> Восстановить
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
