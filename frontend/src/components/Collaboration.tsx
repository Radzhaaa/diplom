import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getGlassCardStyle, hexToRgb } from '../utils/glassStyles';
import { api, Notification, Project, BACKEND_ORIGIN } from '../services/api';
import { Users, Bell, FolderOpen, CheckSquare, MessageSquare, UserPlus, Activity, ArrowRight, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CollaborationProps {
  onNavigateToProjects: () => void;
  onNavigateToProjectDetail: (id: number) => void;
}

function ActivityIcon({ type }: { type: string }) {
  const t = (type || '').toUpperCase();
  if (t.includes('TASK') || t.includes('COMPLETE')) return <CheckSquare size={16} />;
  if (t.includes('COMMENT')) return <MessageSquare size={16} />;
  if (t.includes('MEMBER') || t.includes('INVITE') || t.includes('JOIN')) return <UserPlus size={16} />;
  if (t.includes('PROJECT')) return <FolderOpen size={16} />;
  if (t.includes('ACHIEVEM')) return <Trophy size={16} />;
  return <Bell size={16} />;
}

function iconColor(type: string) {
  const t = (type || '').toUpperCase();
  if (t.includes('TASK') || t.includes('COMPLETE')) return '#10b981';
  if (t.includes('COMMENT')) return '#6366f1';
  if (t.includes('MEMBER') || t.includes('INVITE') || t.includes('JOIN')) return '#f59e0b';
  if (t.includes('PROJECT')) return '#3b82f6';
  if (t.includes('ACHIEVEM')) return '#f59e0b';
  return '#6b7280';
}

export function Collaboration({ onNavigateToProjects, onNavigateToProjectDetail }: CollaborationProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const primaryRgb = hexToRgb(theme.primary);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getNotifications().catch(() => [] as Notification[]),
      api.getProjects().catch(() => [] as Project[]),
    ]).then(([notifs, projs]) => {
      setNotifications(notifs.slice(0, 20));
      setProjects(projs.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Проектов', value: projects.length, icon: FolderOpen, color: '#3b82f6' },
    { label: 'Активностей', value: notifications.length, icon: Activity, color: '#10b981' },
    {
      label: 'Непрочитанных',
      value: notifications.filter(n => !n.isRead).length,
      icon: Bell,
      color: '#f59e0b',
    },
  ];

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: '0 0 1.5rem' }}>Совместная работа</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.textSecondary, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
              <Icon size={15} style={{ color }} /> {label}
            </div>
            <div style={{ color: theme.text, fontSize: '1.75rem', fontWeight: 700 }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Activity feed */}
        <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={18} style={{ color: theme.primary }} />
            <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Лента активности</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem' }}>Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem', opacity: 0.6 }}>
              Активности пока нет
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map(n => {
                const color = iconColor(n.type);
                return (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                      padding: '0.875rem', borderRadius: '0.875rem',
                      background: !n.isRead ? `rgba(${primaryRgb}, 0.05)` : 'rgba(255,255,255,0.02)',
                      border: !n.isRead ? `1px solid rgba(${primaryRgb}, 0.12)` : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '0.75rem', flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}>
                      <ActivityIcon type={n.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: n.isRead ? 400 : 600, fontSize: '0.875rem', marginBottom: '0.125rem' }}>
                        {n.title}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.6 }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ru })}
                      </div>
                    </div>
                    {!n.isRead && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: theme.primary, flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderOpen size={16} style={{ color: theme.primary }} />
                <h3 style={{ color: theme.text, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Мои проекты</h3>
              </div>
              <button
                onClick={onNavigateToProjects}
                style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Все <ArrowRight size={12} />
              </button>
            </div>
            {projects.length === 0 ? (
              <div style={{ color: theme.textSecondary, fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0', opacity: 0.6 }}>
                {loading ? 'Загрузка...' : 'Нет проектов'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onNavigateToProjectDetail(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', borderRadius: '0.875rem', border: 'none',
                      background: `rgba(${primaryRgb}, 0.04)`, cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '0.625rem', flexShrink: 0,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: '0.75rem',
                    }}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                        {p.taskCount ?? 0} задач · {p.memberCount ?? 0} участников
                      </div>
                    </div>
                    {p.progress !== undefined && (
                      <div style={{ color: theme.primary, fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                        {Math.round(p.progress)}%
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current user card */}
          <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <Users size={16} style={{ color: theme.primary }} />
              <h3 style={{ color: theme.text, fontWeight: 700, fontSize: '1rem', margin: 0 }}>Я в команде</h3>
            </div>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: '#fff',
                  overflow: 'hidden',
                }}>
                  {user.avatar
                    ? <img src={user.avatar.startsWith('http') ? user.avatar : BACKEND_ORIGIN + user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
                  }
                </div>
                <div>
                  <div style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>{user.email}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: theme.primary, fontWeight: 600 }}>Ур. {user.level}</span>
                    <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>·</span>
                    <span style={{ fontSize: '0.75rem', color: '#eab308', fontWeight: 600 }}>{user.xp} XP</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
