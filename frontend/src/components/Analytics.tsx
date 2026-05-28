import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api, Task, LeaderboardEntry, Project } from '../services/api';
import { hexToRgb, getGlassCardStyle } from '../utils/glassStyles';
import { AvatarWithFrame } from './ui/AvatarWithFrame';
import { BarChart3, Users, User, Loader, AlertTriangle, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  AreaChart, Area,
} from 'recharts';

import { PRIORITY_COLOR, STATUS_LABEL } from '../constants/taskConstants';

type Tab = 'personal' | 'team' | 'user';


export function Analytics() {
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

  const isAdmin = user?.role === 'ADMIN';
  const [isManager, setIsManager] = useState(isAdmin);

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promises: Promise<any>[] = [
      api.getTasks().then(t => {
        setAllTasks(t);
        const mine = t.filter(task =>
          task.assignedTo?.id === user?.id ||
          task.assigneeId === user?.id ||
          task.assigneeName?.toLowerCase().includes((user?.firstName ?? '').toLowerCase())
        );
        setTasks(mine);
      }),
    ];
    const checkManager = isAdmin
      ? Promise.resolve(true)
      : api.getProjects().then((projects: Project[]) =>
          projects.some((p: Project) => p.ownerId === user?.id)
        ).catch(() => false);
    promises.push(checkManager.then(canManage => {
      if (!canManage) return;
      setIsManager(true);
      return Promise.all([
        api.getLeaderboard(0, 200),
        isAdmin ? api.getProjects() : Promise.resolve([] as Project[]),
      ]).then(async ([lb, projects]) => {
        const adminProjects = isAdmin
          ? projects.filter((p: Project) => p.ownerId === user?.id)
          : [];
        const memberIdSets = await Promise.all(
          adminProjects.map((p: Project) =>
            api.getProjectMembersWithRoles(p.id)
              .then((members: any[]) => members.map((m: any) => m.id))
              .catch(() => [] as number[])
          )
        );
        const memberIds = new Set<number>(memberIdSets.flat());
        if (user?.id) memberIds.add(user.id);
        const filtered = lb.content.filter((e: LeaderboardEntry) => memberIds.has(e.userId));
        setLeaderboard(filtered);
      });
    }));
    if (false) { // suppress old block
      promises.push(
        Promise.all([
          api.getLeaderboard(0, 200),
          api.getProjects(),
        ]).then(async ([lb, projects]) => {
          const adminProjects = projects.filter((p: Project) => p.ownerId === user?.id);
          const memberIdSets = await Promise.all(
            adminProjects.map((p: Project) =>
              api.getProjectMembersWithRoles(p.id)
                .then((members: any[]) => members.map((m: any) => m.id))
                .catch(() => [] as number[])
            )
          );
          const memberIds = new Set<number>(memberIdSets.flat());
          if (user?.id) memberIds.add(user.id);

          const filtered = memberIds.size > 0
            ? lb.content.filter((e: LeaderboardEntry) => memberIds.has(e.userId))
            : lb.content;
          setLeaderboard(filtered);
        })
      );
    } // end suppress
    Promise.all(promises).finally(() => setLoading(false));
  }, [user?.id, isAdmin]);

  const TABS: { id: Tab; label: string; icon: React.ElementType; managerOnly?: boolean }[] = [
    { id: 'personal', label: 'Моя статистика', icon: User },
    { id: 'team',     label: 'Команда',         icon: Users, managerOnly: true },
    { id: 'user',     label: 'Участник',         icon: User,  managerOnly: true },
  ];

  const statusGroups: Record<string, number> = {};
  tasks.forEach(t => {
    statusGroups[t.status] = (statusGroups[t.status] ?? 0) + 1;
  });
  const statusData = Object.entries(statusGroups)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLORS[k] ?? '#6b7280' }));

  const completedCount = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const totalCount = tasks.length;

  const now = new Date();

  const overdueCount = tasks.filter(t =>
    t.deadline && new Date(t.deadline) < now &&
    t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  ).length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const tasksWithDeadline = tasks.filter(t => t.deadline && (t.status === 'DONE' || t.status === 'COMPLETED'));
  const onTime = tasksWithDeadline.filter(t => {
    if (!t.completedAt || !t.deadline) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  });
  const deadlineAdherence = tasksWithDeadline.length > 0 ? Math.round((onTime.length / tasksWithDeadline.length) * 100) : null;

  const velocityData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = tasks.filter(t =>
      (t.status === 'DONE' || t.status === 'COMPLETED') && t.completedAt?.startsWith(dateStr)
    ).length;
    return {
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
      count,
    };
  });

  const thisWeek = velocityData.slice(7).reduce((s, d) => s + d.count, 0);
  const lastWeek = velocityData.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const velocityTrend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  const burndownData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    d.setHours(23, 59, 59, 999);
    const remaining = tasks.filter(t => {
      const created = t.createdAt ? new Date(t.createdAt) : null;
      const completed = t.completedAt ? new Date(t.completedAt) : null;
      if (!created || created > d) return false; // not yet created
      if (completed && completed <= d) return false; // already completed
      return true;
    }).length;
    const ideal = i === 0 ? null : null; // ideal line placeholder
    return {
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
      remaining,
      ideal,
    };
  });
  const burndownStart = burndownData[0]?.remaining ?? 0;
  burndownData.forEach((d, i) => {
    d.ideal = Math.max(0, Math.round(burndownStart * (1 - i / 29)));
  });

  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingTasks = tasks
    .filter(t => t.deadline && new Date(t.deadline) >= now && new Date(t.deadline) <= in7days
      && t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const selectedUser = selectedUserId !== null
    ? leaderboard.find(e => e.userId === selectedUserId)
    : null;

  const selectedUserTasks = selectedUserId !== null
    ? allTasks.filter(t => t.assignedTo?.id === selectedUserId || t.assigneeId === selectedUserId)
    : [];

  const selectedStatusGroups: Record<string, number> = {};
  selectedUserTasks.forEach(t => {
    selectedStatusGroups[t.status] = (selectedStatusGroups[t.status] ?? 0) + 1;
  });
  const selectedStatusData = Object.entries(selectedStatusGroups)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABEL[k] ?? k, value: v, color: STATUS_COLORS[k] ?? '#6b7280' }));

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: '0 0 1.5rem' }}>Аналитика</h1>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.75rem',
        background: 'rgba(255,255,255,0.04)', borderRadius: '1rem',
        padding: '0.25rem', border: `1px solid rgba(${primaryRgb}, 0.1)`,
        width: 'fit-content',
      }}>
        {TABS.filter(t => !t.managerOnly || isManager).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                background: active ? `rgba(${primaryRgb}, 0.18)` : 'transparent',
                color: active ? theme.primary : theme.textSecondary,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loading && (
        <>
          {/* ── Personal Tab ── */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

              {/* ── MAIN CONTENT (left) ── */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Overdue alert */}
                {overdueCount > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1.25rem', borderRadius: '0.875rem',
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  }}>
                    <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9375rem' }}>
                      {overdueCount} просроченных {overdueCount === 1 ? 'задача' : overdueCount < 5 ? 'задачи' : 'задач'} — требуют внимания
                    </span>
                  </div>
                )}

                {/* Key metrics — 4 карточки в ряд */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { label: 'Всего задач', value: totalCount,      color: theme.primary,                                    icon: BarChart3,    bg: `rgba(${primaryRgb}, 0.1)` },
                    { label: 'Выполнено',   value: completedCount,  color: theme.primary,                                    icon: CheckCircle2, bg: `rgba(${primaryRgb}, 0.1)` },
                    { label: 'В работе',    value: inProgressCount, color: theme.accent,                                     icon: Clock,        bg: `rgba(${accentRgb}, 0.1)` },
                    { label: 'Просрочено',  value: overdueCount,    color: overdueCount > 0 ? '#ef4444' : theme.primary,     icon: AlertTriangle, bg: overdueCount > 0 ? 'rgba(239,68,68,0.1)' : `rgba(${primaryRgb}, 0.1)` },
                  ].map(({ label, value, color, icon: Icon, bg }) => (
                    <div key={label} style={{ ...getGlassCardStyle(theme), padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '1rem 1rem 0 0' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: theme.textSecondary, fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} style={{ color }} />
                        </div>
                      </div>
                      <div style={{ color: theme.text, fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Donut — задачи по статусам */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <BarChart3 size={16} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600 }}>Задачи по статусам</span>
                  </div>
                  {statusData.length === 0 ? (
                    <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem 0', fontSize: '0.875rem' }}>Нет задач</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={65} dataKey="value" paddingAngle={3}>
                            {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }} itemStyle={{ color: theme.text }} labelStyle={{ color: theme.text }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        {statusData.map((entry, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                            <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', flex: 1 }}>{entry.name}</span>
                            <span style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 700 }}>{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Velocity chart */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: theme.primary }} />
                      <span style={{ color: theme.text, fontWeight: 600 }}>Выполнено за 14 дней</span>
                    </div>
                    {velocityTrend !== null && (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                        background: velocityTrend >= 0 ? `rgba(${primaryRgb}, 0.15)` : 'rgba(239,68,68,0.15)',
                        color: velocityTrend >= 0 ? theme.primary : '#ef4444',
                      }}>
                        {velocityTrend >= 0 ? '+' : ''}{velocityTrend}% vs прошлая неделя
                      </span>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={velocityData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.08)`} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                      <YAxis tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }} itemStyle={{ color: theme.text }} labelStyle={{ color: theme.text }} cursor={{ fill: `rgba(${primaryRgb}, 0.08)` }} />
                      <Bar dataKey="count" name="Выполнено" fill={theme.primary} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Burndown chart */}
                {burndownData.some(d => d.remaining > 0) && (
                  <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <TrendingUp size={16} style={{ color: theme.primary }} />
                      <span style={{ color: theme.text, fontWeight: 600 }}>Бёрндаун — 30 дней</span>
                      <span style={{ fontSize: '0.72rem', color: theme.textSecondary, marginLeft: 'auto' }}>
                        оставшиеся задачи
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={burndownData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                        <defs>
                          <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.primary} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.08)`} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: theme.textSecondary, fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
                        <YAxis tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb},0.2)`, borderRadius: '0.75rem', fontSize: '0.8rem', color: theme.text }}
                          formatter={(value: number, name: string) => [value, name === 'remaining' ? 'Осталось' : 'Идеал']}
                        />
                        <Area type="monotone" dataKey="ideal" stroke={`rgba(${primaryRgb},0.3)`} strokeDasharray="4 3" strokeWidth={1.5} fill="none" dot={false} name="ideal" />
                        <Area type="monotone" dataKey="remaining" stroke={theme.primary} strokeWidth={2} fill="url(#burnFill)" dot={false} name="remaining" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{ width: 24, height: 2, background: theme.primary, borderRadius: 2 }} />
                        <span style={{ fontSize: '0.72rem', color: theme.textSecondary }}>Фактически</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{ width: 24, height: 2, background: `rgba(${primaryRgb},0.4)`, borderRadius: 2, borderTop: '2px dashed' }} />
                        <span style={{ fontSize: '0.72rem', color: theme.textSecondary }}>Идеальный темп</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SIDEBAR WIDGETS (right) ── */}
              <div style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Виджет: XP и уровень */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <User size={14} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem' }}>Прогресс</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.primary }}>Ур. {user?.level}</span>
                    <span style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>{user?.xp ?? 0} XP всего</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary, fontSize: '0.72rem', marginBottom: '0.375rem' }}>
                    <span>{(user?.xp ?? 0) % 1000} / 1000 XP</span>
                    <span>{Math.min(100, Math.round(((user?.xp ?? 0) % 1000) / 10))}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, width: `${Math.min(100, ((user?.xp ?? 0) % 1000) / 10)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Виджет: % выполнения */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <TrendingUp size={14} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem' }}>% выполнения</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.primary, marginBottom: '0.625rem' }}>
                    {completionRate}%
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', borderRadius: '99px', width: `${completionRate}%`, transition: 'width 0.6s ease', background: theme.primary }} />
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                    {completedCount} из {totalCount} задач выполнено
                  </div>
                </div>

                {/* Виджет: соблюдение дедлайнов */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={14} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem' }}>Дедлайны</span>
                  </div>
                  {deadlineAdherence === null ? (
                    <div style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Нет данных</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.primary, marginBottom: '0.625rem' }}>
                        {deadlineAdherence}%
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ height: '100%', borderRadius: '99px', width: `${deadlineAdherence}%`, transition: 'width 0.6s ease', background: theme.primary }} />
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                        {onTime.length} из {tasksWithDeadline.length} сданы вовремя
                      </div>
                    </>
                  )}
                </div>

                {/* Виджет: ближайшие дедлайны */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock size={14} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem' }}>Ближайшие дедлайны</span>
                  </div>
                  {upcomingTasks.length === 0 ? (
                    <div style={{ color: theme.textSecondary, fontSize: '0.8rem' }}>Дедлайнов на неделе нет</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {upcomingTasks.map(task => {
                        const daysLeft = Math.ceil((new Date(task.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const c = daysLeft === 0 ? '#ef4444' : daysLeft === 1 ? '#ef4444' : theme.accent;
                        return (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 3, height: 24, background: PRIORITY_COLOR[task.priority] ?? '#6b7280', borderRadius: 2, flexShrink: 0 }} />
                            <span style={{ color: theme.text, fontSize: '0.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c, background: `rgba(${hexToRgb(c)}, 0.15)`, padding: '2px 6px', borderRadius: '5px', flexShrink: 0 }}>
                              {daysLeft === 0 ? 'Сег.' : daysLeft === 1 ? 'Завт.' : `${daysLeft}д`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ── Team Tab ── */}
          {activeTab === 'team' && isManager && (() => {
            const teamTotal      = allTasks.length;
            const teamCompleted  = allTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
            const teamInProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
            const teamOverdue    = allTasks.filter(t =>
              t.deadline && new Date(t.deadline) < now &&
              t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
            ).length;
            const teamRate = teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0;

            const memberData = leaderboard.slice(0, 10).map(entry => {
              const memberTasks     = allTasks.filter(t => t.assignedTo?.id === entry.userId || t.assigneeId === entry.userId);
              const memberCompleted = memberTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
              const memberRate      = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0;
              return { ...entry, totalTasks: memberTasks.length, memberCompleted, memberRate };
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Сводные метрики */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { label: 'Участников',  value: leaderboard.length, icon: Users },
                    { label: 'Всего задач', value: teamTotal,           icon: BarChart3 },
                    { label: 'Выполнено',   value: `${teamRate}%`,      icon: CheckCircle2 },
                    { label: 'Просрочено',  value: teamOverdue,         icon: AlertTriangle, red: teamOverdue > 0 },
                  ].map(({ label, value, icon: Icon, red }) => (
                    <div key={label} style={{ ...getGlassCardStyle(theme), padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: red ? '#ef4444' : theme.primary, borderRadius: '1rem 1rem 0 0' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: theme.textSecondary, fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: red ? 'rgba(239,68,68,0.1)' : `rgba(${primaryRgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} style={{ color: red ? '#ef4444' : theme.primary }} />
                        </div>
                      </div>
                      <div style={{ color: red ? '#ef4444' : theme.text, fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Графики */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* XP рейтинг */}
                  <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <TrendingUp size={16} style={{ color: theme.primary }} />
                      <span style={{ color: theme.text, fontWeight: 600 }}>XP по участникам</span>
                    </div>
                    {leaderboard.length === 0 ? (
                      <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem 0', fontSize: '0.875rem' }}>Нет данных</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={leaderboard.slice(0, 8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.1)`} vertical={false} />
                          <XAxis dataKey="firstName" tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }} itemStyle={{ color: theme.text }} labelStyle={{ color: theme.text }} cursor={{ fill: `rgba(${primaryRgb}, 0.08)` }} />
                          <Bar dataKey="xp" name="XP" fill={theme.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Выполнено задач */}
                  <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} style={{ color: theme.primary }} />
                      <span style={{ color: theme.text, fontWeight: 600 }}>Выполнено задач</span>
                    </div>
                    {memberData.length === 0 ? (
                      <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem 0', fontSize: '0.875rem' }}>Нет данных</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={memberData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.1)`} vertical={false} />
                          <XAxis dataKey="firstName" tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: theme.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }} itemStyle={{ color: theme.text }} labelStyle={{ color: theme.text }} cursor={{ fill: `rgba(${primaryRgb}, 0.08)` }} />
                          <Bar dataKey="memberCompleted" name="Выполнено" fill={theme.accent} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Таблица участников */}
                <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Users size={16} style={{ color: theme.primary }} />
                    <span style={{ color: theme.text, fontWeight: 600 }}>Участники команды</span>
                  </div>
                  {memberData.length === 0 ? (
                    <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem 0', fontSize: '0.875rem' }}>Нет данных</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', overflowX: 'auto' }}>
                      {/* Заголовок */}
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 120px', gap: '1rem', padding: '0 1rem', marginBottom: '0.25rem', minWidth: 480 }}>
                        {['Участник', 'Уровень', 'Задач', 'Готово', 'Выполнение'].map(h => (
                          <span key={h} style={{ color: theme.textSecondary, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                        ))}
                      </div>
                      {memberData.map(entry => (
                        <div
                          key={entry.userId}
                          style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 120px', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s', minWidth: 480 }}
                          onClick={() => { setSelectedUserId(entry.userId); setActiveTab('user'); }}
                          onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.07)`)}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                            <AvatarWithFrame
                              size={32}
                              firstName={entry.firstName}
                              lastName={entry.lastName}
                              avatar={entry.avatar}
                              level={entry.level ?? 1}
                              primaryColor={theme.primary}
                              accentColor={theme.accent}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.firstName} {entry.lastName}</div>
                              <div style={{ color: theme.textSecondary, fontSize: '0.72rem' }}>{entry.role ?? 'Участник'}</div>
                            </div>
                          </div>
                          <div style={{ color: theme.primary, fontWeight: 700, fontSize: '0.875rem' }}>Ур. {entry.level}</div>
                          <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem' }}>{entry.totalTasks}</div>
                          <div style={{ color: theme.primary, fontWeight: 600, fontSize: '0.875rem' }}>{entry.memberCompleted}</div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: theme.textSecondary, fontSize: '0.72rem' }}>{entry.memberRate}%</span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: '99px', width: `${entry.memberRate}%`, background: theme.primary, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

          {/* ── User Tab ── */}
          {activeTab === 'user' && isManager && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* User selector */}
              <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                <label style={{ display: 'block', color: theme.textSecondary, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Выберите участника</label>
                <Select value={selectedUserId != null ? String(selectedUserId) : ''} onValueChange={v => setSelectedUserId(v ? Number(v) : null)}>
                  <SelectTrigger style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(${primaryRgb}, 0.18)`, color: theme.text, borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                    <SelectValue>
                      {selectedUserId != null
                        ? (() => { const e = leaderboard.find(e => e.userId === selectedUserId); return e ? `${e.firstName} ${e.lastName} (Ур. ${e.level})` : '— Выберите —'; })()
                        : '— Выберите —'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Выберите —</SelectItem>
                    {leaderboard.map(e => (
                      <SelectItem key={e.userId} value={String(e.userId)}>
                        {e.firstName} {e.lastName} (Ур. {e.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <>
                  {/* User info */}
                  <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                      <AvatarWithFrame
                        size={56}
                        firstName={selectedUser.firstName}
                        lastName={selectedUser.lastName}
                        avatar={selectedUser.avatar}
                        level={selectedUser.level ?? 1}
                        primaryColor={theme.primary}
                        accentColor={theme.accent}
                      />
                      <div>
                        <div style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem' }}>{selectedUser.firstName} {selectedUser.lastName}</div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>{selectedUser.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.875rem' }}>
                      {[
                        { label: 'Уровень',    value: selectedUser.level,          color: theme.primary },
                        { label: 'XP',         value: selectedUser.xp,             color: theme.primary },
                        { label: 'Выполнено',  value: selectedUser.completedTasks, color: theme.primary },
                        { label: 'Всего задач', value: selectedUserTasks.length,   color: theme.accent },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background: `rgba(${primaryRgb}, 0.07)`, borderRadius: '0.875rem', padding: '1rem' }}>
                          <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
                          <div style={{ color, fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks by status */}
                  {selectedStatusData.length > 0 && (
                    <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <BarChart3 size={16} style={{ color: theme.primary }} />
                        <span style={{ color: theme.text, fontWeight: 600 }}>Задачи участника</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <ResponsiveContainer width={130} height={130}>
                          <PieChart>
                            <Pie data={selectedStatusData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={3}>
                              {selectedStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }} itemStyle={{ color: theme.text }} labelStyle={{ color: theme.text }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
                          {selectedStatusData.map((entry, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                              <span style={{ color: theme.textSecondary, fontSize: '0.75rem', flex: 1 }}>{entry.name}</span>
                              <span style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: 600 }}>{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!selectedUser && (
                <div style={{ ...getGlassCardStyle(theme), padding: '4rem', textAlign: 'center' }}>
                  <User size={48} style={{ color: theme.textSecondary, margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ color: theme.textSecondary, fontSize: '0.9375rem' }}>Выберите участника для просмотра статистики</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
