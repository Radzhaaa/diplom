import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api, Task, Quest } from '../services/api';
import { hexToRgb } from '../utils/glassStyles';
import { STATUS_LABEL } from '../constants/taskConstants';
import { CheckSquare, FolderKanban, Trophy, Star, Flame, Sparkles, type LucideIcon } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { DashboardXpCard } from './dashboard/DashboardXpCard';
import { DashboardRecentTasks } from './dashboard/DashboardRecentTasks';
import { DashboardDeadlines } from './dashboard/DashboardDeadlines';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { DashboardDailyQuests } from './dashboard/DashboardDailyQuests';

interface DashboardProps {
  onNavigateToProject: (id: number) => void;
  onNavigateToProjects: () => void;
  onNavigateToTask?: (id: number) => void;
}

function getLast7Days(): { label: string; date: string }[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
    });
  }
  return days;
}

export function Dashboard({ onNavigateToProject: _onNavigateToProject, onNavigateToProjects, onNavigateToTask }: DashboardProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const accentRgb  = hexToRgb(theme.accent);

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

  const { projects } = useProjects(!!user);
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [rank, setRank]               = useState<number | null>(null);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);

  useEffect(() => {
    api.getTasks().then(t => { setTasks(t); setTasksLoaded(true); }).catch(() => setTasksLoaded(true));
    api.getLeaderboard(0, 100).then(lb => {
      const me = lb.content.find(e => e.userId === user?.id);
      if (me) setRank(me.rank);
    }).catch(() => {});
    api.getUserQuests()
      .then(q => setDailyQuests(q.filter(quest => quest.type === 'DAILY')))
      .catch(() => {});
  }, [user?.id]);

  const myTasks = tasks.filter(t =>
    t.assigneeId === user?.id ||
    t.assignedTo?.id === user?.id ||
    t.assigneeName?.toLowerCase().includes((user?.firstName ?? '').toLowerCase())
  );

  const statusGroups: Record<string, number> = {};
  myTasks.forEach(t => {
    const key = t.status === 'DONE' ? 'DONE' : t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO';
    statusGroups[key] = (statusGroups[key] ?? 0) + 1;
  });
  const donutData = Object.entries(statusGroups)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLORS[k] ?? '#6b7280' }));

  const days7 = getLast7Days();
  const barData = days7.map(({ label, date }) => ({
    label,
    value: tasks.filter(t =>
      (t.status === 'DONE' || t.status === 'COMPLETED') &&
      t.completedAt?.startsWith(date)
    ).length,
  }));

  const recentTasks = myTasks.slice(0, 4);

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = myTasks
    .filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d >= now && d <= in7days && t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
    })
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  const overdueTasks = myTasks.filter(t => {
    if (!t.deadline) return false;
    return new Date(t.deadline) < now && t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
  });

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="page-hero" style={{
        background: `linear-gradient(135deg, rgba(${primaryRgb},0.18) 0%, rgba(${accentRgb},0.10) 50%, rgba(${primaryRgb},0.05) 100%)`,
        borderBottom: `1px solid rgba(${primaryRgb},0.12)`,
      }}>
        <div className="hero-row">
          <div>
            <div
              className="hero-label"
              style={{
                background: `rgba(${primaryRgb}, 0.15)`,
                color: theme.primary,
                border: `1px solid rgba(${primaryRgb}, 0.25)`,
              }}
            >
              <Sparkles size={10} />
              Дашборд
            </div>
            <h1 className="hero-title" style={{ color: theme.text }}>
              Привет, {user?.firstName}!
            </h1>
            <p className="hero-sub" style={{ color: theme.textSecondary }}>
              Вот что происходит в твоих проектах
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {(user?.currentStreak ?? 0) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: '99px',
                background: 'rgba(251,146,60,0.15)',
                border: '1px solid rgba(251,146,60,0.3)',
              }}>
                <Flame size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fb923c' }}>
                  {user!.currentStreak} дн.
                </span>
              </div>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '99px',
              background: `rgba(${primaryRgb}, 0.12)`,
              border: `1px solid rgba(${primaryRgb}, 0.2)`,
            }}>
              <Star size={14} style={{ color: theme.primary }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: theme.primary }}>
                {user?.xp ?? 0} XP
              </span>
              <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
                · Ур. {user?.level ?? 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento Content ─────────────────────────────────── */}
      <div className="page-content">
        <div className="bento-grid bento-dashboard" style={{ marginBottom: '1.5rem' }}>

          <DashboardXpCard user={user} />

          <StatCard
            area="bento-stat-1"
            label="Мои задачи"
            value={tasksLoaded ? myTasks.length : '…'}
            Icon={CheckSquare}
            color={theme.primary}
            primaryRgb={primaryRgb}
            theme={theme}
          />

          <StatCard
            area="bento-stat-2"
            label="Проекты"
            value={projects.length || '…'}
            Icon={FolderKanban}
            color={theme.accent}
            primaryRgb={accentRgb}
            theme={theme}
          />

          <StatCard
            area="bento-stat-3"
            label="Место в рейтинге"
            value={rank !== null ? `#${rank}` : '…'}
            Icon={Trophy}
            color={theme.primary}
            primaryRgb={primaryRgb}
            theme={theme}
          />

          <DashboardRecentTasks
            tasks={recentTasks}
            onNavigateToProjects={onNavigateToProjects}
            onNavigateToTask={onNavigateToTask}
          />

          <DashboardDeadlines
            upcomingDeadlines={upcomingDeadlines}
            overdueTasks={overdueTasks}
          />

        </div>

        <DashboardCharts donutData={donutData} barData={barData} />

        <DashboardDailyQuests quests={dailyQuests} />

      </div>
    </>
  );
}

/* ── Stat Card ─────────────────────────────────────────────── */
function StatCard({ area, label, value, Icon, color, primaryRgb, theme }: {
  area: string;
  label: string;
  value: string | number;
  Icon: LucideIcon;
  color: string;
  primaryRgb: string;
  theme: any;
}) {
  return (
    <div
      className={`${area} stat-card-premium glass-card`}
      style={{
        background: `rgba(${primaryRgb}, 0.07)`,
        border: `1px solid rgba(${primaryRgb}, 0.16)`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 18px rgba(${primaryRgb}, 0.08)`,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '0.875rem',
        background: `rgba(${primaryRgb}, 0.18)`,
        border: `1px solid rgba(${primaryRgb}, 0.24)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '0.75rem',
        boxShadow: `0 0 16px rgba(${primaryRgb}, 0.2)`,
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="stat-card-premium-number" style={{ color: theme.text, textShadow: `0 0 30px rgba(${primaryRgb}, 0.3)` }}>
        {value}
      </div>
      <div className="stat-card-premium-label" style={{ color: theme.textSecondary }}>
        {label}
      </div>
    </div>
  );
}
