import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { PRIORITY_COLOR, STATUS_LABEL } from '../../constants/taskConstants';
import type { Task } from '../../services/api';

interface Props {
  tasks: Task[];
  onNavigateToProjects: () => void;
  onNavigateToTask?: (id: number) => void;
}

export function DashboardRecentTasks({ tasks, onNavigateToProjects, onNavigateToTask }: Props) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const STATUS_COLORS: Record<string, string> = {
    TODO:        '#64748b',
    NEW:         '#64748b',
    IN_PROGRESS: theme.accent,
    IN_REVIEW:   theme.primary,
    DONE:        theme.primary,
    COMPLETED:   theme.primary,
    BLOCKED:     '#ef4444',
    CANCELLED:   '#6b7280',
  };

  return (
    <div className="bento-tasks glass-card" style={{ padding: '1.375rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} style={{ color: theme.primary }} />
          <span className="section-heading" style={{ color: theme.text }}>Последние задачи</span>
        </div>
        <button
          onClick={onNavigateToProjects}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}
        >
          Все <ArrowRight size={13} />
        </button>
      </div>
      {tasks.length === 0 ? (
        <div style={{ color: theme.textSecondary, fontSize: '0.875rem', padding: '0.75rem', textAlign: 'center', opacity: 0.7 }}>
          Нет активных задач
        </div>
      ) : tasks.map(task => (
        <div
          key={task.id}
          onClick={() => onNavigateToTask?.(task.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '0.5rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            cursor: onNavigateToTask ? 'pointer' : 'default',
          }}
        >
          <div
            className="task-priority-line"
            style={{ background: PRIORITY_COLOR[task.priority] ?? '#475569' }}
          />
          <span style={{ color: theme.text, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
            background: `rgba(${hexToRgb(STATUS_COLORS[task.status] ?? '#6b7280')}, 0.15)`,
            color: STATUS_COLORS[task.status] ?? theme.textSecondary,
          }}>
            {STATUS_LABEL[task.status] ?? task.status}
          </span>
        </div>
      ))}
    </div>
  );
}
