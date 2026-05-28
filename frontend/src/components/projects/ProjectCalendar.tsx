import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { api, Task, Meeting } from '../../services/api';
import { ChevronLeft, ChevronRight, Clock, Video, Users, ExternalLink } from 'lucide-react';

type CalendarItem =
  | { kind: 'task'; date: Date; task: Task }
  | { kind: 'meeting'; date: Date; meeting: Meeting };

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const TASK_STATUS_LABEL: Record<string, string> = {
  NEW: 'Новая', TODO: 'Новая', IN_PROGRESS: 'В работе',
  IN_REVIEW: 'На проверке', DONE: 'Готово',
  COMPLETED: 'Завершена', CANCELLED: 'Отменена', BLOCKED: 'Заблокирована',
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный',
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#3b82f6', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

interface ProjectCalendarProps {
  projectId: number;
  tasks: Task[];
  onTaskClick: (taskId: number) => void;
}

export function ProjectCalendar({ projectId, tasks, onTaskClick }: ProjectCalendarProps) {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  const today = new Date();

  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    api.getProjectMeetings(projectId).then(setMeetings).catch(() => {});
  }, [projectId]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const items: CalendarItem[] = [
    ...tasks
      .filter(t => t.deadline || t.dueDate)
      .map(t => ({ kind: 'task' as const, date: new Date((t.deadline || t.dueDate)!), task: t })),
    ...meetings
      .filter(m => m.status !== 'CANCELLED')
      .map(m => ({ kind: 'meeting' as const, date: new Date(m.dateTime), meeting: m })),
  ];

  // Calendar grid (Monday-based)
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = Array(totalCells).fill(null).map((_, i) => {
    const d = i - startDow + 1;
    if (d < 1 || d > daysInMonth) return null;
    return new Date(year, month, d);
  });

  const itemsForDay = (day: Date) => items.filter(it => isSameDay(it.date, day));
  const selectedDayItems = selectedDay ? itemsForDay(selectedDay) : [];

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { color: '#6366f1', label: 'Дедлайн задачи' },
          { color: '#f59e0b', label: 'Встреча' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.8rem', color: theme.textSecondary }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={prevMonth} style={{ background: `rgba(${rgb},0.08)`, border: 'none', borderRadius: '0.625rem', padding: '0.5rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.text }}>{MONTHS_RU[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: `rgba(${rgb},0.08)`, border: 'none', borderRadius: '0.625rem', padding: '0.5rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.775rem', fontWeight: 600, color: theme.textSecondary, padding: '0.3rem 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} style={{ minHeight: 72, borderRadius: '0.75rem' }} />;
          const dayItems = itemsForDay(day);
          const isToday    = isSameDay(day, today);
          const isSelected = !!selectedDay && isSameDay(day, selectedDay);
          const isWeekend  = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              style={{
                minHeight: 72, borderRadius: '0.75rem', padding: '6px 8px', cursor: 'pointer',
                background: isSelected
                  ? `rgba(${rgb}, 0.18)`
                  : isToday ? `rgba(${rgb}, 0.09)` : `rgba(${rgb}, 0.03)`,
                border: isSelected
                  ? `1.5px solid rgba(${rgb}, 0.4)`
                  : isToday ? `1.5px solid rgba(${rgb}, 0.25)` : `1px solid rgba(${rgb}, 0.07)`,
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                fontSize: '0.8rem', fontWeight: isToday ? 800 : 500, marginBottom: '4px',
                color: isToday ? theme.primary : isWeekend ? `rgba(${rgb},0.5)` : theme.textSecondary,
              }}>
                {day.getDate()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayItems.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    title={item.kind === 'task' ? item.task.title : item.meeting.title}
                    style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      background: item.kind === 'task' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)',
                      color:      item.kind === 'task' ? '#6366f1'               : '#f59e0b',
                    }}
                  >
                    {item.kind === 'task' ? item.task.title : item.meeting.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div style={{ fontSize: '0.6rem', color: theme.textSecondary }}>
                    +{dayItems.length - 3} ещё
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (
        <div style={{
          marginTop: '1.5rem',
          background: `rgba(${rgb}, 0.06)`,
          border: `1px solid rgba(${rgb}, 0.15)`,
          borderRadius: '1rem', padding: '1.25rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: theme.text }}>
            {selectedDay.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {selectedDayItems.length === 0 ? (
            <p style={{ color: theme.textSecondary, margin: 0, fontSize: '0.875rem' }}>
              Нет событий на этот день
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {selectedDayItems.map((item, idx) =>
                item.kind === 'task' ? (
                  /* ── Task card ── */
                  <div
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(item.task.id); }}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: theme.text, fontWeight: 600, flex: 1 }}>
                        {item.task.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                        Задача
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.25rem', flexWrap: 'wrap' }}>
                      {item.task.assignedTo && (
                        <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                          👤 {item.task.assignedTo.firstName} {item.task.assignedTo.lastName}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: PRIORITY_COLOR[item.task.priority] ?? theme.textSecondary }}>
                        ↑ {PRIORITY_LABEL[item.task.priority] ?? item.task.priority}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                        {TASK_STATUS_LABEL[item.task.status] ?? item.task.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── Meeting card ── */
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: theme.text, fontWeight: 600, flex: 1 }}>
                        {item.meeting.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        Встреча
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', paddingLeft: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formatTime(item.meeting.dateTime)} · {item.meeting.durationMinutes} мин
                      </span>
                      <span style={{ fontSize: '0.75rem', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={12} /> {item.meeting.participants.length} участн.
                      </span>
                      {item.meeting.jitsiLink && (
                        <a
                          href={item.meeting.jitsiLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                        >
                          <Video size={12} /> Подключиться <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    {item.meeting.description && (
                      <p style={{ margin: '0.375rem 0 0 1.25rem', fontSize: '0.75rem', color: theme.textSecondary }}>
                        {item.meeting.description}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
