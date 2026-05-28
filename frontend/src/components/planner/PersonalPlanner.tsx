import React, { useState, useEffect, useRef } from 'react';
import { api, Task, Meeting, Note } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import {
  ChevronLeft, ChevronRight, Clock, Video, StickyNote,
  CheckSquare, Circle, PenLine, Check, X, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, getDaysInMonth, startOfMonth, getDay, isToday as dfIsToday } from 'date-fns';
import { ru } from 'date-fns/locale';

const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAY_SHORT_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

const STATUS_COLOR: Record<string, string> = {
  TODO: '#6b7280', IN_PROGRESS: '#f59e0b', IN_REVIEW: '#8b5cf6',
  DONE: '#10b981', COMPLETED: '#10b981', BLOCKED: '#ef4444', CANCELLED: '#6b7280',
};
const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6',
};

export function PersonalPlanner() {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes,    setNotes]    = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getUserTasks().then(setTasks).catch(() => {});
    api.getMyMeetings().then(setMeetings).catch(() => {});
    api.getNotes().then(setNotes).catch(() => {});
  }, []);

  useEffect(() => {
    if (addingNote) setTimeout(() => noteRef.current?.focus(), 50);
  }, [addingNote]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(format(today, 'yyyy-MM-dd'));
  }

  const daysInMonth  = getDaysInMonth(new Date(viewYear, viewMonth));
  const firstWeekday = (getDay(startOfMonth(new Date(viewYear, viewMonth))) + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const meetingsByDate: Record<string, Meeting[]> = {};
  meetings.forEach(mt => {
    const d = mt.dateTime.substring(0, 10);
    if (!meetingsByDate[d]) meetingsByDate[d] = [];
    meetingsByDate[d].push(mt);
  });
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach(tk => {
    if (tk.deadline) {
      const d = tk.deadline.substring(0, 10);
      if (!tasksByDate[d]) tasksByDate[d] = [];
      tasksByDate[d].push(tk);
    }
  });
  const notesByDate: Record<string, Note[]> = {};
  notes.forEach(n => {
    if (n.deadline) {
      const d = n.deadline.substring(0, 10);
      if (!notesByDate[d]) notesByDate[d] = [];
      notesByDate[d].push(n);
    }
  });

  const dayMeetings = meetings.filter(m => m.dateTime.startsWith(selectedDate));
  const dayTasks    = tasks.filter(t => t.deadline?.startsWith(selectedDate));
  const dayNotes    = notes.filter(n => n.deadline?.startsWith(selectedDate));

  const selDateObj = new Date(selectedDate + 'T00:00:00');
  const selLabel   = format(selDateObj, 'd MMMM, EEEE', { locale: ru });

  async function addNote() {
    if (!noteInput.trim()) return;
    try {
      const created = await api.createNote({
        title: noteInput.trim(),
        content: '',
        color: '#10b981',
        deadline: selectedDate,
      } as any);
      setNotes(prev => [...prev, created]);
      setNoteInput('');
      setAddingNote(false);
      toast.success('Заметка добавлена');
    } catch {
      toast.error('Ошибка создания заметки');
    }
  }

  async function deleteNote(id: number) {
    setDeletingId(id);
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>

      {/* ─── Big Calendar ─── */}
      <div style={{ ...getGlassCardStyle(theme), borderRadius: '1.25rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <button type="button" onClick={prevMonth} style={{ background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.15)`, borderRadius: '0.6rem', cursor: 'pointer', color: theme.textSecondary, padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: theme.text }}>{MONTH_NAMES_RU[viewMonth]} {viewYear}</span>
            <button type="button" onClick={goToToday} style={{ padding: '0.25rem 0.8rem', borderRadius: '0.5rem', background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)`, color: theme.primary, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
              Сегодня
            </button>
          </div>
          <button type="button" onClick={nextMonth} style={{ background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.15)`, borderRadius: '0.6rem', cursor: 'pointer', color: theme.textSecondary, padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
          {DAY_SHORT_RU.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: theme.textSecondary, padding: '6px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ minHeight: '110px', borderRadius: '0.625rem' }} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSel = dateStr === selectedDate;
            const isNow = dfIsToday(new Date(viewYear, viewMonth, day));
            const pills = [
              ...(meetingsByDate[dateStr] ?? []).map(m => ({ key: `m-${m.id}`, label: `${format(parseISO(m.dateTime), 'HH:mm')} ${m.title}`, color: '#3b82f6', bg: 'rgba(59,130,246,0.18)' })),
              ...(tasksByDate[dateStr]    ?? []).map(t => ({ key: `t-${t.id}`, label: t.title, color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' })),
              ...(notesByDate[dateStr]   ?? []).map(n => ({ key: `n-${n.id}`, label: n.title, color: '#10b981', bg: 'rgba(16,185,129,0.18)' })),
            ];
            const MAX_PILLS = 3;
            const overflow  = pills.length - MAX_PILLS;
            return (
              <button key={i} type="button" onClick={() => setSelectedDate(dateStr)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem 0.5rem', minHeight: '110px', width: '100%', borderRadius: '0.625rem', border: isSel ? `2px solid ${theme.primary}` : isNow ? `2px solid rgba(${rgb},0.4)` : `1px solid rgba(${rgb},0.06)`, background: isSel ? `rgba(${rgb},0.12)` : isNow ? `rgba(${rgb},0.07)` : `rgba(${rgb},0.02)`, color: theme.text, cursor: 'pointer', transition: 'all 0.15s', outline: 'none', textAlign: 'left', gap: '3px', boxSizing: 'border-box' }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.07)`; }}
                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isNow ? `rgba(${rgb},0.07)` : `rgba(${rgb},0.02)`; }}
              >
                <span style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, marginBottom: '2px', background: isSel ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent', color: isSel ? '#fff' : isNow ? theme.primary : theme.text, fontWeight: isSel || isNow ? 700 : 400, fontSize: '0.82rem' }}>
                  {day}
                </span>
                {pills.slice(0, MAX_PILLS).map(pill => (
                  <div key={pill.key} style={{ width: '100%', padding: '1px 4px', borderRadius: '3px', background: pill.bg, color: isSel ? theme.text : pill.color, fontSize: '0.62rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '16px' }}>{pill.label}</div>
                ))}
                {overflow > 0 && <div style={{ fontSize: '0.6rem', color: theme.textSecondary, paddingLeft: '2px', marginTop: '1px' }}>+{overflow} ещё</div>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid rgba(${rgb},0.1)` }}>
          {[{ color: '#3b82f6', bg: 'rgba(59,130,246,0.18)', label: 'Встречи' }, { color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', label: 'Дедлайны' }, { color: '#10b981', bg: 'rgba(16,185,129,0.18)', label: 'Заметки' }].map(({ color, bg, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ padding: '1px 6px', borderRadius: '3px', background: bg, color, fontSize: '0.68rem', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Day agenda ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '5rem' }}>
        <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: theme.text, textTransform: 'capitalize' }}>{selLabel}</div>
          <div style={{ fontSize: '0.78rem', color: theme.textSecondary, marginTop: 2 }}>
            {dayMeetings.length + dayTasks.length + dayNotes.length === 0 ? 'Событий нет — свободный день 🎉' : `${dayMeetings.length + dayTasks.length + dayNotes.length} событий`}
          </div>
        </div>

        {dayMeetings.length > 0 && (
          <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Video size={12} style={{ color: '#3b82f6' }} /> Встречи
            </div>
            {dayMeetings.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0', borderBottom: `1px solid rgba(${rgb},0.07)` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.text }}>{m.title}</div>
                  <div style={{ fontSize: '0.72rem', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 2 }}>
                    <Clock size={10} /> {format(parseISO(m.dateTime), 'HH:mm')} · {m.durationMinutes} мин
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dayTasks.length > 0 && (
          <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckSquare size={12} style={{ color: '#f59e0b' }} /> Дедлайны задач
            </div>
            {dayTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0', borderBottom: `1px solid rgba(${rgb},0.07)` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[t.priority] ?? '#6b7280', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', background: `${STATUS_COLOR[t.status] ?? '#6b7280'}22`, color: STATUS_COLOR[t.status] ?? '#6b7280', fontWeight: 600, flexShrink: 0 }}>
                  {t.status === 'DONE' || t.status === 'COMPLETED' ? <Check size={10} /> : t.status === 'IN_PROGRESS' ? 'В работе' : 'Задача'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <StickyNote size={12} style={{ color: '#10b981' }} /> Заметки
          </div>
          {dayNotes.length === 0 && !addingNote && (
            <div style={{ fontSize: '0.8rem', color: theme.textSecondary, padding: '0.25rem 0 0.5rem' }}>Нет заметок на этот день</div>
          )}
          {dayNotes.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.45rem 0', borderBottom: `1px solid rgba(${rgb},0.07)` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color ?? '#10b981', flexShrink: 0, marginTop: 5 }} />
              <span style={{ flex: 1, fontSize: '0.875rem', color: theme.text, lineHeight: 1.4 }}>{n.title}</span>
              <button
                type="button"
                onClick={() => deleteNote(n.id)}
                disabled={deletingId === n.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: theme.textSecondary, flexShrink: 0, opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {addingNote ? (
            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem' }}>
              <input ref={noteRef} value={noteInput} onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addNote(); if (e.key === 'Escape') { setAddingNote(false); setNoteInput(''); } }}
                placeholder="Напишите заметку..."
                style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: `1px solid rgba(${rgb},0.3)`, background: `rgba(${rgb},0.06)`, color: theme.text, fontSize: '0.85rem', outline: 'none' }}
              />
              <button type="button" onClick={addNote} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}><Check size={13} /></button>
              <button type="button" onClick={() => { setAddingNote(false); setNoteInput(''); }} style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.15)`, color: theme.textSecondary, cursor: 'pointer' }}><X size={13} /></button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingNote(true)} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.7rem', borderRadius: '0.6rem', background: `rgba(${rgb},0.07)`, border: `1px solid rgba(${rgb},0.15)`, color: theme.textSecondary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, width: '100%', justifyContent: 'center' }}>
              <PenLine size={12} /> Добавить заметку
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
