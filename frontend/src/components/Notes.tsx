import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb } from '../utils/glassStyles';
import { api, Note } from '../services/api';
import { Plus, Trash2, Pin, StickyNote, Calendar } from 'lucide-react';
import { DatePicker } from './ui/DatePicker';
import { toast } from 'sonner';

const NOTE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#10b981',
];

function hexToRgbTriple(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
}

function isOverdue(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date(new Date().toDateString());
}

interface NoteCardProps {
  note: Note;
  onUpdate: (id: number, data: Partial<Note>) => void;
  onDelete: (id: number) => void;
  onPin: (id: number) => void;
}

function NoteCard({ note, onUpdate, onDelete, onPin }: NoteCardProps) {
  const { theme } = useTheme();
  const rgb = hexToRgbTriple(note.color);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = (newTitle: string, newContent: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onUpdate(note.id, { title: newTitle, content: newContent });
      setSaved(true);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setSaved(false), 1500);
    }, 700);
  };

  const deadlineStr = note.deadline ? note.deadline.slice(0, 10) : '';
  const overdue = isOverdue(note.deadline);

  return (
    <div style={{
      background: `rgba(${rgb}, 0.08)`,
      border: `1.5px solid rgba(${rgb}, 0.22)`,
      borderRadius: '1.125rem',
      padding: '1rem 1.1rem 0.75rem',
      position: 'relative',
      minHeight: 140,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'border-color 0.2s',
      boxShadow: note.pinned ? `0 0 0 2px ${note.color}44` : 'none',
    }}>

      {/* Top row: pin badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {note.pinned && (
            <Pin size={13} fill="currentColor" style={{ color: note.color, opacity: 0.85 }} />
          )}
          {saved && (
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, opacity: 0.9 }}>✓ Сохранено</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            onClick={() => onPin(note.id)}
            title={note.pinned ? 'Открепить' : 'Закрепить'}
            style={{
              background: `rgba(${rgb}, 0.15)`, border: 'none', borderRadius: '0.5rem',
              cursor: 'pointer', padding: '4px 6px', color: note.color,
              display: 'flex', alignItems: 'center',
            }}
          >
            <Pin size={13} />
          </button>
          <button
            onClick={() => setShowDatePicker(v => !v)}
            title="Дата"
            style={{
              background: deadlineStr ? `rgba(${rgb}, 0.2)` : `rgba(${rgb}, 0.1)`,
              border: 'none', borderRadius: '0.5rem',
              cursor: 'pointer', padding: '4px 6px',
              color: overdue ? '#ef4444' : note.color,
              display: 'flex', alignItems: 'center',
            }}
          >
            <Calendar size={13} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Удалить"
            style={{
              background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '0.5rem',
              cursor: 'pointer', padding: '4px 6px', color: '#ef4444',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Date picker */}
      {showDatePicker && (
        <DatePicker
          value={deadlineStr}
          onChange={v => { onUpdate(note.id, { deadline: v } as any); if (v) setShowDatePicker(false); }}
          placeholder="Дата"
          clearable
        />
      )}

      {/* Deadline badge */}
      {deadlineStr && !showDatePicker && (
        <div style={{
          fontSize: '0.7rem', color: overdue ? '#ef4444' : note.color,
          background: overdue ? 'rgba(239,68,68,0.1)' : `rgba(${rgb}, 0.1)`,
          borderRadius: '0.4rem', padding: '2px 7px', alignSelf: 'flex-start',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Calendar size={10} />
          {deadlineStr}
          {overdue && ' • просрочено'}
        </div>
      )}

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => { setTitle(e.target.value); save(e.target.value, content); }}
          onClick={e => e.stopPropagation()}
          onBlur={() => { setEditing(false); onUpdate(note.id, { title, content }); }}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: '0.9rem', fontWeight: 700, width: '100%',
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.text, wordBreak: 'break-word', cursor: 'text' }}
        >
          {title || 'Без заголовка'}
        </div>
      )}

      {/* Content */}
      {editing ? (
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); save(title, e.target.value); }}
          onClick={e => e.stopPropagation()}
          onBlur={() => { setEditing(false); onUpdate(note.id, { title, content }); }}
          style={{
            background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            color: theme.textSecondary, fontSize: '0.825rem', lineHeight: 1.5,
            width: '100%', flex: 1, minHeight: 60,
          }}
          placeholder="Текст заметки..."
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{ fontSize: '0.825rem', color: theme.textSecondary, lineHeight: 1.5, flex: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap', cursor: 'text' }}
        >
          {content || <span style={{ opacity: 0.4 }}>Нажмите, чтобы добавить текст...</span>}
        </div>
      )}

      {/* Color dots — always visible */}
      <div style={{ display: 'flex', gap: '0.3rem', paddingTop: '0.5rem' }}>
        {NOTE_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onUpdate(note.id, { color: c })}
            style={{
              width: 14, height: 14, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
              outline: c === note.color ? `2px solid ${c}` : 'none',
              outlineOffset: 2,
              transition: 'transform 0.1s',
              transform: c === note.color ? 'scale(1.25)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Notes() {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const data = await api.getNotes();
      setNotes(data);
    } catch {
      toast.error('Не удалось загрузить заметки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const note = await api.createNote({ title: 'Новая заметка', content: '', color: NOTE_COLORS[0] });
      setNotes(prev => [note, ...prev]);
    } catch {
      toast.error('Ошибка создания заметки');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: number, data: Partial<Note>) => {
    try {
      const updated = await api.updateNote(id, data);
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handlePin = async (id: number) => {
    try {
      const updated = await api.toggleNotePin(id);
      setNotes(prev => {
        const list = prev.map(n => n.id === id ? updated : n);
        return [...list.filter(n => n.pinned), ...list.filter(n => !n.pinned)];
      });
    } catch {
      toast.error('Ошибка');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StickyNote size={26} style={{ color: theme.primary }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: 0 }}>Заметки</h1>
          <span style={{ fontSize: '0.8rem', color: theme.textSecondary, background: `rgba(${rgb},0.1)`, padding: '2px 8px', borderRadius: '99px' }}>
            {notes.length}
          </span>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.1rem', borderRadius: '0.75rem', border: 'none',
            background: `rgba(${rgb}, 0.15)`, color: theme.primary,
            cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem',
          }}
        >
          <Plus size={16} /> Новая заметка
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '3rem' }}>Загрузка...</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: theme.textSecondary }}>
          <StickyNote size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ margin: 0 }}>Заметок нет. Создайте первую!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
