import React, { useState, useEffect, useCallback } from 'react';
import { api, Project, Task, RiskItem } from '../../services/api';
import { Sprints } from '../planner/Sprints';
import { GanttChart } from '../tasks/GanttChart';
import { KanbanBoard } from '../tasks/KanbanBoard';
import { ProjectTasksTable } from '../tasks/ProjectTasksTable';
import { ProjectCalendar } from './ProjectCalendar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectPermissions } from '../../hooks/useProjectPermissions';
import { useWebSocket } from '../../hooks/useWebSocket';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import {
  ArrowLeft, Plus, Users, Loader, Download, CalendarDays,
  CheckCircle2, Trash2, FolderCheck, AlertTriangle,
  Table2, GanttChartSquare, ShieldAlert, ChevronRight, Pencil, Check, LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateMeetingModal } from '../meetings/Meetings';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

interface ProjectDetailProps {
  projectId: number | null;
  onBack: () => void;
  onNavigateToTask: (taskId?: number) => void;
  onNavigateToAddTask: () => void;
  onNavigateToAddMember: () => void;
  onNavigateToMeetings?: () => void;
  onTasksReloaded?: () => void;
  onProjectUpdated?: () => void;
  tasksReloadKey?: number;
}

type ConfirmAction = 'complete' | 'delete' | null;

