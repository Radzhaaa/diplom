import { useState, useEffect, useRef } from 'react';
import { api, Project, Task } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb } from '../utils/glassStyles';
import { Search, FolderKanban, CheckSquare, X, ArrowRight } from 'lucide-react';

interface CommandPaletteProps {
  projects: Project[];
  onClose: () => void;
  onNavigateToProject: (id: number) => void;
  onNavigateToTask: (id: number) => void;
}

export function CommandPalette({ projects, onClose, onNavigateToProject, onNavigateToTask }: CommandPaletteProps) {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setTasks([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setTasksLoading(true);
      try {
        const results = await api.searchTasks(query);
        setTasks(Array.isArray(results) ? results.slice(0, 5) : []);
      } catch {
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const filteredProjects = query.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : projects.slice(0, 4);

  const allItems: Array<{ type: 'project' | 'task'; id: number; label: string; sub?: string }> = [
    ...filteredProjects.map(p => ({ type: 'project' as const, id: p.id, label: p.name, sub: p.status })),
    ...tasks.map(t => ({ type: 'task' as const, id: t.id, label: t.title, sub: t.projectName })),
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[selectedIndex]) {
        const item = allItems[selectedIndex];
        if (item.type === 'project') { onNavigateToProject(item.id); onClose(); }
        else { onNavigateToTask(item.id); onClose(); }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [allItems, selectedIndex, onNavigateToProject, onNavigateToTask, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Активен', PLANNING: 'Планируется', COMPLETED: 'Завершён',
    ON_HOLD: 'На паузе', CANCELLED: 'Отменён',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 560,
        maxWidth: 'calc(100vw - 2rem)',
        zIndex: 501,
        background: theme.surface,
        borderRadius: '1.25rem',
        border: `1px solid rgba(${rgb}, 0.2)`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(${rgb}, 0.08)`,
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: `1px solid rgba(${rgb}, 0.1)` }}>
          <Search size={18} style={{ color: theme.textSecondary, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск проектов и задач..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: theme.text, fontSize: '1rem', fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: '0.125rem' }}>
              <X size={16} />
            </button>
          )}
          <kbd style={{ fontSize: '0.7rem', color: theme.textSecondary, background: `rgba(${rgb}, 0.08)`, padding: '0.15rem 0.5rem', borderRadius: '0.375rem', border: `1px solid rgba(${rgb}, 0.15)`, fontFamily: 'inherit' }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {/* Projects section */}
          {filteredProjects.length > 0 && (
            <div>
              <div style={{ padding: '0.5rem 1.25rem 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Проекты
              </div>
              {filteredProjects.map((p, i) => {
                const idx = i;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => { onNavigateToProject(p.id); onClose(); }}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1.25rem',
                      background: isSelected ? `rgba(${rgb}, 0.1)` : 'none',
                      border: 'none', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: `rgba(${rgb}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FolderKanban size={15} style={{ color: theme.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.7rem' }}>{STATUS_LABELS[p.status] ?? p.status}</div>
                    </div>
                    {isSelected && <ArrowRight size={14} style={{ color: theme.primary, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tasks section */}
          {tasks.length > 0 && (
            <div>
              <div style={{ padding: '0.5rem 1.25rem 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: filteredProjects.length > 0 ? `1px solid rgba(${rgb}, 0.07)` : 'none' }}>
                Задачи
              </div>
              {tasks.map((t, i) => {
                const idx = filteredProjects.length + i;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={t.id}
                    onClick={() => { onNavigateToTask(t.id); onClose(); }}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1.25rem',
                      background: isSelected ? `rgba(${rgb}, 0.1)` : 'none',
                      border: 'none', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: `rgba(${rgb}, 0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckSquare size={15} style={{ color: theme.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      {t.projectName && <div style={{ color: theme.textSecondary, fontSize: '0.7rem' }}>{t.projectName}</div>}
                    </div>
                    {isSelected && <ArrowRight size={14} style={{ color: theme.primary, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading */}
          {tasksLoading && (
            <div style={{ padding: '1rem 1.25rem', color: theme.textSecondary, fontSize: '0.875rem' }}>Поиск...</div>
          )}

          {/* Empty state */}
          {!tasksLoading && query && allItems.length === 0 && (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: theme.textSecondary, fontSize: '0.875rem' }}>
              Ничего не найдено по запросу «{query}»
            </div>
          )}

          {/* Default state — quick actions */}
          {!query && (
            <div style={{ padding: '0.75rem 1.25rem 1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Быстрые действия
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: '⌨️  Поиск проекта', hint: 'Введите название' },
                  { label: '🔍  Поиск задачи', hint: 'Введите название' },
                ].map(a => (
                  <div key={a.label} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.625rem', background: `rgba(${rgb}, 0.07)`, color: theme.textSecondary, fontSize: '0.8rem' }}>
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '0.5rem 1.25rem', borderTop: `1px solid rgba(${rgb}, 0.08)`, display: 'flex', gap: '1rem' }}>
          {[
            { key: '↑↓', desc: 'навигация' },
            { key: '↵', desc: 'открыть' },
            { key: 'Esc', desc: 'закрыть' },
          ].map(h => (
            <div key={h.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: theme.textSecondary }}>
              <kbd style={{ background: `rgba(${rgb}, 0.08)`, padding: '0.1rem 0.4rem', borderRadius: '0.3rem', border: `1px solid rgba(${rgb}, 0.15)`, fontFamily: 'inherit' }}>{h.key}</kbd>
              {h.desc}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
