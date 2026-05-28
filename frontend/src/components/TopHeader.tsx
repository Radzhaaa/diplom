import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { hexToRgb } from '../utils/glassStyles';
import { Bell, Users, ChevronDown, User, LogOut, UserPlus, CalendarDays, Sun, Moon, Palette, Menu, Timer, Square } from 'lucide-react';
import { BACKEND_ORIGIN, api } from '../services/api';
import { useActiveTimer } from '../contexts/ActiveTimerContext';
import { AvatarWithFrame } from './ui/AvatarWithFrame';

const THEME_SWATCHES = [
  { name: 'indigo', color: '#6366f1', label: 'Индиго' },
  { name: 'blue',   color: '#3b82f6', label: 'Синий'  },
  { name: 'green',  color: '#10b981', label: 'Зелёный' },
  { name: 'purple', color: '#a855f7', label: 'Фиолетовый' },
  { name: 'orange', color: '#f97316', label: 'Оранжевый'  },
  { name: 'red',    color: '#ef4444', label: 'Красный' },
];

type View = 'dashboard' | 'projects' | 'quests' | 'profile' |
  'project-detail' | 'new-project' | 'skills' | 'add-task' | 'add-member' | 'analytics' |
  'settings' | 'ai-assistant' | 'collaboration' | 'tasks' | 'task-archive' | 'invite' |
  'achievements' | 'leaderboard' | 'chat' | 'organizations' | 'planner';

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Дашборд',
  projects: 'Проекты',
  tasks: 'Задачи',
  quests: 'Квесты',
  analytics: 'Аналитика',
  'ai-assistant': 'AI-помощник',
  profile: 'Профиль',
  settings: 'Настройки',
  collaboration: 'Совместная работа',
  'task-archive': 'Архив задач',
  'project-detail': 'Детали проекта',
  'new-project': 'Новый проект',
  skills: 'Навыки',
  'add-task': 'Новая задача',
  'add-member': 'Добавить участника',
  'invite': 'Пригласить участника',
  'planner': 'Планировщик',
};

interface TopHeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onNavigateToTask?: (taskId: number) => void;
  onNavigateToProject?: (projectId: number) => void;
  onMobileMenuToggle?: () => void;
  isMobile?: boolean;
}

