import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { XProjectLogo } from './XProjectLogo';
import { hexToRgb } from '../utils/glassStyles';
import { Project } from '../services/api';
import {
  LayoutDashboard, FolderKanban, Zap, BarChart3,
  Bot, CheckSquare, MessageCircle,
  ChevronRight, ChevronDown, CalendarDays, X,
} from 'lucide-react';

type View = 'dashboard' | 'projects' | 'quests' | 'profile' |
  'project-detail' | 'new-project' | 'skills' | 'add-task' | 'add-member' | 'analytics' |
  'settings' | 'ai-assistant' | 'collaboration' | 'tasks' | 'task-archive' | 'invite' | 'chat' |
  'achievements' | 'leaderboard' | 'organizations' | 'planner';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  projects?: Project[];
  onNavigateToProject?: (id: number) => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ currentView, onViewChange, projects = [], onNavigateToProject, mobileOpen, isMobile, onMobileClose }: SidebarProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  const [projectsExpanded, setProjectsExpanded] = useState(false);

  const NAV_ITEMS: { id: string; label: string; Icon: React.ElementType }[] = [
    { id: 'dashboard',     label: 'Дашборд',    Icon: LayoutDashboard },
    { id: 'projects',      label: 'Проекты',    Icon: FolderKanban    },
    { id: 'tasks',         label: 'Задачи',      Icon: CheckSquare  },
    { id: 'quests',        label: 'Квесты',      Icon: Zap          },
    { id: 'analytics',     label: 'Аналитика',   Icon: BarChart3    },
    { id: 'planner',       label: 'Планировщик', Icon: CalendarDays },
    { id: 'ai-assistant',  label: 'AI-помощник', Icon: Bot },
    { id: 'chat',          label: 'Чат',         Icon: MessageCircle },
  ];

  const isAdmin = user?.role === 'ADMIN';
  const visibleNavItems = NAV_ITEMS.filter(item =>
    item.id !== 'ai-assistant' || isAdmin
  );

  const isActive = (id: string) => {
    if (id === 'projects' && (currentView === 'projects' || currentView === 'project-detail' || currentView === 'new-project')) return true;
    return currentView === id;
  };

  const navBtn = (id: string, label: string, Icon: React.ElementType, isSettings = false) => {
    const active = isSettings ? currentView === 'settings' : isActive(id);
    const isProjectsBtn = id === 'projects';

    return (
      <div key={id}>
        <button
          onClick={() => {
            if (isProjectsBtn && projects.length > 0) {
              setProjectsExpanded(prev => !prev);
            }
            onViewChange(id as View);
          }}
          onMouseEnter={e => {
            if (!active) {
              e.currentTarget.style.background = `rgba(${rgb}, 0.07)`;
              e.currentTarget.style.color = theme.text;
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.textSecondary;
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.875rem',
            border: active ? `1px solid rgba(${rgb}, 0.22)` : '1px solid transparent',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            position: 'relative',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            background: active ? `rgba(${rgb}, 0.14)` : 'transparent',
            color: active ? theme.primary : theme.textSecondary,
            boxShadow: active ? `0 2px 12px rgba(${rgb}, 0.12)` : 'none',
          }}
        >
          {active && (
            <span style={{
              position: 'absolute', left: 0, top: '20%',
              width: 3, height: '60%', background: theme.primary,
              borderRadius: '0 4px 4px 0', boxShadow: `0 0 8px rgba(${rgb}, 0.7)`,
            }} />
          )}
          <Icon
            size={19}
            style={{ flexShrink: 0, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 5px rgba(${rgb}, 0.6))` : 'none', transition: 'all 0.2s' }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: active ? 650 : 420, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {label}
          </span>
          {/* Projects expand toggle */}
          {isProjectsBtn && projects.length > 0 && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: theme.textSecondary, opacity: 0.7 }}
              onClick={e => { e.stopPropagation(); setProjectsExpanded(prev => !prev); }}>
              {projectsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
          )}
        </button>

        {/* Project sub-tree */}
        {isProjectsBtn && projectsExpanded && projects.length > 0 && (
          <div style={{ marginLeft: '1.25rem', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {projects.slice(0, 8).map(p => (
              <button
                key={p.id}
                onClick={() => onNavigateToProject?.(p.id)}
                onMouseEnter={e => { e.currentTarget.style.background = `rgba(${rgb}, 0.07)`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.45rem 0.75rem', borderRadius: '0.625rem',
                  border: 'none', cursor: 'pointer', background: 'transparent',
                  color: theme.textSecondary, textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.status === 'ACTIVE' ? '#10b981' : `rgba(${rgb}, 0.3)`, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {p.name}
                </span>
                {(p.taskCount ?? 0) > 0 && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    background: `rgba(${rgb}, 0.12)`, color: theme.primary,
                    padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
                  }}>
                    {p.taskCount}
                  </span>
                )}
              </button>
            ))}
            {projects.length > 8 && (
              <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: theme.textSecondary, opacity: 0.6 }}>
                +{projects.length - 8} ещё...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`app-sidebar glass-sidebar${isMobile ? (mobileOpen ? ' mobile-open' : ' mobile-closed') : ''}`}
      style={{
        display: 'flex', flexDirection: 'column', padding: '1.125rem 0.75rem',
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260, zIndex: 300,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        } : {}),
      }}
    >
      {/* Logo + close button (mobile) */}
      <div style={{ padding: '0.5rem 0.25rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <XProjectLogo variant="full" size="lg" />
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: rgb ? `rgba(${rgb},0.6)` : '#94a3b8', padding: '0.25rem',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {visibleNavItems.map(({ id, label, Icon }) => navBtn(id, label, Icon))}
      </nav>

    </aside>
  );
}
