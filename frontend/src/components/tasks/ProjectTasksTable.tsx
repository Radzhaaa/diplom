import React, { useState } from 'react';
import { Task } from '../../services/api';
import { FilterDropdown } from './FilterDropdown';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { AvatarWithFrame } from '../ui/AvatarWithFrame';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Table2, Search, Filter, X, CheckSquare,
  ChevronUp, ChevronDown, CheckCircle2, Circle, Clock, User,
} from 'lucide-react';
import {
  PRIORITY_LABEL, PRIORITY_COLOR, PRIORITY_ORDER,
  STATUS_LABEL,   STATUS_COLOR,   STATUS_ORDER,
} from '../../constants/taskConstants';

type SortField = 'title' | 'status' | 'priority' | 'deadline' | 'assignee';

interface Props {
  tasks: Task[];
  pendingIds: Set<number>;
  onNavigateToTask: (taskId: number) => void;
  onStatusChange: (taskId: number, newStatus: Task['status']) => void;
}

export function ProjectTasksTable({ tasks, pendingIds, onNavigateToTask, onStatusChange }: Props) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortField,      setSortField]      = useState<SortField>('deadline');
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const uniqueAssignees = Array.from(
    new Map(
      tasks.filter(t => t.assignedTo?.id).map(t => [`${t.assignedTo!.id}`, t.assignedTo!])
    ).values()
  );

  const filtered = tasks.filter(t => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description?.toLowerCase().includes(q))) return false;
    }
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && (!t.assignedTo || String(t.assignedTo.id) !== filterAssignee)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if      (sortField === 'title')    cmp = a.title.localeCompare(b.title, 'ru');
    else if (sortField === 'status')   cmp = (STATUS_ORDER[a.status]   ?? 0) - (STATUS_ORDER[b.status]   ?? 0);
    else if (sortField === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
    else if (sortField === 'deadline') {
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

  const hasFilters = search.trim() || filterStatus || filterPriority || filterAssignee;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp style={{ width: 12, height: 12, opacity: 0.2 }} />;
    return sortDir === 'asc'
      ? <ChevronUp  style={{ width: 12, height: 12, color: theme.primary }} />
      : <ChevronDown style={{ width: 12, height: 12, color: theme.primary }} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 1rem',
    fontWeight: 600,
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: theme.textSecondary,
    borderBottom: `1px solid rgba(${primaryRgb},0.1)`,
    whiteSpace: 'nowrap',
    background: `rgba(${primaryRgb},0.04)`,
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'left',
  };

  return (
    <div style={{ ...getGlassCardStyle(theme), padding: 0, overflow: 'hidden', borderRadius: '1rem' }}>
      {/* Toolbar */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid rgba(${primaryRgb},0.08)`, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <Table2 size={16} style={{ color: theme.primary, flexShrink: 0 }} />
          <span style={{ color: theme.text, fontWeight: 700, fontSize: '1rem' }}>Задачи проекта</span>
          <span style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>({tasks.length})</span>
        </div>

        <div style={{ position: 'relative', minWidth: '180px', maxWidth: '22rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: theme.textSecondary }} />
          <input
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: '34px', background: `rgba(${primaryRgb},0.06)`, border: `1px solid rgba(${primaryRgb},0.14)`, borderRadius: '0.75rem', color: theme.text, paddingLeft: '2.25rem', paddingRight: '0.75rem', fontSize: '0.8125rem', outline: 'none' }}
          />
        </div>

        <Filter size={13} style={{ color: theme.textSecondary, flexShrink: 0 }} />
        <FilterDropdown value={filterStatus}   placeholder="Статус"      options={Object.entries(STATUS_LABEL).map(([k, v])   => ({ value: k, label: v, color: STATUS_COLOR[k] }))}   onChange={setFilterStatus}   theme={theme} primaryRgb={primaryRgb} />
        <FilterDropdown value={filterPriority} placeholder="Приоритет"   options={Object.entries(PRIORITY_LABEL).map(([k, v]) => ({ value: k, label: v, color: PRIORITY_COLOR[k] }))} onChange={setFilterPriority} theme={theme} primaryRgb={primaryRgb} />
        <FilterDropdown value={filterAssignee} placeholder="Исполнитель" options={uniqueAssignees.map(u => ({ value: String(u.id), label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email }))} onChange={setFilterAssignee} theme={theme} primaryRgb={primaryRgb} />

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', height: '36px', padding: '0 0.625rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.875rem', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <X size={12} /> Сбросить
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
          <CheckSquare size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3, color: theme.primary }} />
          <p>{hasFilters ? 'Нет задач по фильтру' : 'Задач нет. Создайте первую.'}</p>
        </div>
      ) : (
        <div style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '34px' }} />
              <col />
              <col style={{ width: '148px' }} />
              <col style={{ width: '132px' }} />
              <col style={{ width: '168px' }} />
              <col style={{ width: '128px' }} />
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
              {sorted.map((task, idx) => {
                const priorityColor = PRIORITY_COLOR[task.priority] ?? '#6b7280';
                const statusColor   = STATUS_COLOR[task.status]     ?? '#6b7280';
                const deadline      = task.deadline ? new Date(task.deadline) : null;
                const isOverdue     = deadline && isPast(deadline) && task.status !== 'DONE' && task.status !== 'COMPLETED';
                const isDueToday    = deadline && isToday(deadline);
                const isDone        = task.status === 'DONE' || task.status === 'COMPLETED';

                return (
                  <tr
                    key={task.id}
                    style={{ borderBottom: `1px solid rgba(${primaryRgb},0.07)`, transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `rgba(${primaryRgb},0.04)`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '0 0 0 0.625rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); if (!pendingIds.has(task.id)) onStatusChange(task.id, isDone ? 'TODO' : 'COMPLETED'); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                      >
                        {pendingIds.has(task.id) ? (
                          <svg width="16" height="16" viewBox="0 0 22 22" style={{ animation: 'spin 0.8s linear infinite', color: theme.primary }}>
                            <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round" />
                          </svg>
                        ) : isDone ? (
                          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        ) : (
                          <Circle size={16} style={{ color: theme.textSecondary, opacity: 0.4 }} />
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: theme.textSecondary, fontSize: '0.72rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }} onClick={() => onNavigateToTask(task.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '3px', height: '28px', borderRadius: '2px', background: priorityColor, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: isDone ? theme.textSecondary : theme.text, fontWeight: 600, fontSize: '0.875rem', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '99px', background: `${statusColor}15`, color: statusColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                        {STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '99px', background: `${priorityColor}15`, color: priorityColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {PRIORITY_LABEL[task.priority] ?? task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      {task.assignedTo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.textSecondary, fontSize: '0.8rem' }}>
                          <AvatarWithFrame
                            size={22}
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary, fontSize: '0.8rem', opacity: 0.4 }}>
                          <User size={13} /> Не назначен
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      {deadline ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: isOverdue ? 700 : 500, color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : theme.textSecondary, whiteSpace: 'nowrap' }}>
                          <Clock size={12} />
                          {format(deadline, 'd MMM yyyy', { locale: ru })}
                          {isOverdue && <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.12)', padding: '1px 4px', borderRadius: '3px' }}>Просрочена</span>}
                        </span>
                      ) : (
                        <span style={{ color: theme.textSecondary, fontSize: '0.8rem', opacity: 0.35 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ padding: '0.625rem 1.25rem', borderTop: `1px solid rgba(${primaryRgb},0.08)`, color: theme.textSecondary, fontSize: '0.72rem', display: 'flex', gap: '1rem' }}>
        <span>Показано: {sorted.length} из {tasks.length}</span>
        {hasFilters && <span style={{ color: theme.primary }}>• Применены фильтры</span>}
      </div>
    </div>
  );
}