export function TopHeader({ currentView, onViewChange, onNavigateToTask, onNavigateToProject, onMobileMenuToggle, isMobile }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, themeName, setTheme, lightMode, setLightMode } = useTheme();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { activeTimer, elapsedSeconds, clearTimer } = useActiveTimer();
  const primaryRgb = hexToRgb(theme.primary);

  const fmtElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStopGlobalTimer = async () => {
    if (!activeTimer) return;
    try {
      await api.stopTimer(activeTimer.taskId);
      clearTimer();
    } catch {}
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const collabRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (collabRef.current && !collabRef.current.contains(e.target as Node)) setShowCollab(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemePicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const breadcrumb = VIEW_LABELS[currentView] ?? 'XProject';


  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 220,
    background: lightMode ? '#ffffff' : theme.surface,
    border: `1px solid rgba(${primaryRgb}, 0.22)`,
    borderRadius: '1rem',
    boxShadow: `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(${primaryRgb}, 0.08)`,
    zIndex: 9999,
    overflow: 'hidden',
  };

  const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.625rem 1rem',
    color: theme.text,
    fontSize: '0.875rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.15s',
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 256, // sidebar width
        right: 0,
        height: 56,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        background: `rgba(${hexToRgb(theme.surface)}, 0.7)`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid rgba(${primaryRgb}, 0.10)`,
        boxShadow: `0 1px 24px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Breadcrumb + mobile hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isMobile && (
          <button
            onClick={onMobileMenuToggle}
            style={{
              width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(${primaryRgb},0.12)`,
              cursor: 'pointer', color: theme.textSecondary,
            }}
          >
            <Menu size={18} />
          </button>
        )}
        <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', opacity: 0.6 }}>XProject</span>
        <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', opacity: 0.4 }}>/</span>
        <span style={{ color: theme.text, fontSize: '0.9375rem', fontWeight: 600 }}>{breadcrumb}</span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

        {/* Light / Dark toggle */}
        <button
          onClick={() => setLightMode(!lightMode)}
          title={lightMode ? 'Тёмная тема' : 'Светлая тема'}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
            border: `1.5px solid rgba(${primaryRgb}, 0.5)`,
            boxShadow: `0 0 12px rgba(${primaryRgb}, 0.4), 0 2px 8px rgba(0,0,0,0.2)`,
            cursor: 'pointer',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            flexShrink: 0,
          }}
        >
          {lightMode
            ? <Sun size={16} color="#fff" style={{ filter: `drop-shadow(0 0 4px rgba(${primaryRgb},0.8))` }} />
            : <Moon size={15} color="#fff" style={{ filter: `drop-shadow(0 0 4px rgba(${primaryRgb},0.8))` }} />
          }
        </button>

        {/* Color theme picker */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowThemePicker(v => !v); setShowNotifications(false); setShowCollab(false); setShowProfile(false); }}
            title="Цветовая схема"
            style={{
              width: 36, height: 36, borderRadius: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showThemePicker ? `rgba(${primaryRgb}, 0.18)` : 'rgba(255,255,255,0.05)',
              border: `1.5px solid rgba(${primaryRgb}, ${showThemePicker ? '0.4' : '0.12'})`,
              boxShadow: showThemePicker ? `0 0 12px rgba(${primaryRgb}, 0.25)` : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Palette size={16} style={{ color: theme.primary }} />
          </button>

          {showThemePicker && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              background: lightMode ? '#ffffff' : theme.surface,
              border: `1px solid rgba(${primaryRgb}, 0.2)`,
              borderRadius: '1.125rem',
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(${primaryRgb}, 0.06)`,
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              padding: '1rem',
              zIndex: 200,
              minWidth: 220,
              animation: 'scale-in 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <div style={{ color: lightMode ? '#0f172a' : theme.textSecondary, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '0.75rem', paddingLeft: 2 }}>
                Цветовая схема
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {THEME_SWATCHES.map(({ name, color, label }) => {
                  const isActive = themeName === name;
                  return (
                    <button
                      key={name}
                      onClick={() => { setTheme(name); setShowThemePicker(false); }}
                      title={label}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.25rem',
                        borderRadius: '0.75rem',
                        background: isActive ? `rgba(${hexToRgb(color)}, 0.15)` : 'transparent',
                        border: isActive ? `2px solid ${color}` : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        outline: 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = `rgba(${hexToRgb(color)}, 0.1)`; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`,
                        boxShadow: isActive ? `0 0 10px ${color}80, 0 0 20px ${color}40` : `0 2px 6px ${color}60`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {isActive && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: isActive ? 700 : 500, color: isActive ? color : (lightMode ? '#475569' : theme.textSecondary), transition: 'color 0.18s' }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active timer widget */}
        {activeTimer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '0.625rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <Timer size={13} style={{ color: '#4ade80' }} />
            <span style={{ color: '#4ade80', fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '3.5rem' }}>
              {fmtElapsed(elapsedSeconds)}
            </span>
            <button
              onClick={handleStopGlobalTimer}
              title="Остановить таймер"
              style={{ background: 'none', border: 'none', color: 'rgba(74,222,128,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <Square size={12} />
            </button>
          </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifications(v => !v); setShowCollab(false); setShowProfile(false); }}
            style={{
              position: 'relative',
              width: 36, height: 36, borderRadius: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showNotifications ? `rgba(${primaryRgb}, 0.15)` : 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(${primaryRgb}, ${showNotifications ? '0.25' : '0.08'})`,
              color: showNotifications ? theme.primary : theme.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: '99px',
                background: '#ef4444', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 0 8px rgba(239,68,68,0.6)',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={{ ...dropdownStyle, minWidth: 320 }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem' }}>Уведомления</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: theme.textSecondary, fontSize: '0.875rem' }}>
                    Нет уведомлений
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: `1px solid rgba(${primaryRgb}, 0.06)`,
                        background: !n.isRead ? `rgba(${primaryRgb}, 0.05)` : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        markAsRead(n.id);
                        setShowNotifications(false);
                        if (n.relatedEntityType === 'TASK' && n.relatedEntityId && onNavigateToTask) {
                          onNavigateToTask(n.relatedEntityId);
                        } else if (n.relatedEntityType === 'PROJECT' && n.relatedEntityId && onNavigateToProject) {
                          onNavigateToProject(n.relatedEntityId);
                        } else if (n.relatedEntityType === 'COMMENT' && n.relatedEntityId && onNavigateToTask) {
                          onNavigateToTask(n.relatedEntityId);
                        } else if (n.type === 'CHAT' || n.type === 'MESSAGE') {
                          onViewChange('chat');
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        {!n.isRead && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.primary, flexShrink: 0, marginTop: 5 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: n.isRead ? 400 : 600 }}>{n.title}</div>
                          <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: 2 }}>{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collaboration */}
        <div ref={collabRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowCollab(v => !v); setShowNotifications(false); setShowProfile(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              height: 36, padding: '0 0.75rem', borderRadius: '0.75rem',
              background: showCollab ? `rgba(${primaryRgb}, 0.15)` : 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(${primaryRgb}, ${showCollab ? '0.25' : '0.08'})`,
              color: showCollab ? theme.primary : theme.textSecondary,
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <Users size={15} />
            <span>Команда</span>
            <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: showCollab ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showCollab && (
            <div style={dropdownStyle}>
              {[
                { label: 'Совместная работа', icon: Users, view: 'collaboration' as View },
                { label: 'Пригласить участника', icon: UserPlus, view: 'invite' as View },
                { label: 'Планировщик', icon: CalendarDays, view: 'planner' as View },
              ].map(({ label, icon: Icon, view }) => (
                <button
                  key={label}
                  style={dropdownItemStyle}
                  onClick={() => { onViewChange(view); setShowCollab(false); }}
                  onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.08)`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Icon size={15} style={{ color: theme.primary, flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifications(false); setShowCollab(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              height: 36, padding: '0 0.625rem 0 0.375rem', borderRadius: '0.75rem',
              background: showProfile ? `rgba(${primaryRgb}, 0.15)` : 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(${primaryRgb}, ${showProfile ? '0.25' : '0.08'})`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <AvatarWithFrame
              size={26}
              firstName={user?.firstName}
              lastName={user?.lastName}
              avatar={user?.avatar}
              level={user?.level ?? 1}
              streak={user?.currentStreak ?? 0}
              primaryColor={theme.primary}
              accentColor={theme.accent}
            />
            <span style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: 500 }}>
              {user?.firstName}
            </span>
            <ChevronDown size={13} style={{ color: theme.textSecondary, transition: 'transform 0.2s', transform: showProfile ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showProfile && (
            <div style={dropdownStyle}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)` }}>
                <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ color: theme.textSecondary, fontSize: '0.75rem', marginTop: 2 }}>{user?.email}</div>
                <div style={{
                  display: 'inline-block', marginTop: 6,
                  fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
                  background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary,
                }}>
                  Уровень {user?.level} · {user?.xp} XP
                </div>
              </div>
              {[
                { label: 'Профиль', icon: User, action: () => onViewChange('profile') },
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  style={dropdownItemStyle}
                  onClick={() => { action(); setShowProfile(false); }}
                  onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.08)`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <Icon size={15} style={{ color: theme.primary, flexShrink: 0 }} />
                  {label}
                </button>
              ))}
              <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, marginTop: 2 }}>
                <button
                  style={{ ...dropdownItemStyle, color: '#ef4444' }}
                  onClick={() => { logout(); setShowProfile(false); }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={15} style={{ flexShrink: 0 }} />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
