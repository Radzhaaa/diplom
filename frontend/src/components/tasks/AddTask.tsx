import { useState, useEffect, useRef } from 'react';
import { api, User, Project } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Plus, ChevronDown, X, Sparkles } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { DatePicker } from '../ui/DatePicker';

interface AddTaskProps {
  projectId?: number;
  onBack: () => void;
  onTaskCreated?: () => void;
}

export function AddTask({ projectId: projectIdProp, onBack, onTaskCreated }: AddTaskProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(projectIdProp ?? '');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [observerIds, setObserverIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [recurrenceRule, setRecurrenceRule] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [observersOpen, setObserversOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deadlineAiLoading, setDeadlineAiLoading] = useState(false);
  const observersRef = useRef<HTMLDivElement>(null);
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    setSelectedProjectId(projectIdProp !== undefined ? projectIdProp : '');
  }, [projectIdProp]);

  useEffect(() => {
    if (!projectIdProp) {
      api.getProjects().then(setProjects).catch(() => {});
    }
  }, [projectIdProp]);

  useEffect(() => {
    const pid = selectedProjectId !== '' ? selectedProjectId : undefined;
    if (pid) {
      setMembers([]);
      setAssigneeId('');
      setObserverIds([]);
      api.getProjectMembers(pid).then(setMembers).catch(() => {});
    } else {
      setMembers([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (observersRef.current && !observersRef.current.contains(e.target as Node)) {
        setObserversOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleObserver = (userId: number) => {
    setObserverIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const userName = (u: User) => `${u.firstName} ${u.lastName}`.trim() || u.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = selectedProjectId !== '' ? selectedProjectId : projectIdProp;
    if (!pid) { setError('Выберите проект'); return; }
    if (title.trim().length < 3) { setError('Название должно содержать минимум 3 символа'); return; }
    setLoading(true);
    setError('');
    try {
      await api.createTask({
        title: title.trim(),
        description,
        priority: priority as any,
        projectId: pid,
        deadline: dueDate ? `${dueDate}T00:00:00` : undefined,
        ...(assigneeId !== '' ? { assignedToId: assigneeId as number } : {}),
        ...(observerIds.length > 0 ? { observerIds } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(recurrenceRule !== 'NONE' ? { recurrenceRule } : {}),
      });
      onTaskCreated?.();
      onBack();
    } catch (err: any) {
      const details = err?.data?.details;
      if (details && typeof details === 'object') {
        const msgs = Object.values(details).join('; ');
        setError(msgs);
      } else {
        setError(err.message || 'Ошибка создания задачи');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: `rgba(${hexToRgb(theme.surface)}, 0.6)`,
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    color: theme.text,
    height: '2.75rem',
  };

  const labelStyle = {
    color: theme.text,
    fontSize: '0.875rem',
    fontWeight: 600 as const,
    display: 'block' as const,
    marginBottom: '0.5rem',
  };

  return (
    <div style={{ ...getGlassCardStyle(theme), padding: '1.75rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        {/* Project selector — only when no projectId was passed as prop */}
        {!projectIdProp && (
          <div>
            <label style={labelStyle}>Проект *</label>
            <Select value={String(selectedProjectId)} onValueChange={(v) => setSelectedProjectId(v === '' ? '' : Number(v))}>
              <SelectTrigger style={{ ...inputStyle, height: '2.75rem' }}>
                <SelectValue>
                  {selectedProjectId === ''
                    ? 'Выберите проект'
                    : projects.find(p => p.id === selectedProjectId)?.name ?? 'Проект'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Название *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Введите название задачи"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Описание</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание задачи..."
            rows={4}
            style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Приоритет</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }}>
                <SelectValue>{{ LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }[priority]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Низкий</SelectItem>
                <SelectItem value="MEDIUM">Средний</SelectItem>
                <SelectItem value="HIGH">Высокий</SelectItem>
                <SelectItem value="CRITICAL">Критичный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label style={labelStyle}>Дедлайн</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}><DatePicker value={dueDate} onChange={setDueDate} placeholder="Дедлайн" /></div>
              <button
                type="button"
                disabled={deadlineAiLoading || !title}
                onClick={async () => {
                  if (!title) return;
                  setDeadlineAiLoading(true);
                  try {
                    const date = await api.suggestDeadline(title, description, priority);
                    setDueDate(date);
                  } catch { /* ignore */ } finally { setDeadlineAiLoading(false); }
                }}
                title="AI предложит дедлайн"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0 0.75rem', borderRadius: '0.5rem', border: `1px solid rgba(${primaryRgb}, 0.25)`, background: `rgba(${primaryRgb}, 0.08)`, color: theme.primary, cursor: deadlineAiLoading || !title ? 'not-allowed' : 'pointer', fontSize: '0.8rem', opacity: !title ? 0.5 : 1, whiteSpace: 'nowrap', height: '2.75rem' }}
              >
                <Sparkles size={13} /> {deadlineAiLoading ? '...' : 'AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Assignee and Observers — shown only when project members are loaded */}
        {members.length > 0 && (
          <>
            <div>
              <label style={labelStyle}>Исполнитель</label>
              <Select value={String(assigneeId)} onValueChange={(v) => setAssigneeId(v === '' ? '' : Number(v))}>
                <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }}>
                  <SelectValue>
                    {assigneeId === ''
                      ? 'Не назначен'
                      : (() => { const u = members.find(m => m.id === assigneeId); return u ? userName(u) : 'Не назначен'; })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не назначен</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{userName(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div ref={observersRef} style={{ position: 'relative' }}>
              <label style={labelStyle}>Наблюдатели</label>
              <button
                type="button"
                onClick={() => setObserversOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 0.75rem', height: '2.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                  background: `rgba(${hexToRgb(theme.surface)}, 0.6)`,
                  border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, fontSize: '0.875rem',
                }}
              >
                <span style={{ opacity: observerIds.length === 0 ? 0.5 : 1 }}>
                  {observerIds.length === 0 ? 'Выбрать наблюдателей' : `Выбрано: ${observerIds.length}`}
                </span>
                <ChevronDown size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
              </button>

              {observerIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                  {observerIds.map(id => {
                    const u = members.find(m => m.id === id);
                    return u ? (
                      <span key={id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem',
                        background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary,
                      }}>
                        {userName(u)}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleObserver(id)} />
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {observersOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 0.25rem)', left: 0, right: 0, zIndex: 50,
                  background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`,
                  borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  maxHeight: '12rem', overflowY: 'auto',
                }}>
                  {members.map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleObserver(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.625rem 0.875rem', cursor: 'pointer',
                        background: observerIds.includes(m.id) ? `rgba(${primaryRgb}, 0.1)` : 'transparent',
                        color: theme.text, fontSize: '0.875rem',
                      }}
                    >
                      <div style={{
                        width: '1rem', height: '1rem', borderRadius: '0.25rem', flexShrink: 0,
                        border: `2px solid ${observerIds.includes(m.id) ? theme.primary : `rgba(${primaryRgb}, 0.4)`}`,
                        background: observerIds.includes(m.id) ? theme.primary : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {observerIds.includes(m.id) && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ flex: 1 }}>{userName(m)}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.45 }}>{m.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tags */}
        <div>
          <label style={labelStyle}>Теги</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: tags.length > 0 ? '0.5rem' : 0 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
                background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary, fontWeight: 500,
              }}>
                #{tag}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setTags(t => t.filter(x => x !== tag))} />
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                e.preventDefault();
                const val = tagInput.trim().replace(/^#/, '').toLowerCase();
                if (val && !tags.includes(val)) setTags(t => [...t, val]);
                setTagInput('');
              } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                setTags(t => t.slice(0, -1));
              }
            }}
            placeholder="Введите тег и нажмите Enter..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
              border: `1px solid rgba(${primaryRgb}, 0.2)`,
              background: `rgba(${primaryRgb}, 0.04)`,
              color: theme.text, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Recurrence */}
        <div>
          <label style={labelStyle}>Повторение</label>
          <Select value={recurrenceRule} onValueChange={v => setRecurrenceRule(v as any)}>
            <SelectTrigger>
              <SelectValue>{{ NONE: 'Не повторять', DAILY: 'Ежедневно', WEEKLY: 'Еженедельно', MONTHLY: 'Ежемесячно' }[recurrenceRule]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Не повторять</SelectItem>
              <SelectItem value="DAILY">Ежедневно</SelectItem>
              <SelectItem value="WEEKLY">Еженедельно</SelectItem>
              <SelectItem value="MONTHLY">Ежемесячно</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.textSecondary, cursor: 'pointer' }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} /> {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
