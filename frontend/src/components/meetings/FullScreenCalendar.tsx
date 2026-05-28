import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Task } from '../../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hexToRgb } from '../../utils/glassStyles';

interface FullScreenCalendarProps {
  tasks?: Task[];
  onTaskClick?: (taskId: number) => void;
  onDeadlineChange?: (taskId: number, newDate: Date) => Promise<void>;
}

export function FullScreenCalendar({ tasks = [], onTaskClick }: FullScreenCalendarProps) {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const primaryRgb = hexToRgb(theme.primary);

  const getTasksForDay = (day: Date) => tasks.filter(t => {
    const d = t.deadline || t.dueDate;
    return d && isSameDay(new Date(d), day);
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{ background: `rgba(${primaryRgb}, 0.1)`, border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: theme.text }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ color: theme.text, fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize' }}>
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </span>
        <button onClick={nextMonth} style={{ background: `rgba(${primaryRgb}, 0.1)`, border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: theme.text }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Week days header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
        {/* Empty cells before first day */}
        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} style={{
              background: today ? `rgba(${primaryRgb}, 0.15)` : `rgba(${hexToRgb(theme.surface)}, 0.4)`,
              border: `1px solid ${today ? `rgba(${primaryRgb}, 0.4)` : `rgba(${primaryRgb}, 0.08)`}`,
              borderRadius: '0.5rem',
              padding: '0.375rem',
              minHeight: '60px',
            }}>
              <div style={{ color: today ? theme.primary : theme.textSecondary, fontSize: '0.75rem', fontWeight: today ? 700 : 400, marginBottom: '4px' }}>
                {format(day, 'd')}
              </div>
              {dayTasks.slice(0, 2).map(t => (
                <div key={t.id} onClick={() => onTaskClick?.(t.id)}
                  style={{ fontSize: '0.65rem', color: theme.text, background: `rgba(${primaryRgb}, 0.2)`, borderRadius: '4px', padding: '1px 4px', marginBottom: '2px', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {t.title}
                </div>
              ))}
              {dayTasks.length > 2 && (
                <div style={{ fontSize: '0.6rem', color: theme.textSecondary }}>+{dayTasks.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