export function ProjectDetail({ projectId, onBack, onNavigateToTask, onNavigateToAddTask, onNavigateToAddMember, onProjectUpdated, tasksReloadKey }: ProjectDetailProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [activeTab,       setActiveTab]       = useState<'tasks' | 'kanban' | 'gantt' | 'calendar' | 'sprints'>('tasks');
  const [project,         setProject]         = useState<Project | null>(null);
  const [tasks,           setTasks]           = useState<Task[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [confirmAction,   setConfirmAction]   = useState<ConfirmAction>(null);
  const [pendingIds,      setPendingIds]      = useState<Set<number>>(new Set());
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [exportLoading,   setExportLoading]   = useState<'excel' | null>(null);
  const [risks,           setRisks]           = useState<RiskItem[]>([]);
  const [risksOpen,       setRisksOpen]       = useState(false);
  const [editOpen,        setEditOpen]        = useState(false);
  const [editName,        setEditName]        = useState('');
  const [editDesc,        setEditDesc]        = useState('');
  const [editStatus,      setEditStatus]      = useState('');
  const [editStartDate,   setEditStartDate]   = useState('');
  const [editEndDate,     setEditEndDate]     = useState('');
  const [editSaving,      setEditSaving]      = useState(false);

  const { token: wsToken } = useAuth();
  const { permissions } = useProjectPermissions(projectId);

  const { subscribe } = useWebSocket(wsToken);

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribe(`/topic/tasks/${projectId}`, () => {
      api.getTasks(projectId).then(t => setTasks(t)).catch(() => {});
    });
    return unsub;
  }, [projectId, subscribe]);

  const loadData = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([api.getProject(projectId), api.getTasks(projectId)])
      .then(([p, t]) => { setProject(p); setTasks(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.getRiskForecast(projectId).then(setRisks).catch(() => {});
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (tasksReloadKey === undefined || !projectId) return;
    api.getTasks(projectId).then(t => setTasks(t)).catch(() => {});
  }, [tasksReloadKey, projectId]);


  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    setPendingIds(prev => new Set(prev).add(taskId));
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      toast.error('Не удалось изменить статус');
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(taskId); return s; });
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      await api.updateProject(projectId, { status: 'COMPLETED' });
      toast.success('Проект завершён');
      setConfirmAction(null);
      loadData();
      onProjectUpdated?.();
    } catch (e: any) {
      toast.error(e?.message ?? 'Не удалось завершить проект');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      await api.deleteProject(projectId);
      toast.success('Проект удалён');
      setConfirmAction(null);
      onBack();
    } catch (e: any) {
      toast.error(e?.message ?? 'Не удалось удалить проект');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditOpen = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description ?? '');
    setEditStatus(project.status);
    setEditStartDate((project as any).startDate ? (project as any).startDate.slice(0, 10) : '');
    setEditEndDate((project as any).endDate ? (project as any).endDate.slice(0, 10) : '');
    setEditOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setEditSaving(true);
    try {
      const updated = await api.updateProject(projectId, {
        name: editName,
        description: editDesc,
        status: editStatus as Project['status'],
        ...(editStartDate ? { startDate: editStartDate + 'T00:00:00' } : {}),
        ...(editEndDate ? { endDate: editEndDate + 'T00:00:00' } : {}),
      } as any);
      setProject(updated);
      setEditOpen(false);
      toast.success('Проект обновлён');
      onProjectUpdated?.();
    } catch (e: any) {
      toast.error(e?.message ?? 'Не удалось сохранить');
    } finally {
      setEditSaving(false);
    }
  };

  const handleExport = async () => {
    if (!projectId) return;
    setExportLoading('excel');
    try {
      const blob = await api.exportProject(projectId, 'excel');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка экспорта');
    } finally {
      setExportLoading(null);
    }
  };


  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!project) return <div style={{ padding: '2rem', color: theme.textSecondary }}>Проект не найден</div>;

  const allTasks  = tasks;
  const done      = allTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
  const isCompleted = project.status === 'COMPLETED' || project.status === 'CANCELLED';

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Назад к проектам
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: theme.text, fontWeight: 800, fontSize: '1.75rem', margin: 0 }}>{project.name}</h1>
          {project.description && <p style={{ color: theme.textSecondary, marginTop: '0.375rem' }}>{project.description}</p>}
          {isCompleted && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', fontSize: '0.8125rem', padding: '3px 10px', borderRadius: '99px', background: project.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: project.status === 'COMPLETED' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              {project.status === 'COMPLETED' ? 'Проект завершён' : 'Проект отменён'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={onNavigateToAddMember} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.1)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            <Users size={16} /> Участники
          </button>
          {permissions?.canEdit && (
            <button onClick={handleEditOpen} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.1)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
              <Pencil size={16} /> Редактировать
            </button>
          )}
          <button onClick={handleExport} disabled={exportLoading !== null} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.1)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: exportLoading !== null ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.875rem', opacity: exportLoading !== null ? 0.7 : 1 }}>
            <Download size={16} /> {exportLoading === 'excel' ? '...' : 'Excel'}
          </button>
          <button onClick={() => setCreateMeetingOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.1)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            <CalendarDays size={16} /> Создать встречу
          </button>
          {(permissions?.canCreateTask ?? true) && !isCompleted && (
            <button onClick={onNavigateToAddTask} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              <Plus size={16} /> Добавить задачу
            </button>
          )}
          {permissions?.canEdit && !isCompleted && (
            <button onClick={() => setConfirmAction('complete')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              <FolderCheck size={16} /> Завершить
            </button>
          )}
          {permissions?.canDelete && (
            <button onClick={() => setConfirmAction('delete')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              <Trash2 size={16} /> Удалить
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Всего задач', value: allTasks.length },
          { label: 'Выполнено',   value: done },
          { label: 'В работе',    value: allTasks.filter(t => t.status === 'IN_PROGRESS').length },
          { label: 'Участники',   value: project.memberCount ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...getGlassCardStyle(theme), padding: '1rem' }}>
            <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ color: theme.text, fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Risk forecast panel (3.3) ────────────────────────────────────── */}
      {risks.length > 0 && (
        <div style={{ marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.875rem', background: 'rgba(239,68,68,0.05)', overflow: 'hidden' }}>
          <button onClick={() => setRisksOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 700, fontSize: '0.875rem', textAlign: 'left' }}>
            <ShieldAlert size={16} />
            Прогноз рисков: {risks.length} задач
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 500, color: theme.textSecondary }}>
              {risks.filter(r => r.riskLevel === 'HIGH').length} высокий ·{' '}
              {risks.filter(r => r.riskLevel === 'MEDIUM').length} средний ·{' '}
              {risks.filter(r => r.riskLevel === 'LOW').length} низкий
            </span>
            <ChevronRight size={14} style={{ color: theme.textSecondary, transform: risksOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {risksOpen && (
            <div style={{ padding: '0 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {risks.map(r => {
                const levelColor = r.riskLevel === 'HIGH' ? '#ef4444' : r.riskLevel === 'MEDIUM' ? '#f59e0b' : '#6366f1';
                const levelLabel = r.riskLevel === 'HIGH' ? 'Высокий' : r.riskLevel === 'MEDIUM' ? 'Средний' : 'Низкий';
                return (
                  <div key={r.taskId} onClick={() => onNavigateToTask(r.taskId)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: `${levelColor}10`, cursor: 'pointer', border: `1px solid ${levelColor}25`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${levelColor}20`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${levelColor}10`)}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: levelColor, padding: '1px 6px', borderRadius: '99px', background: `${levelColor}18`, whiteSpace: 'nowrap', flexShrink: 0 }}>{levelLabel}</span>
                    <span style={{ fontSize: '0.8125rem', color: theme.text, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.taskTitle}</span>
                    <span style={{ fontSize: '0.75rem', color: theme.textSecondary, flexShrink: 0 }}>{r.reason}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {([
          { id: 'tasks',    label: 'Задачи',          Icon: Table2 },
          { id: 'kanban',   label: 'Канбан',          Icon: LayoutGrid },
          { id: 'gantt',    label: 'Диаграмма Ганта', Icon: GanttChartSquare },
          { id: 'calendar', label: 'Календарь',       Icon: CalendarDays },
          { id: 'sprints',  label: 'Спринты',         Icon: null },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 1rem', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontSize: '0.8125rem', fontWeight: 600,
              background: activeTab === id ? `rgba(${hexToRgb(theme.primary)}, 0.15)` : 'rgba(255,255,255,0.04)',
              color: activeTab === id ? theme.primary : theme.textSecondary,
              outline: activeTab === id ? `1px solid rgba(${hexToRgb(theme.primary)}, 0.3)` : '1px solid transparent',
            }}
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <ProjectTasksTable
          tasks={allTasks}
          pendingIds={pendingIds}
          onNavigateToTask={id => onNavigateToTask(id)}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={allTasks}
          onTaskClick={id => onNavigateToTask(id)}
          onTaskStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'gantt' && (
        <div style={{ marginTop: '0.25rem' }}>
          <GanttChart tasks={tasks} onTaskClick={id => onNavigateToTask(id)} />
        </div>
      )}

      {activeTab === 'calendar' && (
        <ProjectCalendar
          projectId={project.id}
          tasks={allTasks}
          onTaskClick={id => onNavigateToTask(id)}
        />
      )}

      {activeTab === 'sprints' && (
        <Sprints projectId={project.id} onNavigateToTask={id => onNavigateToTask(id)} />
      )}

      {/* ── Confirm modal ─────────────────────────────────────────────────── */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => !actionLoading && setConfirmAction(null)}
        >
          <div style={{ ...getGlassCardStyle(theme), padding: '2rem', borderRadius: '1.25rem', maxWidth: '420px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: confirmAction === 'delete' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' }}>
                {confirmAction === 'delete' ? <AlertTriangle size={22} style={{ color: '#ef4444' }} /> : <FolderCheck size={22} style={{ color: '#10b981' }} />}
              </div>
              <div>
                <div style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem' }}>
                  {confirmAction === 'delete' ? 'Удалить проект?' : 'Завершить проект?'}
                </div>
                <div style={{ color: theme.textSecondary, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {confirmAction === 'delete'
                    ? `Проект «${project.name}» будет удалён. Это действие нельзя отменить.`
                    : `Проект «${project.name}» будет отмечен как завершённый.`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} disabled={actionLoading} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb},0.08)`, border: `1px solid rgba(${primaryRgb},0.15)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                Отмена
              </button>
              <button
                onClick={confirmAction === 'delete' ? handleDeleteProject : handleCompleteProject}
                disabled={actionLoading}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: confirmAction === 'delete' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', border: 'none', color: '#fff', cursor: actionLoading ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {actionLoading && (
                  <svg width="14" height="14" viewBox="0 0 22 22" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="11" cy="11" r="9" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="40 20" strokeLinecap="round" />
                  </svg>
                )}
                {confirmAction === 'delete' ? 'Удалить' : 'Завершить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createMeetingOpen && (
        <CreateMeetingModal
          projectId={projectId}
          onClose={() => setCreateMeetingOpen(false)}
          onCreated={() => setCreateMeetingOpen(false)}
        />
      )}

      {/* ── Edit project modal ─────────────────────────────────────────────── */}
      {editOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => !editSaving && setEditOpen(false)}
        >
          <div style={{ ...getGlassCardStyle(theme), padding: '2rem', borderRadius: '1.25rem', maxWidth: '500px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem', margin: '0 0 1.5rem' }}>Редактировать проект</h2>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Название *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required
                  style={{ width: '100%', boxSizing: 'border-box', background: `rgba(${primaryRgb},0.07)`, border: `1px solid rgba(${primaryRgb},0.18)`, borderRadius: '0.625rem', padding: '0.625rem 0.875rem', color: theme.text, fontSize: '0.9375rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Описание</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: `rgba(${primaryRgb},0.07)`, border: `1px solid rgba(${primaryRgb},0.18)`, borderRadius: '0.625rem', padding: '0.625rem 0.875rem', color: theme.text, fontSize: '0.9375rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Статус</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger style={{ background: `rgba(${primaryRgb},0.07)`, border: `1px solid rgba(${primaryRgb},0.18)`, color: theme.text }}>
                    <SelectValue>{{ PLANNING: 'Планирование', ACTIVE: 'Активный', ON_HOLD: 'Приостановлен', COMPLETED: 'Завершён', CANCELLED: 'Отменён' }[editStatus]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Планирование</SelectItem>
                    <SelectItem value="ACTIVE">Активный</SelectItem>
                    <SelectItem value="ON_HOLD">Приостановлен</SelectItem>
                    <SelectItem value="COMPLETED">Завершён</SelectItem>
                    <SelectItem value="CANCELLED">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Дата начала</label>
                  <DatePicker value={editStartDate} onChange={setEditStartDate} placeholder="Начало" />
                </div>
                <div>
                  <label style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Дата окончания</label>
                  <DatePicker value={editEndDate} onChange={setEditEndDate} placeholder="Окончание" min={editStartDate || undefined} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditOpen(false)} disabled={editSaving}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb},0.08)`, border: `1px solid rgba(${primaryRgb},0.15)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                  Отмена
                </button>
                <button type="submit" disabled={editSaving || !editName.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: editSaving ? 'wait' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: editSaving ? 0.7 : 1 }}>
                  {editSaving ? '...' : <><Check size={14} /> Сохранить</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
