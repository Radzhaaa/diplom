import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Project, api } from '../../services/api';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Plus, FolderKanban, Users, CheckSquare, AlertCircle, Loader, Search, X, Trash2, RotateCcw } from 'lucide-react';
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR } from '../../constants/taskConstants';
import { toast } from 'sonner';

interface ProjectsProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  onNavigateToDetail: (id: number) => void;
  onNavigateToNew: () => void;
}

const STATUS_LABELS = PROJECT_STATUS_LABEL;
const STATUS_COLORS = PROJECT_STATUS_COLOR;


function getProjectAccents(primary: string, accent: string) {
  return [
    `linear-gradient(90deg, ${primary}, ${accent})`,
    `linear-gradient(90deg, ${accent}, ${primary})`,
    `linear-gradient(90deg, ${primary}cc, ${accent}99)`,
    `linear-gradient(90deg, ${accent}cc, ${primary}99)`,
    `linear-gradient(90deg, ${primary}, ${primary}88)`,
    `linear-gradient(90deg, ${accent}, ${accent}88)`,
  ];
}

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'PLANNING', label: 'Планирование' },
  { value: 'ON_HOLD', label: 'Приостановлены' },
  { value: 'COMPLETED', label: 'Завершённые' },
  { value: 'CANCELLED', label: 'Отменённые' },
];

