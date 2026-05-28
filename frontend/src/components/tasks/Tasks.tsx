import React, { useState, useEffect } from 'react';
import {
  Search, Calendar as CalendarIcon, Plus, LayoutDashboard,
  FileSpreadsheet, CheckSquare, Clock,
  CheckCircle2, Circle, User, Table2, ChevronUp, ChevronDown,
  Filter, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '../../hooks/useTasks';
import { api, Task } from '../../services/api';
import { FullScreenCalendar } from '../meetings/FullScreenCalendar';
import { KanbanBoard } from './KanbanBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { getGlassCardStyle, getGlassButtonStyle, hexToRgb } from '../../utils/glassStyles';
import { AvatarWithFrame } from '../ui/AvatarWithFrame';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { exportTasksCsv } from '../../utils/exportUtils';
import { FilterDropdown } from './FilterDropdown';
import { PRIORITY_LABEL, PRIORITY_COLOR, PRIORITY_ORDER, STATUS_LABEL, STATUS_COLOR, STATUS_ORDER } from '../../constants/taskConstants';

type SortField = 'title' | 'status' | 'priority' | 'deadline' | 'assignee';
type SortDir   = 'asc' | 'desc';

interface TasksProps {
  onNavigateToTask: (taskId: number) => void;
  onNavigateToAddTask?: () => void;
  reloadKey?: number;
}

export function Tasks({ onNavigateToTask, onNavigateToAddTask, reloadKey }: TasksProps) {
  const { tasks, loading, reload } = useTasks(undefined, reloadKey);
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [doneAnimIds, setDoneAnimIds] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const primaryRgb = hexToRgb(theme.primary);

  const activeTasks = tasks.filter(
    (t) => (t.status !== 'COMPLETED' && t.status !== 'DONE' && t.status !== 'CANCELLED') || doneAnimIds.has(t.id)
  );

  const filteredTasks = activeTasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description?.toLowerCase().includes(q))) return false;
    }
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterTag      && !(t.tags ?? []).includes(filterTag)) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aDone = doneAnimIds.has(a.id) ? 1 : 0;
    const bDone = doneAnimIds.has(b.id) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;

    let cmp = 0;
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title, 'ru');
    } else if (sortField === 'status') {
      cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
    } else if (sortField === 'priority') {
      cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
    } else if (sortField === 'deadline') {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      cmp = da - db;
    } else if (sortField === 'assignee') {
      const na = a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}`.trim() : '';
      const nb = b.assignedTo ? `${b.assignedTo.firstName} ${b.assignedTo.lastName}`.trim() : '';
      cmp = na.localeCompare(nb, 'ru');
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    setPendingIds(prev => new Set(prev).add(taskId));
    try {
      await api.updateTask(taskId, { status: newStatus });
      if (newStatus === 'COMPLETED' || newStatus === 'DONE') {
        toast.success('Задача выполнена!');
        setDoneAnimIds(prev => new Set(prev).add(taskId));
        setTimeout(() => {
          setDoneAnimIds(prev => { const s = new Set(prev); s.delete(taskId); return s; });
          reload();
        }, 1200);
      } else {
        await reload();
      }
    } catch (err: any) {
      const status = err?.status;
      const msg = err?.message || '';
      if (status === 403 || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('access') || msg.toLowerCase().includes('denied')) {
        toast.error('Нет прав для изменения этой задачи');
      } else if (status === 401) {
        toast.error('Сессия истекла — войдите снова');
      } else {
        toast.error(`Ошибка: ${msg || 'Не удалось изменить статус'}`);
      }
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(taskId); return s; });
    }
  };

  const hasFilters = filterStatus || filterPriority || filterTag;

  const allTags = Array.from(new Set(activeTasks.flatMap(t => t.tags ?? [])));

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" style={{ color: theme.primary }} />
      : <ChevronDown className="w-3 h-3" style={{ color: theme.primary }} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 1rem',
    fontWeight: 600,
    fontSize: '0.75rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.textSecondary,
    borderBottom: `1px solid rgba(${primaryRgb},0.1)`,
    whiteSpace: 'nowrap',
    background: `rgba(${primaryRgb},0.04)`,
    cursor: 'pointer',
    userSelect: 'none',
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 w-full flex items-center justify-center" style={{ minHeight: '100%' }}>
        <div style={{ color: theme.textSecondary }}>Загрузка задач...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div
        className="page-hero"
        style={{
          background: `linear-gradient(135deg, rgba(${primaryRgb},0.16) 0%, rgba(${primaryRgb},0.07) 50%, rgba(${primaryRgb},0.03) 100%)`,
          borderBottom: `1px solid rgba(${primaryRgb},0.12)`,
        }}
      >
        <div className="hero-row">
          <div>
            <div
              className="hero-label"
              style={{
                background: `rgba(${primaryRgb},0.12)`,
                color: theme.primary,
                border: `1px solid rgba(${primaryRgb},0.22)`,
              }}
            >
              <CheckSquare size={10} />
              Задачи
            </div>
            <h1 className="hero-title" style={{ color: theme.text }}>Мои задачи</h1>
            <p className="hero-sub" style={{ color: theme.textSecondary }}>
              {activeTasks.length} {activeTasks.length === 1 ? 'задача' : activeTasks.length < 5 ? 'задачи' : 'задач'} · таблица, канбан, календарь
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap" style={{ flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => exportTasksCsv(activeTasks)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={getGlassButtonStyle(theme, 'secondary')}
              title="Экспорт в CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
            {onNavigateToAddTask && (
              <button
                type="button"
                onClick={onNavigateToAddTask}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '0.5rem 1.25rem',
                  borderRadius: '0.875rem', border: 'none', cursor: 'pointer',
                  fontWeight: 600, whiteSpace: 'nowrap',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  color: '#fff',
                  boxShadow: `0 4px 14px rgba(${primaryRgb},0.40)`,
                  fontSize: '0.9375rem',
                  transition: 'opacity 0.2s',
                }}
              >
                <Plus size={16} />
                Создать задачу
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="page-content" style={{ flex: 1, minHeight: 0, overflowX: viewMode === 'kanban' ? 'auto' : 'hidden' }}>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <TabsList
              className="rounded-xl flex shrink-0 p-0"
              style={{
                background: `rgba(${primaryRgb}, 0.08)`,
                border: `1px solid rgba(${primaryRgb}, 0.14)`,
                gap: '2px',
                width: 'auto',
                overflow: 'hidden',
              }}
            >
              {([
                { value: 'table',    label: 'Таблица',   Icon: Table2 },
                { value: 'kanban',   label: 'Канбан',    Icon: LayoutDashboard },
                { value: 'calendar', label: 'Календарь', Icon: CalendarIcon },
              ] as const).map(({ value, label, Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none px-4 py-1.5 inline-flex items-center gap-2 text-sm font-medium transition-all"
                  style={viewMode === value
                    ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: '#fff', boxShadow: `0 2px 8px rgba(${primaryRgb},0.35)` }
                    : { color: theme.textSecondary, background: 'transparent' }
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '26rem' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: theme.textSecondary }} />
              <input
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', height: '38px',
                  background: `rgba(${primaryRgb}, 0.06)`,
                  border: `1px solid rgba(${primaryRgb}, 0.14)`,
                  borderRadius: '0.875rem',
                  color: theme.text,
                  paddingLeft: '2.25rem', paddingRight: '1rem',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>

            {/* Filters */}
            {viewMode === 'table' && (
              <>
                <Filter size={14} style={{ color: theme.textSecondary, flexShrink: 0 }} />
                <FilterDropdown
                  value={filterStatus}
                  placeholder="Все статусы"
                  options={Object.entries(STATUS_LABEL)
                    .filter(([k]) => !['DONE','COMPLETED','CANCELLED'].includes(k))
                    .map(([k, v]) => ({ value: k, label: v, color: STATUS_COLOR[k] }))}
                  onChange={setFilterStatus}
                  theme={theme}
                  primaryRgb={primaryRgb}
                />
                <FilterDropdown
                  value={filterPriority}
                  placeholder="Все приоритеты"
                  options={Object.entries(PRIORITY_LABEL).map(([k, v]) => ({ value: k, label: v, color: PRIORITY_COLOR[k] }))}
                  onChange={setFilterPriority}
                  theme={theme}
                  primaryRgb={primaryRgb}
                />
                {allTags.length > 0 && (
                  <FilterDropdown
                    value={filterTag}
                    placeholder="Все теги"
                    options={allTags.map(t => ({ value: t, label: `#${t}` }))}
                    onChange={setFilterTag}
                    theme={theme}
                    primaryRgb={primaryRgb}
                  />
                )}
                {hasFilters && (
                  <button
                    onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterTag(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      height: '38px', padding: '0 0.75rem',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '0.875rem', color: '#f87171',
                      fontSize: '0.8125rem', cursor: 'pointer',
                    }}
                  >
                    <X size={13} /> Сбросить
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── TABLE VIEW ── */}
          <TabsContent value="table" className="mt-0">
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Table2 className="w-10 h-10 opacity-20" style={{ color: theme.primary }} />
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery || hasFilters ? 'Нет задач по фильтру' : 'Нет задач. Создайте первую!'}
                </p>
              </div>
            ) : (
              <div style={{ ...getGlassCardStyle(theme), padding: 0, overflow: 'hidden', borderRadius: '1rem' }}>
                <div style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '38px' }} />
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '260px' }} />
                      <col style={{ width: '130px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '150px' }} />
                      <col style={{ width: '120px' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, cursor: 'default' }} />
                        <th style={{ ...thStyle, cursor: 'default', textAlign: 'center' }}>#</th>
                        <th style={thStyle} onClick={() => handleSort('title')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>Название <SortIcon field="title" /></span>
                        </th>
                        <th style={thStyle} onClick={() => handleSort('status')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>Статус <SortIcon field="status" /></span>
                        </th>
                        <th style={thStyle} onClick={() => handleSort('priority')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>Приоритет <SortIcon field="priority" /></span>
                        </th>
                        <th style={thStyle} onClick={() => handleSort('assignee')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>Исполнитель <SortIcon field="assignee" /></span>
                        </th>
                        <th style={thStyle} onClick={() => handleSort('deadline')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>Дедлайн <SortIcon field="deadline" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTasks.map((task, idx) => {
                        const priorityColor = PRIORITY_COLOR[task.priority] ?? '#6b7280';
                        const statusColor   = STATUS_COLOR[task.status]     ?? '#6b7280';
                        const deadline      = task.deadline ? new Date(task.deadline) : null;
                        const isOverdue     = deadline && isPast(deadline) && task.status !== 'DONE' && task.status !== 'COMPLETED';
                        const isDueToday    = deadline && isToday(deadline);
                        const isDone        = task.status === 'DONE' || task.status === 'COMPLETED';

                        return (
                          <tr
                            key={task.id}
                            style={{
                              borderBottom: `1px solid rgba(${primaryRgb},0.07)`,
                              cursor: 'pointer',
                              background: 'transparent',
                              opacity: doneAnimIds.has(task.id) ? 0 : 1,
                              transform: doneAnimIds.has(task.id) ? 'translateY(12px)' : 'none',
                              transition: 'background 0.15s, opacity 1s ease, transform 1s ease',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${primaryRgb},0.05)`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            {/* Complete toggle */}
                            <td style={{ padding: '0 0 0 0.625rem', textAlign: 'center', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!pendingIds.has(task.id)) handleStatusChange(task.id, isDone ? 'TODO' : 'COMPLETED');
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                              >
                                {pendingIds.has(task.id) ? (
                                  <svg width="18" height="18" viewBox="0 0 22 22" style={{ animation: 'spin 0.8s linear infinite', color: theme.primary }}>
                                    <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round" />
                                  </svg>
                                ) : isDone ? (
                                  <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                                ) : (
                                  <Circle size={18} style={{ color: theme.textSecondary, opacity: 0.5 }} />
                                )}
                              </button>
                            </td>
                            {/* # */}
                            <td style={{ padding: '0.75rem 0.5rem', color: theme.textSecondary, fontSize: '0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                              {idx + 1}
                            </td>
                            {/* Title */}
                            <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }} onClick={() => onNavigateToTask(task.id)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '3px', height: '32px', borderRadius: '2px', background: priorityColor, flexShrink: 0 }} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    {(task.blockedBy ?? []).length > 0 && (
                                      <span title={`Заблокировано задачами: ${task.blockedBy!.join(', ')}`} style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>
                                        🔒 {task.blockedBy!.length}
                                      </span>
                                    )}
                                    <span style={{ color: (isDone || doneAnimIds.has(task.id)) ? theme.textSecondary : theme.text, fontWeight: 600, fontSize: '0.875rem', textDecoration: (isDone || doneAnimIds.has(task.id)) ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {task.title}
                                    </span>
                                  </div>
                                  {task.tags && task.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                      {task.tags.map(tag => (
                                        <span
                                          key={tag}
                                          onClick={e => { e.stopPropagation(); setFilterTag(filterTag === tag ? '' : tag); }}
                                          style={{
                                            padding: '1px 6px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 500, cursor: 'pointer',
                                            background: filterTag === tag ? `rgba(${primaryRgb},0.25)` : `rgba(${primaryRgb},0.1)`,
                                            color: theme.primary,
                                          }}
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Status */}
                            <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '3px 9px', borderRadius: '99px', background: `${statusColor}15`, color: statusColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                                {STATUS_LABEL[task.status] ?? task.status}
                              </span>
                            </td>
                            {/* Priority */}
                            <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: '99px', background: `${priorityColor}15`, color: priorityColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {PRIORITY_LABEL[task.priority] ?? task.priority}
                              </span>
                            </td>
                            {/* Assignee */}
                            <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                              {task.assignedTo ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.textSecondary, fontSize: '0.8125rem' }}>
                                  <AvatarWithFrame
                                    size={24}
                                    firstName={task.assignedTo.firstName}
                                    lastName={task.assignedTo.lastName}
                                    email={task.assignedTo.email}
                                    primaryColor={theme.primary}
                                    accentColor={theme.accent}
                                  />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {(`${task.assignedTo.firstName ?? ''} ${task.assignedTo.lastName ?? ''}`).trim() || task.assignedTo.email}
                                  </span>
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary, fontSize: '0.8125rem', opacity: 0.4 }}>
                                  <User size={14} /> Не назначен
                                </span>
                              )}
                            </td>
                            {/* Deadline */}
                            <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                              {deadline ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: isOverdue ? 700 : 500, color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : theme.textSecondary, whiteSpace: 'nowrap' }}>
                                  <Clock size={13} />
                                  {format(deadline, 'd MMM yyyy', { locale: ru })}
                                  {isOverdue && <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.12)', padding: '1px 5px', borderRadius: '4px' }}>Просрочена</span>}
                                  {isDueToday && !isOverdue && <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: '4px' }}>Сегодня</span>}
                                </span>
                              ) : (
                                <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', opacity: 0.35 }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Footer */}
                <div style={{ padding: '0.625rem 1rem', borderTop: `1px solid rgba(${primaryRgb},0.08)`, color: theme.textSecondary, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>{sortedTasks.length} {sortedTasks.length === 1 ? 'задача' : sortedTasks.length < 5 ? 'задачи' : 'задач'}</span>
                  {hasFilters && <span style={{ color: theme.primary }}>• Применены фильтры</span>}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Kanban */}
          <TabsContent value="kanban" className="mt-0">
            <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
              <KanbanBoard tasks={filteredTasks} onTaskClick={onNavigateToTask} onTaskStatusChange={handleStatusChange} />
            </div>
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="mt-0">
            <FullScreenCalendar
              tasks={activeTasks}
              onDeadlineChange={async (taskId, newDate) => {
                await api.updateTask(taskId, { deadline: newDate.toISOString() });
                reload();
              }}
              onTaskClick={onNavigateToTask}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
