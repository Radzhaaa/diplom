import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { Clock, AlertTriangle } from 'lucide-react';
import { PRIORITY_COLOR } from '../../constants/taskConstants';
import type { Task } from '../../services/api';

interface Props {
  upcomingDeadlines: Task[];
  overdueTasks: Task[];
}

export function DashboardDeadlines({ upcomingDeadlines, overdueTasks }: Props) {
  const { theme } = useTheme();

  const now = new Date();

  const overdueSlice = [...overdueTasks]
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);
  const allItems = [...overdueSlice, ...upcomingDeadlines];

  return (
    <div className="bento-quick glass-card" style={{ padding: '1.375rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} style={{ color: theme.primary }} />
          <span className="section-heading" style={{ color: theme.text }}>Ближайшие дедлайны</span>
        </div>
        {overdueTasks.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
          }}>
            <AlertTriangle size={10} />
            {overdueTasks.length} просрочено
          </span>
        )}
      </div>
      {allItems.length === 0 ? (
        <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0', opacity: 0.6 }}>
          Дедлайнов в ближайшие 7 дней нет
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {allItems.map(task => {
            const d = new Date(task.deadline!);
            const isOverdue = d < now;
            const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isToday = !isOverdue && daysLeft === 0;
            const isTomorrow = !isOverdue && daysLeft === 1;
            const daysOverdue = isOverdue ? Math.ceil((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const dateLabel = isOverdue
              ? (daysOverdue === 0 ? 'Сегодня' : `-${daysOverdue}д`)
              : isToday ? 'Сегодня'
              : isTomorrow ? 'Завтра'
              : `${daysLeft}д`;
            const urgentColor = isOverdue ? '#ef4444' : isToday ? '#ef4444' : isTomorrow ? '#f97316' : '#f59e0b';
            const pc = PRIORITY_COLOR[task.priority] ?? '#6b7280';
            return (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.5rem 0.625rem', borderRadius: '0.75rem',
                background: isOverdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                border: isOverdue ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ width: 3, height: 32, background: isOverdue ? '#ef4444' : pc, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ color: isOverdue ? '#ef4444' : theme.text, fontSize: '0.8125rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px',
                  background: `rgba(${hexToRgb(urgentColor)}, 0.15)`, color: urgentColor, flexShrink: 0,
                }}>
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