export function Projects({ projects, loading, error, reload, onNavigateToDetail, onNavigateToNew }: ProjectsProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const PROJECT_ACCENTS = getProjectAccents(theme.primary, theme.accent);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    if (!showDeleted) return;
    setDeletedLoading(true);
    api.getDeletedProjects()
      .then(setDeletedProjects)
      .catch(() => toast.error('Не удалось загрузить удалённые проекты'))
      .finally(() => setDeletedLoading(false));
  }, [showDeleted]);

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      await api.restoreProject(id);
      setDeletedProjects(prev => prev.filter(p => p.id !== id));
      reload();
      toast.success('Проект восстановлен');
    } catch {
      toast.error('Не удалось восстановить проект');
    } finally {
      setRestoringId(null);
    }
  };

  const filtered = projects.filter(p => {
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="page-hero" style={{ background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.16) 0%, rgba(${primaryRgb}, 0.06) 100%)`, borderBottom: `1px solid rgba(${primaryRgb}, 0.12)` }}>
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
              <FolderKanban size={10} />
              Проекты
            </div>
            <h1 className="hero-title" style={{ color: theme.text }}>
              Мои проекты
            </h1>
            <p className="hero-sub" style={{ color: theme.textSecondary }}>
              {projects.length > 0
                ? `${projects.length} проект${projects.length === 1 ? '' : projects.length < 5 ? 'а' : 'ов'}`
                : 'Управляйте командами и задачами'
              }
            </p>
          </div>
          <button
            onClick={onNavigateToNew}
            className="btn-shimmer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.875rem',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: 'none', color: '#fff', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9375rem',
              boxShadow: `0 4px 16px rgba(${primaryRgb}, 0.35)`,
              flexShrink: 0,
            }}
          >
            <Plus size={18} /> Новый проект
          </button>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────── */}
      <div style={{
        padding: '0.875rem 2rem',
        borderBottom: `1px solid rgba(${primaryRgb}, 0.08)`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        background: `rgba(${primaryRgb}, 0.02)`,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, opacity: 0.6, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск проектов..."
            style={{
              paddingLeft: '2rem',
              paddingRight: search ? '2rem' : '0.75rem',
              paddingTop: '0.4rem',
              paddingBottom: '0.4rem',
              borderRadius: '0.625rem',
              border: `1px solid rgba(${primaryRgb}, 0.15)`,
              background: `rgba(${primaryRgb}, 0.06)`,
              color: theme.text,
              fontSize: '0.8125rem',
              outline: 'none',
              width: 200,
              transition: 'border-color 0.2s',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: `rgba(${primaryRgb}, 0.12)`, flexShrink: 0 }} />

        {/* Status chips */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => {
            const active = filterStatus === f.value;
            const color = f.value ? STATUS_COLORS[f.value] : theme.primary;
            const colorRgb = hexToRgb(color);
            return (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '99px',
                  border: `1px solid ${active ? `rgba(${colorRgb}, 0.4)` : `rgba(${primaryRgb}, 0.12)`}`,
                  background: active ? `rgba(${colorRgb}, 0.14)` : 'transparent',
                  color: active ? color : theme.textSecondary,
                  fontSize: '0.75rem',
                  fontWeight: active ? 650 : 420,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {(search || filterStatus) && !showDeleted && (
          <span style={{ fontSize: '0.75rem', color: theme.textSecondary }}>
            {filtered.length} из {projects.length}
          </span>
        )}

        {/* Trash toggle */}
        <button
          onClick={() => setShowDeleted(d => !d)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.3rem 0.75rem', borderRadius: '99px', cursor: 'pointer',
            border: `1px solid ${showDeleted ? 'rgba(239,68,68,0.4)' : `rgba(${primaryRgb},0.15)`}`,
            background: showDeleted ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: showDeleted ? '#f87171' : theme.textSecondary,
            fontSize: '0.75rem', fontWeight: showDeleted ? 650 : 420, transition: 'all 0.15s',
          }}
        >
          <Trash2 size={12} />
          Корзина
        </button>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="page-content">
        {/* Deleted projects view */}
        {showDeleted && (
          <div>
            <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>
              Удалённые проекты
            </h2>
            {deletedLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader size={28} className="animate-spin" style={{ color: theme.primary }} />
              </div>
            )}
            {!deletedLoading && deletedProjects.length === 0 && (
              <div style={{ ...getGlassCardStyle(theme), padding: '3rem', textAlign: 'center', color: theme.textSecondary }}>
                Нет удалённых проектов
              </div>
            )}
            {!deletedLoading && deletedProjects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {deletedProjects.map(p => (
                  <div key={p.id} style={{ ...getGlassCardStyle(theme), padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FolderKanban size={20} style={{ color: theme.textSecondary, flexShrink: 0, opacity: 0.6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>{p.name}</div>
                      {p.description && <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    </div>
                    <button
                      onClick={() => handleRestore(p.id)}
                      disabled={restoringId === p.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.4rem 0.875rem', borderRadius: '0.625rem', border: 'none',
                        background: `rgba(${hexToRgb(theme.primary)},0.15)`,
                        color: theme.primary, cursor: restoringId === p.id ? 'wait' : 'pointer',
                        fontWeight: 600, fontSize: '0.8125rem', flexShrink: 0,
                        opacity: restoringId === p.id ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw size={13} />
                      {restoringId === p.id ? '...' : 'Восстановить'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showDeleted && loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <Loader size={32} className="animate-spin" style={{ color: theme.primary }} />
          </div>
        )}

        {!showDeleted && error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem', borderRadius: '0.875rem',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', marginBottom: '1.5rem',
          }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9375rem' }}>{error}</span>
            <button
              onClick={reload}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
            >
              Повторить
            </button>
          </div>
        )}

        {!showDeleted && !loading && !error && projects.length === 0 && (
          <div
            className="glass-card"
            style={{ padding: '5rem', textAlign: 'center' }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '1.25rem',
              background: `rgba(${primaryRgb}, 0.12)`,
              border: `1px solid rgba(${primaryRgb}, 0.18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <FolderKanban size={32} style={{ color: theme.primary, opacity: 0.7 }} />
            </div>
            <h3 style={{ color: theme.text, fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              Пока нет проектов
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: '0.9375rem', marginBottom: '1.75rem' }}>
              Создайте первый проект, чтобы начать работу
            </p>
            <button
              onClick={onNavigateToNew}
              className="btn-shimmer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1.5rem', borderRadius: '0.875rem',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600,
                boxShadow: `0 4px 16px rgba(${primaryRgb}, 0.35)`,
              }}
            >
              <Plus size={18} /> Создать проект
            </button>
          </div>
        )}

        {/* Empty filtered state */}
        {!showDeleted && !loading && !error && projects.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: theme.textSecondary, fontSize: '0.9375rem' }}>
            Ничего не найдено. <button onClick={() => { setSearch(''); setFilterStatus(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, fontWeight: 600 }}>Сбросить фильтры</button>
          </div>
        )}

        {/* Project grid */}
        {!showDeleted && <div className="stagger" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {filtered.map((project, idx) => {
            const statusColor = STATUS_COLORS[project.status] ?? '#6b7280';
            const statusRgb   = hexToRgb(statusColor);
            const accent      = PROJECT_ACCENTS[idx % PROJECT_ACCENTS.length];

            return (
              <div
                key={project.id}
                className="glass-card project-card"
                onClick={() => onNavigateToDetail(project.id)}
                style={{
                  border: `1px solid rgba(255,255,255,0.07)`,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(${statusRgb}, 0.12)`;
                  (e.currentTarget as HTMLElement).style.borderColor = `rgba(${statusRgb}, 0.25)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                {/* Top accent gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '2px',
                  background: accent,
                  borderRadius: '1.25rem 1.25rem 0 0',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <h3 style={{
                    color: theme.text, fontWeight: 700, fontSize: '1.0625rem',
                    margin: 0, flex: 1, letterSpacing: '-0.02em',
                  }}>
                    {project.name}
                  </h3>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '3px 9px',
                    borderRadius: '99px',
                    background: `rgba(${statusRgb}, 0.15)`,
                    color: statusColor,
                    border: `1px solid rgba(${statusRgb}, 0.25)`,
                    marginLeft: '0.625rem', whiteSpace: 'nowrap',
                  }}>
                    {STATUS_LABELS[project.status] || project.status}
                  </span>
                </div>

                {project.description && (
                  <p style={{
                    color: theme.textSecondary, fontSize: '0.8125rem',
                    marginBottom: '1rem', lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {project.description}
                  </p>
                )}

                {project.progress !== undefined && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '0.375rem', fontSize: '0.72rem',
                      color: theme.textSecondary,
                    }}>
                      <span>Прогресс</span>
                      <span style={{ color: statusColor, fontWeight: 600 }}>
                        {Math.round(project.progress)}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div style={{
                        height: '100%', width: `${project.progress}%`,
                        borderRadius: '99px',
                        background: accent,
                        boxShadow: `0 0 8px rgba(${statusRgb}, 0.4)`,
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: theme.textSecondary }}>
                  {project.memberCount !== undefined && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Users size={12} style={{ opacity: 0.7 }} />
                      {project.memberCount}
                    </span>
                  )}
                  {project.taskCount !== undefined && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CheckSquare size={12} style={{ opacity: 0.7 }} />
                      {project.completedTaskCount ?? 0} / {project.taskCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </>
  );
}
