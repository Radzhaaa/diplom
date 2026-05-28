import { useState, useEffect } from 'react';
import { api, LeaderboardEntry, ProjectCompetitionEntry } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Trophy, Loader, Crown, Swords } from 'lucide-react';
import { getUserTitle } from '../../utils/avatarFrame';
import { AvatarWithFrame } from '../ui/AvatarWithFrame';

type TabType = 'users' | 'projects';

export function Leaderboard() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<TabType>('users');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [projects, setProjects] = useState<ProjectCompetitionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    setLoading(true);
    if (tab === 'users') {
      api.getLeaderboard(0, 50)
        .then(res => setEntries(res.content || []))
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    } else {
      api.getProjectCompetition()
        .then(setProjects)
        .catch(() => setProjects([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const medal = (rank: number) => {
    if (rank === 1) return <Crown size={18} style={{ color: '#fbbf24' }} />;
    if (rank === 2) return <Trophy size={18} style={{ color: '#94a3b8' }} />;
    if (rank === 3) return <Trophy size={18} style={{ color: '#f97316' }} />;
    return <span style={{ color: theme.textSecondary, fontSize: '0.875rem', fontWeight: 600 }}>#{rank}</span>;
  };

  const tabStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1.25rem', borderRadius: '0.65rem', border: 'none',
    background: active ? `rgba(${primaryRgb}, 0.15)` : 'transparent',
    color: active ? theme.primary : theme.textSecondary,
    outline: active ? `1px solid rgba(${primaryRgb}, 0.3)` : '1px solid transparent',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
  });

  const monthName = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: 0 }}>Лидерборд</h1>
        <p style={{ color: theme.textSecondary, marginTop: '0.25rem' }}>
          {tab === 'users' ? 'Рейтинг участников по XP' : `Командное соревнование — ${monthName}`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>
          <Trophy size={15} /> Участники
        </button>
        <button style={tabStyle(tab === 'projects')} onClick={() => setTab('projects')}>
          <Swords size={15} /> Проекты
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tab === 'users' ? (
        <div style={{ ...getGlassCardStyle(theme), overflow: 'hidden' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: theme.textSecondary }}>Нет данных</div>
          ) : entries.map((entry, i) => {
              const title = getUserTitle(entry.level ?? 1);
              return (
                <div key={entry.userId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: i < entries.length - 1 ? `1px solid rgba(${primaryRgb}, 0.08)` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = `rgba(${primaryRgb}, 0.05)`}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>{medal(entry.rank)}</div>
                  <AvatarWithFrame
                    size={40}
                    firstName={entry.firstName}
                    lastName={entry.lastName}
                    avatar={entry.avatar}
                    level={entry.level ?? 1}
                    primaryColor={theme.primary}
                    accentColor={theme.accent}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>{entry.firstName} {entry.lastName}</div>
                    <div style={{ color: theme.textSecondary, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: title.color, fontWeight: 600 }}>{title.emoji} {title.label}</span>
                      <span>· Ур.{entry.level} · {entry.completedTasks} задач</span>
                    </div>
                  </div>
                  <div style={{ color: theme.primary, fontWeight: 700, fontSize: '1.0625rem' }}>{entry.xp} XP</div>
                </div>
              );
            })}

        </div>
      ) : (
        /* Projects competition */
        <div>
          <div style={{ ...getGlassCardStyle(theme), padding: '1rem 1.5rem', marginBottom: '1rem', fontSize: '0.8125rem', color: theme.textSecondary }}>
            Суммарный XP за выполненные задачи в текущем месяце
          </div>
          <div style={{ ...getGlassCardStyle(theme), overflow: 'hidden' }}>
            {projects.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: theme.textSecondary }}>Нет данных за этот месяц</div>
            ) : projects.map((p, i) => {
              const maxXp = projects[0]?.totalXp || 1;
              const barPct = Math.max(4, (p.totalXp / maxXp) * 100);
              return (
                <div key={p.projectId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: i < projects.length - 1 ? `1px solid rgba(${primaryRgb}, 0.08)` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = `rgba(${primaryRgb}, 0.05)`}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>{medal(p.rank)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{p.projectName}</div>
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: `rgba(${primaryRgb}, 0.1)`, overflow: 'hidden' }}>
                      <div style={{ width: `${barPct}%`, height: '100%', background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {p.completedTasks} задач выполнено · {p.memberCount} участников
                    </div>
                  </div>
                  <div style={{ color: theme.primary, fontWeight: 700, fontSize: '1.0625rem', flexShrink: 0 }}>{p.totalXp} XP</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
