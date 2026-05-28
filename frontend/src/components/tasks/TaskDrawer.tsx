import { useState, useEffect, useRef } from 'react';
import { api, Task, TaskComment, TimeEntry, TimeTotal, BACKEND_ORIGIN } from '../../services/api';
import { useActiveTimer } from '../../contexts/ActiveTimerContext';
import { STATUS_LABEL, PRIORITY_LABEL } from '../../constants/taskConstants';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { DatePicker } from '../ui/DatePicker';
import { X, Loader, Calendar, User, Tag, Flag, Send, Trash2, MessageSquare, Link2, Plus, AlertCircle, Clock, Play, Square, Timer } from 'lucide-react';

interface TaskDrawerProps {
  taskId: number | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDrawer({ taskId, onClose, onTaskUpdated }: TaskDrawerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { refreshTimer } = useActiveTimer();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const primaryRgb = hexToRgb(theme.primary);

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeTotal, setTimeTotal] = useState<TimeTotal | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [logMinutes, setLogMinutes] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [timeExpanded, setTimeExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [commentError, setCommentError] = useState('');
  const [timerError, setTimerError] = useState('');
  const [logError, setLogError] = useState('');

  const [deadlineEditing, setDeadlineEditing] = useState(false);
  const [deadlineSaving, setDeadlineSaving] = useState(false);

  const handleDeadlineChange = async (val: string) => {
    if (!task) return;
    setDeadlineEditing(false);
    setDeadlineSaving(true);
    try {
      const updated = await api.updateTask(task.id, {
        deadline: val ? `${val}T00:00:00` : undefined,
      } as any);
      setTask(updated);
      onTaskUpdated?.();
    } catch {
    } finally {
      setDeadlineSaving(false);
    }
  };

  const [depInput, setDepInput] = useState('');
  const [depLoading, setDepLoading] = useState(false);
  const [depError, setDepError] = useState('');
  const [depTaskTitles, setDepTaskTitles] = useState<Record<number, string>>({});

  const loadTime = (id: number) => {
    Promise.all([
      api.getTimeEntries(id).catch(() => [] as TimeEntry[]),
      api.getTimeTotal(id).catch(() => null),
      api.getActiveTimer(id).catch(() => null),
    ]).then(([entries, total, active]) => {
      setTimeEntries(entries);
      setTimeTotal(total);
      setActiveTimer(active);
      if (active) {
        const elapsed = Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }
    });
  };

  useEffect(() => {
    if (!activeTimer) return;
    const iv = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [activeTimer]);

  useEffect(() => {
    if (!taskId) { setTask(null); setComments([]); return; }
    setLoading(true);
    Promise.all([
      api.getTask(taskId),
      api.getTaskComments(taskId).catch(() => [] as TaskComment[]),
    ])
      .then(([t, c]) => {
        setTask(t);
        setComments(c);
        loadTime(taskId);
        const ids = [...(t.blockedBy ?? []), ...(t.blocks ?? [])];
        ids.forEach(id => {
          if (!depTaskTitles[id]) {
            api.getTask(id).then(dep => {
              setDepTaskTitles(prev => ({ ...prev, [id]: dep.title }));
            }).catch(() => {
              setDepTaskTitles(prev => ({ ...prev, [id]: `Задача #${id}` }));
            });
          }
        });
      })
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (!taskId) return null;

  const handleSendComment = async () => {
    if (!commentText.trim() || !taskId) return;
    setSendingComment(true);
    setCommentError('');
    try {
      const newComment = await api.createComment(taskId, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch (err: any) {
      setCommentError(err?.message ?? 'Не удалось отправить комментарий');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    await api.deleteComment(id).catch(() => {});
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleTimer = async () => {
    if (!taskId) return;
    setTimerLoading(true);
    setTimerError('');
    try {
      if (activeTimer) {
        await api.stopTimer(taskId);
        setActiveTimer(null);
        setElapsedSeconds(0);
      } else {
        const entry = await api.startTimer(taskId);
        setActiveTimer(entry);
        setElapsedSeconds(0);
      }
      loadTime(taskId);
      refreshTimer();
    } catch (err: any) {
      setTimerError(err?.message ?? 'Ошибка таймера');
    } finally {
      setTimerLoading(false);
    }
  };

  const handleLogTime = async () => {
    const mins = parseInt(logMinutes, 10);
    if (!mins || isNaN(mins) || mins < 1 || !taskId) return;
    setLogLoading(true);
    setLogError('');
    try {
      await api.logTime(taskId, mins, logNote.trim() || undefined);
      setLogMinutes('');
      setLogNote('');
      loadTime(taskId);
    } catch (err: any) {
      setLogError(err?.message ?? 'Не удалось записать время');
    } finally {
      setLogLoading(false);
    }
  };

  const handleDeleteTimeEntry = async (entryId: number) => {
    if (!taskId) return;
    await api.deleteTimeEntry(taskId, entryId).catch(() => {});
    loadTime(taskId);
  };

  const fmtElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fmtMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
  };

  const handleAddDependency = async () => {
    const blockingId = parseInt(depInput.trim(), 10);
    if (!blockingId || isNaN(blockingId) || !taskId) return;
    if (blockingId === taskId) { setDepError('Задача не может зависеть от себя'); return; }
    if (task?.blockedBy?.includes(blockingId)) { setDepError('Уже добавлено'); return; }
    setDepLoading(true);
    setDepError('');
    try {
      const updated = await api.addTaskDependency(taskId, blockingId);
      setTask(updated);
      setDepInput('');
      api.getTask(blockingId).then(dep => {
        setDepTaskTitles(prev => ({ ...prev, [blockingId]: dep.title }));
      }).catch(() => {
        setDepTaskTitles(prev => ({ ...prev, [blockingId]: `Задача #${blockingId}` }));
      });
    } catch {
      setDepError('Не удалось добавить зависимость');
    } finally {
      setDepLoading(false);
    }
  };

  const handleRemoveDependency = async (blockingId: number) => {
    if (!taskId) return;
    try {
      const updated = await api.removeTaskDependency(taskId, blockingId);
      setTask(updated);
    } catch (err: any) {
      setDepError(err?.message ?? 'Не удалось удалить зависимость');
    }
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 101,
        width: 'min(520px, 95vw)', background: theme.surface,
        borderLeft: `1px solid rgba(${primaryRgb}, 0.2)`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.12)`, flexShrink: 0 }}>
          <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>Задача #{taskId}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader size={28} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {task && (
            <>
              {/* Task info */}
              <div>
                <h1 style={{ color: theme.text, fontWeight: 700, fontSize: '1.375rem', margin: '0 0 0.75rem', lineHeight: 1.3 }}>{task.title}</h1>
                {task.description && (
                  <p style={{ color: theme.textSecondary, fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>{task.description}</p>
                )}
              </div>

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                {[
                  { label: 'Статус',     value: STATUS_LABEL[task.status] ?? task.status,      icon: Tag },
                  { label: 'Приоритет',  value: PRIORITY_LABEL[task.priority] ?? task.priority,    icon: Flag },
                  { label: 'Исполнитель', value: task.assignedTo ? `${task.assignedTo.firstName ?? ''} ${task.assignedTo.lastName ?? ''}`.trim() || task.assignedTo.email : (task.assigneeName || '—'), icon: User },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ background: `rgba(${primaryRgb}, 0.06)`, borderRadius: '0.75rem', padding: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary, fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                      <Icon size={13} /> {label}
                    </div>
                    <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>{value}</div>
                  </div>
                ))}
                {/* Deadline — editable */}
                <div
                  style={{ background: `rgba(${primaryRgb}, 0.06)`, borderRadius: '0.75rem', padding: '0.875rem', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setDeadlineEditing(true)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary, fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                    <Calendar size={13} /> Дедлайн
                  </div>
                  {deadlineEditing ? (
                    <div onClick={e => e.stopPropagation()}>
                      <DatePicker
                        value={(task.deadline || task.dueDate)?.split('T')[0] ?? ''}
                        onChange={handleDeadlineChange}
                        placeholder="Выберите дату"
                      />
                    </div>
                  ) : (
                    <div style={{ color: deadlineSaving ? theme.textSecondary : theme.text, fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {deadlineSaving ? '...' : (task.deadline || task.dueDate) ? new Date(task.deadline ?? task.dueDate!).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  )}
                </div>
              </div>

              {task.xpReward && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: `rgba(${primaryRgb}, 0.12)`, padding: '0.375rem 0.875rem', borderRadius: '9999px', color: theme.primary, fontWeight: 700, fontSize: '0.875rem', width: 'fit-content' }}>
                  +{task.xpReward} XP за выполнение{(task.deadline || task.dueDate) ? ' (+10 бонус за срок)' : ''}
                </div>
              )}

              {/* ── Tags ── */}
              {task.tags && task.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {task.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500,
                      background: `rgba(${primaryRgb}, 0.12)`, color: theme.primary,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Recurrence badge ── */}
              {task.recurrenceRule && task.recurrenceRule !== 'NONE' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: `rgba(${primaryRgb}, 0.1)`, padding: '0.3rem 0.75rem', borderRadius: '9999px', color: theme.primary, fontSize: '0.8rem', fontWeight: 600, width: 'fit-content' }}>
                  🔄 {{ DAILY: 'Ежедневно', WEEKLY: 'Еженедельно', MONTHLY: 'Ежемесячно' }[task.recurrenceRule]}
                </div>
              )}

              {/* ── Time Tracking ── */}
              <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, paddingTop: '1.25rem' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: timeExpanded ? '1rem' : 0, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setTimeExpanded(e => !e)}
                >
                  <Clock size={15} style={{ color: theme.primary }} />
                  <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem', flex: 1 }}>Время</span>
                  {timeTotal && timeTotal.totalMinutes > 0 && (
                    <span style={{ color: theme.primary, fontSize: '0.8125rem', fontWeight: 700 }}>
                      {fmtMinutes(timeTotal.totalMinutes)}
                      {task?.estimatedHours ? ` / ${task.estimatedHours}ч` : ''}
                    </span>
                  )}
                  {activeTimer && (
                    <span style={{ color: '#4ade80', fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      ⏱ {fmtElapsed(elapsedSeconds)}
                    </span>
                  )}
                  <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>{timeExpanded ? '▲' : '▼'}</span>
                </div>

                {timeExpanded && (
                  <>
                    {/* Timer button */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <button
                        onClick={handleToggleTimer}
                        disabled={timerLoading}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                          background: activeTimer
                            ? 'rgba(239,68,68,0.15)'
                            : `rgba(${primaryRgb}, 0.12)`,
                          color: activeTimer ? '#ef4444' : theme.primary,
                          fontWeight: 600, fontSize: '0.875rem',
                        }}
                      >
                        {timerLoading
                          ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          : activeTimer ? <Square size={14} /> : <Play size={14} />
                        }
                        {activeTimer ? `Стоп (${fmtElapsed(elapsedSeconds)})` : 'Запустить таймер'}
                      </button>
                      {timerError && (
                        <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: 0 }}>{timerError}</p>
                      )}
                    </div>

                    {/* Manual log */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Записать вручную
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={logMinutes}
                          onChange={e => setLogMinutes(e.target.value)}
                          placeholder="Минуты"
                          type="number"
                          min={1}
                          style={{
                            width: 90, background: `rgba(${primaryRgb}, 0.06)`,
                            border: `1px solid rgba(${primaryRgb}, 0.15)`,
                            borderRadius: '0.625rem', color: theme.text,
                            padding: '0.4rem 0.625rem', fontSize: '0.875rem', outline: 'none',
                          }}
                        />
                        <input
                          value={logNote}
                          onChange={e => setLogNote(e.target.value)}
                          placeholder="Заметка (опционально)"
                          style={{
                            flex: 1, background: `rgba(${primaryRgb}, 0.06)`,
                            border: `1px solid rgba(${primaryRgb}, 0.15)`,
                            borderRadius: '0.625rem', color: theme.text,
                            padding: '0.4rem 0.625rem', fontSize: '0.875rem', outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleLogTime}
                          disabled={!logMinutes || logLoading}
                          style={{
                            width: 34, height: 34, borderRadius: '0.625rem', border: 'none', flexShrink: 0,
                            background: logMinutes ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${primaryRgb}, 0.08)`,
                            color: logMinutes ? '#fff' : theme.textSecondary,
                            cursor: logMinutes ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {logLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Timer size={13} />}
                        </button>
                      </div>
                      {logError && (
                        <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>{logError}</p>
                      )}
                    </div>

                    {/* Time entries list */}
                    {timeEntries.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {timeEntries.slice(0, 5).map(entry => (
                          <div key={entry.id} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                            background: entry.active ? 'rgba(74,222,128,0.08)' : `rgba(${primaryRgb}, 0.05)`,
                            border: entry.active ? '1px solid rgba(74,222,128,0.2)' : `1px solid rgba(${primaryRgb}, 0.08)`,
                          }}>
                            <span style={{ color: theme.textSecondary, fontSize: '0.75rem', flex: 1 }}>
                              {entry.userFullName}
                              {entry.note ? ` — ${entry.note}` : ''}
                            </span>
                            <span style={{ color: entry.active ? '#4ade80' : theme.primary, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                              {entry.active ? `⏱ активен` : fmtMinutes(entry.durationMinutes ?? 0)}
                            </span>
                            {(user?.id === entry.userId || user?.role === 'ADMIN') && !entry.active && (
                              <button
                                onClick={() => handleDeleteTimeEntry(entry.id)}
                                style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', display: 'flex', padding: 0 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Dependencies ── */}
              <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <Link2 size={15} style={{ color: theme.primary }} />
                  <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>Зависимости</span>
                </div>

                {/* Blocked by */}
                {(task.blockedBy ?? []).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Заблокировано задачами
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {task.blockedBy!.map(id => (
                        <div key={id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                        }}>
                          <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                          <span style={{ color: theme.text, fontSize: '0.8125rem', flex: 1 }}>
                            #{id} {depTaskTitles[id] ? `— ${depTaskTitles[id]}` : ''}
                          </span>
                          <button
                            onClick={() => handleRemoveDependency(id)}
                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', display: 'flex', padding: 0 }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blocks */}
                {(task.blocks ?? []).length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Блокирует задачи
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {task.blocks!.map(id => (
                        <div key={id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                          background: `rgba(${primaryRgb}, 0.06)`, border: `1px solid rgba(${primaryRgb}, 0.12)`,
                        }}>
                          <Link2 size={13} style={{ color: theme.primary, flexShrink: 0 }} />
                          <span style={{ color: theme.text, fontSize: '0.8125rem' }}>
                            #{id} {depTaskTitles[id] ? `— ${depTaskTitles[id]}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add dependency input */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    value={depInput}
                    onChange={e => { setDepInput(e.target.value); setDepError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddDependency(); }}
                    placeholder="ID блокирующей задачи..."
                    type="number"
                    min={1}
                    style={{
                      flex: 1, background: `rgba(${primaryRgb}, 0.06)`,
                      border: `1px solid rgba(${primaryRgb}, 0.15)`,
                      borderRadius: '0.625rem', color: theme.text,
                      padding: '0.5rem 0.75rem', fontSize: '0.875rem',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={handleAddDependency}
                    disabled={!depInput.trim() || depLoading}
                    style={{
                      width: 34, height: 34, borderRadius: '0.625rem', border: 'none', flexShrink: 0,
                      background: depInput.trim() ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${primaryRgb}, 0.1)`,
                      color: depInput.trim() ? '#fff' : theme.textSecondary,
                      cursor: depInput.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {depLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                  </button>
                </div>
                {depError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.375rem' }}>{depError}</div>
                )}
              </div>

              {/* ── Comments ── */}
              <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MessageSquare size={16} style={{ color: theme.primary }} />
                  <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>
                    Комментарии ({comments.length})
                  </span>
                </div>

                {/* Comment list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {comments.length === 0 && (
                    <div style={{ color: theme.textSecondary, fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', opacity: 0.7 }}>
                      Комментариев пока нет
                    </div>
                  )}
                  {comments.map(comment => (
                    <div
                      key={comment.id}
                      style={{
                        display: 'flex', gap: '0.75rem',
                        padding: '0.875rem', borderRadius: '0.875rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                        overflow: 'hidden',
                      }}>
                        {comment.author?.avatar
                          ? <img src={comment.author.avatar.startsWith('http') ? comment.author.avatar : BACKEND_ORIGIN + comment.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : `${comment.author?.firstName?.[0] ?? ''}${comment.author?.lastName?.[0] ?? ''}`
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.8125rem' }}>
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: theme.textSecondary, fontSize: '0.7rem' }}>
                              {new Date(comment.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {(user?.id === comment.author?.id || user?.role === 'ADMIN') && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment input */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    placeholder="Написать комментарий... (Enter — отправить)"
                    rows={2}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.04)',
                      border: `1px solid rgba(${primaryRgb}, 0.15)`,
                      borderRadius: '0.875rem', color: theme.text,
                      padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                      resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
                    }}
                  />
                  {commentError && (
                    <p style={{ color: '#f87171', fontSize: '0.8125rem', margin: '0.25rem 0 0', gridColumn: '1/-1' }}>{commentError}</p>
                  )}
                  <button
                    onClick={handleSendComment}
                    disabled={!commentText.trim() || sendingComment}
                    style={{
                      width: 38, height: 38, borderRadius: '0.875rem', border: 'none',
                      background: commentText.trim() ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'rgba(255,255,255,0.06)',
                      color: commentText.trim() ? '#fff' : theme.textSecondary,
                      cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.2s',
                    }}
                  >
                    {sendingComment ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
