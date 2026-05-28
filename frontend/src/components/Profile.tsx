import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../utils/glassStyles';
import { Zap, Trophy, ArrowRight, Crown, Lock, Flame, Settings, Plus, Trash2 } from 'lucide-react';
import { api, Achievement, LeaderboardEntry, Skill } from '../services/api';
import { getUserTitle, getStreakBadge } from '../utils/avatarFrame';
import { AvatarWithFrame } from './ui/AvatarWithFrame';
import { Settings as SettingsPage } from './Settings';

interface ProfileProps {
  onNavigateToSkills?: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToLeaderboard: () => void;
}

export function Profile({ onNavigateToAchievements, onNavigateToLeaderboard }: ProfileProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillLoading, setSkillLoading] = useState(false);

  useEffect(() => {
    api.getUserAchievements().then(setAchievements).catch(() => {});
    api.getLeaderboard(0, 5).then(res => setLeaderboard(res.content || [])).catch(() => {});
    api.getSkills().then(setSkills).catch(() => {});
  }, []);

  if (!user) return null;

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setSkillLoading(true);
    try {
      const skill = await api.addSkill({ name: newSkill.trim() });
      setSkills(prev => [...prev, skill]);
      setNewSkill('');
    } catch {}
    setSkillLoading(false);
  };

  const handleDeleteSkill = async (id?: number) => {
    if (!id) return;
    try {
      await api.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked || a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlocked && !a.unlockedAt);

  const medal = (rank: number) => {
    if (rank === 1) return <Crown size={14} style={{ color: '#fbbf24' }} />;
    if (rank === 2) return <Trophy size={14} style={{ color: '#94a3b8' }} />;
    if (rank === 3) return <Trophy size={14} style={{ color: '#f97316' }} />;
    return <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>#{rank}</span>;
  };

  const userLevel = user.level ?? 1;
  const userStreak = user.currentStreak ?? 0;
  const title = getUserTitle(userLevel);
  const streakBadge = getStreakBadge(userStreak);

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      {/* Header + tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: 0 }}>
          {activeTab === 'profile' ? 'Профиль' : 'Настройки'}
        </h1>
        <div style={{
          display: 'flex', gap: '2px',
          background: `rgba(${primaryRgb}, 0.06)`,
          border: `1px solid rgba(${primaryRgb}, 0.12)`,
          borderRadius: '0.875rem',
          padding: '3px',
        }}>
          {(['profile', 'settings'] as const).map((id) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.4rem 1rem', borderRadius: '0.625rem', border: 'none',
                  fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                  background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent',
                  color: active ? '#fff' : theme.textSecondary,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: active ? `0 2px 8px rgba(${primaryRgb},0.3)` : 'none',
                }}
              >
                {id === 'settings' && <Settings size={13} />}
                {id === 'profile' ? 'Профиль' : 'Настройки'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings tab */}
      {activeTab === 'settings' && <SettingsPage embedded />}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Info card (view-only) */}
            <div style={{ ...getGlassCardStyle(theme), padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <AvatarWithFrame
                  size={72}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  avatar={user.avatar}
                  level={userLevel}
                  streak={userStreak}
                  primaryColor={theme.primary}
                  accentColor={theme.accent}
                />
                <div>
                  <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.25rem' }}>
                    {user.firstName} {user.lastName}
                  </h2>
                  {/* Title + streak badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: title.color }}>
                      {title.emoji} {title.label}
                    </span>
                    {streakBadge && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '1px 8px', borderRadius: '9999px', background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
                        {streakBadge}
                      </span>
                    )}
                  </div>
                  {user.position && (
                    <p style={{ color: theme.textSecondary, fontSize: '0.8rem', margin: '0 0 0.2rem', fontWeight: 500 }}>{user.position}</p>
                  )}
                  <p style={{ color: theme.textSecondary, fontSize: '0.78rem', margin: '0 0 0.5rem' }}>{user.email}</p>
                  <span style={{
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 600,
                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                    background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary,
                  }}>
                    {user.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {user.bio && (
                <p style={{ color: theme.textSecondary, fontSize: '0.875rem', lineHeight: 1.6, marginTop: '1rem', marginBottom: 0 }}>
                  {user.bio}
                </p>
              )}
              <p style={{ color: theme.textSecondary, fontSize: '0.8rem', marginTop: '1rem', marginBottom: 0, opacity: 0.6 }}>
                Для редактирования перейдите во вкладку <strong style={{ color: theme.primary }}>Настройки</strong>
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Уровень', value: user.level ?? 1,                      icon: Trophy, color: theme.primary },
                { label: 'XP',      value: user.totalXp ?? user.xp ?? 0,         icon: Zap,    color: theme.primary },
                ...((user.currentStreak ?? 0) > 0 ? [{ label: 'Серия', value: `${user.currentStreak} дн.`, icon: Flame, color: '#fb923c' }] : []),
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.textSecondary, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                    <Icon size={16} style={{ color }} /> {label}
                  </div>
                  <div style={{ color: theme.text, fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Skills inline */}
            <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={16} style={{ color: theme.primary }} />
                <span style={{ color: theme.text, fontWeight: 700, fontSize: '1rem' }}>Навыки</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: `rgba(${primaryRgb},0.12)`, color: theme.primary }}>
                  {skills.length}
                </span>
              </div>
              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  placeholder="Добавить навык..."
                  style={{
                    flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.625rem',
                    border: `1px solid rgba(${primaryRgb}, 0.2)`,
                    background: `rgba(${primaryRgb}, 0.05)`,
                    color: theme.text, fontSize: '0.875rem', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={skillLoading || !newSkill.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: 'none',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    opacity: skillLoading || !newSkill.trim() ? 0.5 : 1,
                  }}
                >
                  <Plus size={14} />
                </button>
              </form>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: `rgba(${primaryRgb}, 0.1)`,
                      border: `1px solid rgba(${primaryRgb}, 0.2)`,
                      borderRadius: '9999px', padding: '0.3rem 0.75rem',
                      color: theme.text, fontSize: '0.8125rem',
                    }}
                  >
                    <Zap size={11} style={{ color: theme.primary, flexShrink: 0 }} />
                    {s.name}
                    <button
                      onClick={() => handleDeleteSkill(s.id)}
                      style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.5, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0 }}>Навыков нет. Добавьте первый!</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Widgets ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Достижения */}
            <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button
                  onClick={onNavigateToAchievements}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <h3 style={{ color: theme.text, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Достижения</h3>
                  <ArrowRight size={14} style={{ color: theme.primary }} />
                </button>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: `rgba(${primaryRgb}, 0.12)`, color: theme.primary }}>
                  {unlockedAchievements.length} / {achievements.length}
                </span>
              </div>
              {achievements.length === 0 ? (
                <div style={{ textAlign: 'center', color: theme.textSecondary, fontSize: '0.8125rem', padding: '0.75rem 0' }}>Загрузка...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {[...unlockedAchievements, ...lockedAchievements].slice(0, 6).map(a => {
                    const isUnlocked = a.unlocked || !!a.unlockedAt;
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', opacity: isUnlocked ? 1 : 0.4 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0, background: isUnlocked ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isUnlocked ? <Trophy size={15} style={{ color: '#fff' }} /> : <Lock size={14} style={{ color: theme.textSecondary }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                          <div style={{ color: theme.primary, fontSize: '0.6875rem', fontWeight: 600 }}>+{a.xpReward} XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Рейтинг */}
            <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <button
                    onClick={onNavigateToLeaderboard}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <h3 style={{ color: theme.text, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Рейтинг</h3>
                    <ArrowRight size={14} style={{ color: theme.primary }} />
                  </button>
                  <p style={{ color: theme.textSecondary, fontSize: '0.75rem', margin: '2px 0 0' }}>Топ участников по XP</p>
                </div>
              </div>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', color: theme.textSecondary, fontSize: '0.8125rem', padding: '0.75rem 0' }}>Загрузка...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {leaderboard.map(entry => (
                    <div key={entry.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>{medal(entry.rank)}</div>
                      <AvatarWithFrame
                        size={30}
                        firstName={entry.firstName}
                        lastName={entry.lastName}
                        avatar={entry.avatar}
                        level={entry.level}
                        primaryColor={theme.primary}
                        accentColor={theme.accent}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.firstName} {entry.lastName}
                        </div>
                        <div style={{ color: theme.textSecondary, fontSize: '0.6875rem' }}>Ур. {entry.level}</div>
                      </div>
                      <div style={{ color: theme.primary, fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>{entry.xp} XP</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
