import React, { useState, useEffect, useCallback } from 'react';
import { api, Meeting } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { PersonalPlanner } from '../planner/PersonalPlanner';
import { PersonalTasks } from '../planner/PersonalTasks';
import { Notes } from '../Notes';
import { CreateMeetingModal, downloadIcs } from './CreateMeetingModal';
import { AvailabilityGrid } from './AvailabilityGrid';
import {
  CalendarDays, Plus, Video, Clock, ChevronDown, ChevronUp,
  Loader, ExternalLink, XCircle, Trash2, Sparkles, Download, LayoutList,
  ListTodo, StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

// Re-export for consumers that import CreateMeetingModal from this file
export { CreateMeetingModal } from './CreateMeetingModal';


interface MeetingsProps {
  projectId?: number | null;
  onNavigateToProject?: (id: number) => void;
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Запланировано', CANCELLED: 'Отменено', COMPLETED: 'Завершено',
};
const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#3b82f6', CANCELLED: '#6b7280', COMPLETED: '#10b981',
};


function MeetingWidget({ meeting, currentUserId, onCancel, onDelete, onNavigateToProject, onGenerateTasks }: {
  meeting: Meeting;
  currentUserId?: number;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigateToProject?: (id: number) => void;
  onGenerateTasks?: (id: number) => void;
}) {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  const glassStyle = getGlassCardStyle(theme);
  const [expanded, setExpanded] = useState(false);

  const isOrganizer = meeting.organizer?.id === currentUserId;
  const isUpcoming  = isFuture(parseISO(meeting.dateTime));
  const statusColor = STATUS_COLOR[meeting.status] ?? '#6b7280';

  return (
    <div style={{ ...glassStyle, borderRadius: '0.875rem', padding: '0.875rem 1rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: '0.6rem', background: `rgba(${rgb}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Video size={15} style={{ color: theme.primary }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.title}</span>
            <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', background: `${statusColor}22`, color: statusColor, fontWeight: 600, flexShrink: 0 }}>{STATUS_LABEL[meeting.status]}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: theme.textSecondary, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={11} /> {format(parseISO(meeting.dateTime), 'd MMM, HH:mm', { locale: ru })} · {meeting.durationMinutes} мин
          </div>
          {meeting.projectName && (
            <div onClick={() => meeting.projectId && onNavigateToProject?.(meeting.projectId)} style={{ fontSize: '0.72rem', color: theme.primary, marginTop: '0.15rem', cursor: meeting.projectId ? 'pointer' : 'default' }}>
              {meeting.projectName}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
          {meeting.status === 'SCHEDULED' && isUpcoming && (
            <a href={meeting.jitsiLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', borderRadius: '0.45rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: '#fff', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}>
              <Video size={10} /> Войти
            </a>
          )}
          <button onClick={e => { e.stopPropagation(); downloadIcs([meeting], `meeting-${meeting.id}.ics`); }} title="Скачать .ics" style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
            <Download size={13} />
          </button>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '0.2rem' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: `1px solid rgba(${rgb}, 0.1)` }}>
          {meeting.description && <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: theme.textSecondary, lineHeight: 1.5 }}>{meeting.description}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Video size={12} style={{ color: theme.primary, flexShrink: 0 }} />
            <a href={meeting.jitsiLink} target="_blank" rel="noreferrer" style={{ color: theme.primary, textDecoration: 'none', fontSize: '0.72rem', wordBreak: 'break-all' }}>{meeting.jitsiLink}</a>
            <ExternalLink size={11} style={{ color: theme.textSecondary, flexShrink: 0 }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
            {[meeting.organizer, ...meeting.participants].map(p => (
              <span key={p.id} style={{ padding: '0.15rem 0.5rem', borderRadius: '1rem', background: `rgba(${rgb}, 0.1)`, fontSize: '0.72rem', color: theme.text }}>
                {p.firstName} {p.lastName}{p.id === meeting.organizer.id && <span style={{ color: theme.primary, marginLeft: 3 }}>★</span>}
              </span>
            ))}
          </div>
          {meeting.projectId && onGenerateTasks && (
            <button onClick={() => onGenerateTasks(meeting.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '0.45rem', border: `1px solid rgba(${rgb}, 0.3)`, background: `rgba(${rgb}, 0.08)`, color: theme.primary, cursor: 'pointer', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
              <Sparkles size={12} /> Создать задачи AI
            </button>
          )}
          {isOrganizer && meeting.status === 'SCHEDULED' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => onCancel(meeting.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '0.45rem', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>
                <XCircle size={12} /> Отменить
              </button>
              <button onClick={() => onDelete(meeting.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '0.45rem', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: theme.textSecondary, cursor: 'pointer', fontSize: '0.75rem' }}>
                <Trash2 size={12} /> Удалить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export function Meetings({ projectId, onNavigateToProject }: MeetingsProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const [activeTab,   setActiveTab]   = useState<'planner' | 'meetings' | 'tasks' | 'notes'>('planner');
  const [meetings,    setMeetings]    = useState<Meeting[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [createOpen,  setCreateOpen]  = useState(false);

  const loadMeetings = useCallback(() => {
    setLoading(true);
    const req = projectId ? api.getProjectMeetings(projectId) : api.getMyMeetings();
    req.then(setMeetings).catch(() => {}).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const handleCancel = async (id: number) => {
    try { const updated = await api.cancelMeeting(id); setMeetings(prev => prev.map(m => m.id === id ? updated : m)); toast.success('Встреча отменена'); }
    catch { toast.error('Не удалось отменить встречу'); }
  };
  const handleDelete = async (id: number) => {
    try { await api.deleteMeeting(id); setMeetings(prev => prev.filter(m => m.id !== id)); toast.success('Встреча удалена'); }
    catch { toast.error('Не удалось удалить встречу'); }
  };
  const handleGenerateTasks = async (id: number) => {
    try { const tasks = await api.generateTasksFromMeeting(id); toast.success(`Создано ${tasks.length} задач по итогам встречи`); }
    catch { toast.error('Не удалось создать задачи'); }
  };

  const upcoming = meetings.filter(m => m.status === 'SCHEDULED' && isFuture(parseISO(m.dateTime)));
  const past     = meetings.filter(m => m.status !== 'SCHEDULED' || isPast(parseISO(m.dateTime)));

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarDays size={26} style={{ color: theme.primary }} />
          <div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: theme.text }}>{projectId ? 'Встречи проекта' : 'Планировщик'}</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textSecondary }}>
              {activeTab === 'planner' ? 'Личный календарь — задачи, встречи и заметки по дням' : activeTab === 'tasks' ? 'Личные задачи — создавайте и отслеживайте' : activeTab === 'notes' ? 'Личные заметки — сохраняйте идеи и мысли' : 'Доступность команды и запланированные встречи'}
            </p>
          </div>
        </div>
        {(activeTab === 'meetings' || !!projectId) && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {meetings.length > 0 && (
              <button onClick={() => { downloadIcs(meetings); toast.success('Файл .ics скачан'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '0.75rem', background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.25)`, color: theme.primary, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                <Download size={14} /> .ics
              </button>
            )}
            <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <Plus size={16} /> Создать встречу
            </button>
          </div>
        )}
      </div>

      {!projectId && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {([{ id: 'planner', label: 'Планировщик', Icon: LayoutList }, { id: 'tasks', label: 'Задачи', Icon: ListTodo }, { id: 'notes', label: 'Заметки', Icon: StickyNote }, { id: 'meetings', label: 'Встречи', Icon: Video }] as const).map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', borderRadius: '0.875rem', background: active ? `rgba(${rgb},0.14)` : `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},${active ? '0.3' : '0.1'})`, color: active ? theme.primary : theme.textSecondary, fontWeight: active ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'planner' && !projectId && <PersonalPlanner />}
      {activeTab === 'tasks' && !projectId && <PersonalTasks />}
      {activeTab === 'notes' && !projectId && <Notes />}

      {(activeTab === 'meetings' || !!projectId) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '1rem', color: theme.text }}>
                  Моя доступность
                </h3>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: theme.textSecondary }}>Отметьте, когда вы свободны — команда увидит это при планировании встреч</p>
                <AvailabilityGrid editable projectId={null} />
              </div>
              {projectId && (
                <div style={{ ...getGlassCardStyle(theme), borderRadius: '1rem', padding: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '1rem', color: theme.text }}>Доступность команды</h3>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: theme.textSecondary }}>Интенсивность цвета показывает, сколько участников свободно в каждый слот</p>
                  <AvailabilityGrid editable={false} projectId={projectId} />
                </div>
              )}
            </div>

            <div style={{ position: 'sticky', top: '5rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontWeight: 700, fontSize: '0.82rem', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Предстоящие · {upcoming.length}</h3>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader size={24} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
                </div>
              ) : upcoming.length === 0 ? (
                <div style={{ ...getGlassCardStyle(theme), borderRadius: '0.875rem', padding: '1.5rem', textAlign: 'center', color: theme.textSecondary, fontSize: '0.85rem' }}>
                  <CalendarDays size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p style={{ margin: '0 0 0.75rem' }}>Нет предстоящих встреч</p>
                  <button onClick={() => setCreateOpen(true)} style={{ padding: '0.4rem 0.9rem', borderRadius: '0.6rem', background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.2)`, color: theme.primary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Создать первую</button>
                </div>
              ) : upcoming.map(m => (
                <MeetingWidget key={m.id} meeting={m} currentUserId={user?.id} onCancel={handleCancel} onDelete={handleDelete} onNavigateToProject={onNavigateToProject} onGenerateTasks={handleGenerateTasks} />
              ))}

              {past.length > 0 && (
                <>
                  <h3 style={{ margin: '1rem 0 0.75rem', fontWeight: 700, fontSize: '0.82rem', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Прошедшие · {past.length}</h3>
                  {past.map(m => (
                    <MeetingWidget key={m.id} meeting={m} currentUserId={user?.id} onCancel={handleCancel} onDelete={handleDelete} onNavigateToProject={onNavigateToProject} onGenerateTasks={handleGenerateTasks} />
                  ))}
                </>
              )}
            </div>
          </div>

          {createOpen && (
            <CreateMeetingModal projectId={projectId} onClose={() => setCreateOpen(false)} onCreated={m => { setMeetings(prev => [m, ...prev]); setCreateOpen(false); }} />
          )}
        </>
      )}
    </div>
  );
}
