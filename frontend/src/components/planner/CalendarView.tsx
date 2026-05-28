import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { api, Task, PersonalTask } from '../../services/api';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'project' | 'personal';
  status: string;
}

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView() {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [projectTasks, personalTasks] = await Promise.allSettled([
          api.getUserTasks(),
          api.getPersonalTasks(),
        ]);

        const evts: CalendarEvent[] = [];

        if (projectTasks.status === 'fulfilled') {
          for (const t of projectTasks.value as Task[]) {
            const d = t.deadline || t.dueDate;
            if (d) evts.push({ id: t.id, title: t.title, date: new Date(d), type: 'project', status: t.status });
          }
        }

        if (personalTasks.status === 'fulfilled') {
          for (const t of personalTasks.value as PersonalTask[]) {
            if (t.deadline) evts.push({ id: t.id, title: t.title, date: new Date(t.deadline), type: 'personal', status: t.status });
          }
        }

        setEvents(evts);
      } catch {
        toast.error('Ошибка загрузки событий');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1);
  // Monday-based: 0=Mon ... 6=Sun
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = Array(totalCells).fill(null).map((_, i) => {
    const d = i - startDow + 1;
    if (d < 1 || d > daysInMonth) return null;
    return new Date(year, month, d);
  });

  const eventsForDay = (day: Date) => events.filter(e => isSameDay(e.date, day));

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <CalendarDays size={26} style={{ color: theme.primary }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: 0 }}>Календарь</h1>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1' }} />
          <span style={{ fontSize: '0.8rem', color: theme.textSecondary }}>Проектные задачи</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} />
          <span style={{ fontSize: '0.8rem', color: theme.textSecondary }}>Личные задачи</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button
          onClick={prevMonth}
          style={{ background: `rgba(${rgb},0.08)`, border: 'none', borderRadius: '0.625rem', padding: '0.5rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.text }}>
          {MONTHS_RU[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          style={{ background: `rgba(${rgb},0.08)`, border: 'none', borderRadius: '0.625rem', padding: '0.5rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DAYS_RU.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.775rem', fontWeight: 600, color: theme.textSecondary, padding: '0.3rem 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '3rem' }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ minHeight: 72, borderRadius: '0.75rem' }} />;
            const dayEvents = eventsForDay(day);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 72, borderRadius: '0.75rem', padding: '6px 8px',
                  cursor: 'pointer',
                  background: isSelected
                    ? `rgba(${rgb}, 0.18)`
                    : isToday
                      ? `rgba(${rgb}, 0.09)`
                      : `rgba(${rgb}, 0.03)`,
                  border: isSelected
                    ? `1.5px solid rgba(${rgb}, 0.4)`
                    : isToday
                      ? `1.5px solid rgba(${rgb}, 0.25)`
                      : `1px solid rgba(${rgb}, 0.07)`,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  fontSize: '0.8rem', fontWeight: isToday ? 800 : 500,
                  color: isToday ? theme.primary : isWeekend ? `rgba(${rgb},0.5)` : theme.textSecondary,
                  marginBottom: '4px',
                }}>
                  {day.getDate()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dayEvents.slice(0, 3).map(evt => (
                    <div
                      key={`${evt.type}-${evt.id}`}
                      title={evt.title}
                      style={{
                        fontSize: '0.65rem', fontWeight: 600,
                        padding: '1px 5px', borderRadius: '4px',
                        background: evt.type === 'project' ? 'rgba(99,102,241,0.2)' : 'rgba(139,92,246,0.2)',
                        color: evt.type === 'project' ? '#6366f1' : '#8b5cf6',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: '0.6rem', color: theme.textSecondary }}>+{dayEvents.length - 3} ещё</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected day panel */}
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
          {selectedDayEvents.length === 0 ? (
            <p style={{ color: theme.textSecondary, margin: 0, fontSize: '0.875rem' }}>Нет задач на этот день</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedDayEvents.map(evt => (
                <div
                  key={`${evt.type}-${evt.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.875rem', borderRadius: '0.625rem',
                    background: evt.type === 'project' ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)',
                    border: evt.type === 'project' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: evt.type === 'project' ? '#6366f1' : '#8b5cf6', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: theme.text, fontWeight: 500 }}>{evt.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: theme.textSecondary }}>
                    {evt.type === 'project' ? 'Проект' : 'Личная'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
