import React, { useMemo, useRef } from 'react';
import { Task } from '../../services/api';
import { format, differenceInDays, startOfDay, addDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';

const CELL_WIDTH = 28; // pixels per day
const ROW_HEIGHT = 42;
const LEFT_COL_WIDTH = 220;
const HEADER_HEIGHT = 52; // month + day rows combined

const STATUS_BAR_COLOR: Record<string, string> = {
  NEW:         '#6366f1',
  TODO:        '#6366f1',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW:   '#8b5cf6',
  DONE:        '#10b981',
  COMPLETED:   '#10b981',
  BLOCKED:     '#ef4444',
  CANCELLED:   '#6b7280',
};

interface GanttChartProps {
  tasks: Task[];
  onTaskClick?: (taskId: number) => void;
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const scrollRef = useRef<HTMLDivElement>(null);

  const validTasks = useMemo(
    () => tasks.filter(t => t.createdAt || t.deadline),
    [tasks]
  );

  const { rangeStart, totalDays } = useMemo(() => {
    if (validTasks.length === 0) {
      const now = new Date();
      return { rangeStart: startOfDay(addDays(now, -7)), totalDays: 45 };
    }
    const dates: number[] = [];
    for (const t of validTasks) {
      if (t.createdAt) dates.push(new Date(t.createdAt).getTime());
      if (t.deadline)  dates.push(new Date(t.deadline).getTime());
    }
    const min = startOfDay(addDays(new Date(Math.min(...dates)), -4));
    const max = startOfDay(addDays(new Date(Math.max(...dates)),  8));
    const diff = Math.max(differenceInDays(max, min) + 1, 30);
    return { rangeStart: min, totalDays: diff };
  }, [validTasks]);

  const today      = startOfDay(new Date());
  const todayLeft  = differenceInDays(today, rangeStart) * CELL_WIDTH;
  const totalWidth = totalDays * CELL_WIDTH;

  const months = useMemo(() => {
    const result: { label: string; left: number; width: number }[] = [];
    let cur = new Date(rangeStart);
    const end = addDays(rangeStart, totalDays);
    while (cur < end) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const clampedEnd = next < end ? next : end;
      result.push({
        label: format(cur, 'LLLL yyyy', { locale: ru }),
        left:  differenceInDays(cur, rangeStart) * CELL_WIDTH,
        width: differenceInDays(clampedEnd, cur) * CELL_WIDTH,
      });
      cur = next;
    }
    return result;
  }, [rangeStart, totalDays]);

  const weekTicks = useMemo(() => {
    const result: { left: number; label: string }[] = [];
    for (let i = 0; i < totalDays; i += 7) {
      const d = addDays(rangeStart, i);
      result.push({ left: i * CELL_WIDTH, label: format(d, 'd', { locale: ru }) });
    }
    return result;
  }, [rangeStart, totalDays]);

  const getBar = (task: Task) => {
    const start  = task.createdAt ? startOfDay(parseISO(task.createdAt)) : today;
    const endRaw = task.deadline  ? startOfDay(parseISO(task.deadline))  : addDays(start, 7);
    const leftDays  = differenceInDays(start,  rangeStart);
    const widthDays = Math.max(differenceInDays(endRaw, start), 1);
    const left  = leftDays  * CELL_WIDTH;
    const width = Math.max(widthDays * CELL_WIDTH, 24);
    const isOverdue = task.deadline && new Date(task.deadline) < today
      && task.status !== 'DONE' && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
    const color = STATUS_BAR_COLOR[task.status] ?? '#6366f1';
    return { left, width, color, isOverdue: !!isOverdue };
  };

  if (validTasks.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: theme.textSecondary, fontSize: '0.9rem' }}>
        Нет задач для диаграммы Ганта. Добавьте задачи с дедлайном.
      </div>
    );
  }

  const totalHeight = validTasks.length * ROW_HEIGHT;

  return (
    <div style={{
      display: 'flex',
      border: `1px solid rgba(${primaryRgb},0.12)`,
      borderRadius: '0.875rem',
      overflow: 'hidden',
      background: `rgba(${primaryRgb},0.02)`,
    }}>
      {/* ── Fixed left column ── */}
      <div style={{
        flexShrink: 0,
        width: LEFT_COL_WIDTH,
        borderRight: `1px solid rgba(${primaryRgb},0.1)`,
        position: 'sticky',
        left: 0,
        zIndex: 10,
        background: theme.surface,
      }}>
        {/* Header cell */}
        <div style={{
          height: HEADER_HEIGHT,
          display: 'flex', alignItems: 'center',
          padding: '0 1rem',
          borderBottom: `1px solid rgba(${primaryRgb},0.1)`,
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: theme.textSecondary,
          background: `rgba(${primaryRgb},0.04)`,
        }}>
          Задача
        </div>

        {/* Task name rows */}
        {validTasks.map((task, i) => {
          const isOverdue = task.deadline && new Date(task.deadline) < today
            && task.status !== 'DONE' && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task.id)}
              style={{
                height: ROW_HEIGHT,
                display: 'flex', alignItems: 'center',
                padding: '0 0.75rem',
                borderBottom: `1px solid rgba(${primaryRgb},0.05)`,
                cursor: 'pointer',
                gap: '0.5rem',
                background: i % 2 === 0 ? 'transparent' : `rgba(${primaryRgb},0.018)`,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb},0.07)`)}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : `rgba(${primaryRgb},0.018)`)}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: STATUS_BAR_COLOR[task.status] ?? '#6366f1',
              }} />
              <span style={{
                flex: 1, fontSize: '0.8125rem',
                color: isOverdue ? '#ef4444' : theme.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {task.title}
              </span>
              {task.assignedTo && (
                <span style={{
                  flexShrink: 0,
                  width: 22, height: 22, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                }}>
                  {(task.assignedTo.firstName?.[0] ?? task.assignedTo.email[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scrollable timeline ── */}
      <div style={{ flex: 1, overflowX: 'auto', minWidth: 0 }} ref={scrollRef}>
        <div style={{ position: 'relative', width: totalWidth, minWidth: '100%' }}>

          {/* Month header row */}
          <div style={{
            height: 28,
            position: 'relative',
            borderBottom: `1px solid rgba(${primaryRgb},0.08)`,
            background: `rgba(${primaryRgb},0.04)`,
          }}>
            {months.map(m => (
              <div
                key={m.label}
                style={{
                  position: 'absolute', left: m.left, width: m.width,
                  height: '100%',
                  display: 'flex', alignItems: 'center', paddingLeft: '0.5rem',
                  fontSize: '0.7rem', fontWeight: 700, color: theme.textSecondary,
                  letterSpacing: '0.04em',
                  borderLeft: m.left > 0 ? `1px solid rgba(${primaryRgb},0.12)` : 'none',
                  overflow: 'hidden', whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Week-day label row */}
          <div style={{
            height: 24,
            position: 'relative',
            borderBottom: `1px solid rgba(${primaryRgb},0.08)`,
            background: `rgba(${primaryRgb},0.02)`,
          }}>
            {weekTicks.map(d => (
              <div
                key={d.left}
                style={{
                  position: 'absolute', left: d.left, width: CELL_WIDTH * 7,
                  height: '100%',
                  display: 'flex', alignItems: 'center', paddingLeft: 4,
                  fontSize: '0.65rem', color: theme.textSecondary,
                  borderLeft: `1px solid rgba(${primaryRgb},0.06)`,
                }}
              >
                {d.label}
              </div>
            ))}
          </div>

          {/* Task rows + bars */}
          <div style={{ position: 'relative', height: totalHeight }}>

            {/* Grid lines */}
            {weekTicks.map(d => (
              <div key={d.left} style={{
                position: 'absolute', left: d.left, top: 0, bottom: 0,
                width: 1, background: `rgba(${primaryRgb},0.05)`,
              }} />
            ))}

            {/* Today marker */}
            {todayLeft >= 0 && todayLeft <= totalWidth && (
              <div style={{
                position: 'absolute',
                left: todayLeft + CELL_WIDTH / 2,
                top: 0, bottom: 0,
                width: 2,
                background: `rgba(${primaryRgb},0.65)`,
                zIndex: 5,
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: -18,
                  fontSize: '0.6rem', fontWeight: 700, color: theme.primary,
                  background: theme.surface,
                  padding: '1px 5px', borderRadius: 4,
                  whiteSpace: 'nowrap',
                  border: `1px solid rgba(${primaryRgb},0.25)`,
                }}>
                  сегодня
                </div>
              </div>
            )}

            {/* Row backgrounds + bars */}
            {validTasks.map((task, i) => {
              const { left, width, color, isOverdue } = getBar(task);
              const top = i * ROW_HEIGHT;
              return (
                <React.Fragment key={task.id}>
                  {/* Stripe */}
                  <div style={{
                    position: 'absolute', top, left: 0, right: 0, height: ROW_HEIGHT,
                    background: i % 2 === 0 ? 'transparent' : `rgba(${primaryRgb},0.015)`,
                    borderBottom: `1px solid rgba(${primaryRgb},0.04)`,
                  }} />

                  {/* Bar */}
                  <div
                    onClick={() => onTaskClick?.(task.id)}
                    title={[
                      task.title,
                      task.assignedTo ? `${task.assignedTo.firstName ?? ''} ${task.assignedTo.lastName ?? ''}`.trim() : '',
                      task.deadline ? `Дедлайн: ${format(new Date(task.deadline), 'd MMM yyyy', { locale: ru })}` : 'Без дедлайна',
                    ].filter(Boolean).join('\n')}
                    style={{
                      position: 'absolute',
                      top: top + 7,
                      left: Math.max(left, 0),
                      width: Math.min(width, totalWidth - Math.max(left, 0)),
                      height: ROW_HEIGHT - 14,
                      background: isOverdue ? 'rgba(239,68,68,0.18)' : `${color}22`,
                      border: `1.5px solid ${isOverdue ? '#ef4444' : color}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      padding: '0 0.5rem',
                      overflow: 'hidden',
                      zIndex: 3,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      color: isOverdue ? '#ef4444' : color,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {width > 44 ? task.title : ''}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
