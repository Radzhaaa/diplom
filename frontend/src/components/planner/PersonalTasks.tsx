import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { api, PersonalTask } from '../../services/api';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { DatePicker } from '../ui/DatePicker';
import { PRIORITY_COLOR, PRIORITY_LABEL } from '../../constants/taskConstants';

type FilterStatus = 'all' | 'active' | 'done';

export function PersonalTasks() {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'MEDIUM', deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api.getPersonalTasks();
      setTasks(data);
    } catch {
      toast.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'DONE';
    if (filter === 'done') return t.status === 'DONE';
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const task = await api.createPersonalTask({
        title: form.title,
        priority: form.priority as PersonalTask['priority'],
        deadline: form.deadline ? `${form.deadline}T00:00:00` : undefined,
      });
      setTasks(prev => [task, ...prev]);
      setForm({ title: '', priority: 'MEDIUM', deadline: '' });
      setShowForm(false);
      toast.success('Задача создана');
    } catch {
      toast.error('Ошибка создания задачи');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const updated = await api.completePersonalTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePersonalTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const cardStyle = {
    background: `rgba(${rgb}, 0.05)`,
    border: `1px solid rgba(${rgb}, 0.12)`,
    borderRadius: '1rem',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
    transition: 'background 0.15s',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ListTodo size={26} style={{ color: theme.primary }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: 0 }}>Мои задачи</h1>
        </div>
        <button
          onClick={() => setShowForm(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.1rem', borderRadius: '0.75rem', border: 'none',
            background: `rgba(${rgb}, 0.15)`, color: theme.primary,
            cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
            transition: 'background 0.15s',
          }}
        >
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: `rgba(${rgb}, 0.07)`,
            border: `1px solid rgba(${rgb}, 0.18)`,
            borderRadius: '1rem', padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}
        >
          <input
            autoFocus
            placeholder="Название задачи..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{
              background: `rgba(${rgb}, 0.06)`, border: `1px solid rgba(${rgb}, 0.18)`,
              borderRadius: '0.625rem', padding: '0.625rem 0.875rem',
              color: theme.text, fontSize: '0.9rem', outline: 'none', width: '100%',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger style={{ background: `rgba(${rgb}, 0.06)`, border: `1px solid rgba(${rgb}, 0.18)`, color: theme.text }}>
                  <SelectValue>{{ LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }[form.priority]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                  <SelectItem value="CRITICAL">Критичный</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <DatePicker value={form.deadline} onChange={v => setForm(f => ({ ...f, deadline: v }))} placeholder="Дедлайн" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none', background: 'transparent', color: theme.textSecondary, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none',
                background: `rgba(${rgb}, 0.2)`, color: theme.primary,
                cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem',
                opacity: (!form.title.trim() || submitting) ? 0.5 : 1,
              }}
            >
              Создать
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['all', 'active', 'done'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '0.625rem',
              border: filter === f ? `1px solid rgba(${rgb}, 0.3)` : '1px solid transparent',
              background: filter === f ? `rgba(${rgb}, 0.14)` : 'transparent',
              color: filter === f ? theme.primary : theme.textSecondary,
              cursor: 'pointer', fontSize: '0.825rem', fontWeight: filter === f ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Выполненные'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: theme.textSecondary, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
          {filtered.length} задач
        </span>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '3rem' }}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: theme.textSecondary }}>
          <ListTodo size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {filter === 'done' ? 'Нет выполненных задач' : 'Нет задач. Создайте первую!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map(task => (
            <div
              key={task.id}
              style={{
                ...cardStyle,
                opacity: task.status === 'DONE' ? 0.6 : 1,
              }}
            >
              {/* Complete toggle */}
              <button
                onClick={() => task.status !== 'DONE' && handleComplete(task.id)}
                style={{ background: 'none', border: 'none', cursor: task.status === 'DONE' ? 'default' : 'pointer', padding: 0, flexShrink: 0, marginTop: 2 }}
              >
                {task.status === 'DONE'
                  ? <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                  : <Circle size={20} style={{ color: theme.textSecondary, opacity: 0.5 }} />
                }
              </button>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 600, color: theme.text,
                    textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px',
                    borderRadius: '99px', background: `${PRIORITY_COLOR[task.priority]}22`,
                    color: PRIORITY_COLOR[task.priority],
                  }}>
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                </div>
                {task.deadline && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem', color: theme.textSecondary, fontSize: '0.775rem' }}>
                    <Calendar size={12} />
                    {new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(task.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: theme.textSecondary, opacity: 0.4, flexShrink: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
