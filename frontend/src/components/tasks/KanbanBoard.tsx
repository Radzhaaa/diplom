import { useState, useRef } from 'react';
import { Zap, AlertCircle, ArrowUp, Minus, Clock, User as UserIcon } from 'lucide-react';
import { api, Task } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getGlassCardStyle, hexToRgb } from '../../utils/glassStyles';

type TaskStatus = Task['status'];

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'NEW',         label: 'Новые',       color: '#6366f1' },
  { status: 'IN_PROGRESS', label: 'В работе',    color: '#f59e0b' },
  { status: 'IN_REVIEW',   label: 'На проверке', color: '#8b5cf6' },
  { status: 'COMPLETED',   label: 'Завершены',   color: '#10b981' },
  { status: 'CANCELLED',   label: 'Отменены',    color: '#ef4444' },
];

const PRIORITY_CONFIG: Record<Task['priority'], { label: string; color: string }> = {
  LOW:      { label: 'Низкий',     color: '#3b82f6' },
  MEDIUM:   { label: 'Средний',    color: '#eab308' },
  HIGH:     { label: 'Высокий',    color: '#f97316' },
  CRITICAL: { label: 'Критичный',  color: '#ef4444' },
};

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const size = 'w-3.5 h-3.5';
  if (priority === 'CRITICAL' || priority === 'HIGH') return <AlertCircle className={size} />;
  if (priority === 'MEDIUM') return <ArrowUp className={size} />;
  return <Minus className={size} />;
}

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onDragEnd: () => void;
  onClick: (taskId: number) => void;
  isDragging: boolean;
}

function KanbanCard({ task, onDragStart, onDragEnd, onClick, isDragging }: KanbanCardProps) {
  const { theme } = useTheme();
  const pConf = PRIORITY_CONFIG[task.priority];

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  const isOverdue = task.deadline && !task.completedAt && new Date(task.deadline) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task.id)}
      className="rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition-all select-none"
      style={{
        ...getGlassCardStyle(theme),
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        borderRadius: '0.875rem',
      }}
    >
      {/* Priority badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ color: pConf.color, backgroundColor: `${pConf.color}22` }}
        >
          <PriorityIcon priority={task.priority} />
          {pConf.label}
        </span>
        <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: '#eab308' }}>
          <Zap className="w-3 h-3 fill-yellow-400" />
          {task.xpReward}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium mb-2 line-clamp-2" style={{ color: theme.text }}>
        {task.title}
      </p>

      {/* Footer: assignee + deadline */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${theme.glassBorder}` }}>
        {task.assignedTo ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
            >
              {task.assignedTo.firstName?.charAt(0) ?? task.assignedTo.email.charAt(0)}
            </div>
            <span className="text-xs truncate" style={{ color: theme.textSecondary }}>
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1" style={{ color: theme.textSecondary }}>
            <UserIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Не назначен</span>
          </div>
        )}

        {task.deadline && (
          <span
            className="flex items-center gap-1 text-xs shrink-0"
            style={{ color: isOverdue ? '#ef4444' : theme.textSecondary }}
          >
            <Clock className="w-3 h-3" />
            {formatDate(task.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  draggingId: number | null;
  onTaskClick: (taskId: number) => void;
}

function KanbanColumn({
  status, label, color, tasks,
  onDragStart, onDragEnd, onDrop, draggingId, onTaskClick,
}: KanbanColumnProps) {
  const { theme } = useTheme();
  const [isOver, setIsOver] = useState(false);
  const primaryRgb = hexToRgb(theme.primary);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };
  const handleDragLeave = () => setIsOver(false);
  const handleDrop = (e: React.DragEvent) => {
    setIsOver(false);
    onDrop(e, status);
  };

  return (
    <div
      className="flex flex-col rounded-2xl min-h-[400px] transition-all"
      style={{
        background: isOver
          ? `rgba(${hexToRgb(color)}, 0.12)`
          : `rgba(${primaryRgb}, 0.07)`,
        border: `1.5px solid ${isOver ? color : `rgba(${primaryRgb}, 0.18)`}`,
        minWidth: 240,
        maxWidth: 300,
        flex: '1 1 240px',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
        style={{ borderBottom: `1px solid rgba(${primaryRgb}, 0.15)` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-semibold text-sm" style={{ color: theme.text }}>{label}</span>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 p-3 flex-1">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onTaskClick}
            isDragging={draggingId === task.id}
          />
        ))}

        {/* Drop hint when column is empty and dragging */}
        {tasks.length === 0 && draggingId !== null && (
          <div
            className="flex-1 rounded-xl flex items-center justify-center text-sm"
            style={{
              border: `2px dashed ${color}55`,
              minHeight: 80,
              color: theme.textSecondary,
            }}
          >
            Перетащите сюда
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: number) => void;
  onTaskStatusChange: (taskId: number, newStatus: TaskStatus) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onTaskStatusChange }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragTaskId = useRef<number | null>(null);

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    dragTaskId.current = taskId;
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragTaskId.current = null;
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = dragTaskId.current;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    onTaskStatusChange(taskId, newStatus);
  };

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4"
      style={{ minHeight: 500 }}
    >
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          label={col.label}
          color={col.color}
          tasks={tasksByStatus(col.status)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          draggingId={draggingId}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
