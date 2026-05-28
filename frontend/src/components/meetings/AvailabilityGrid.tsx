import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
const DAYS  = 7;

interface AvailabilityGridProps {
  projectId?: number | null;
  editable?: boolean;
}

function getMondayOf(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function AvailabilityGrid({ projectId, editable = true }: AvailabilityGridProps) {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [mySlots, setMySlots] = useState<Record<string, Set<number>>>({});
  const [heatmap, setHeatmap] = useState<Record<string, Record<string, number>>>({});
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dragging = useRef(false);
  const dragMode = useRef<'add' | 'remove'>('add');

  const weekDays = Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i));
  const weekStartStr = isoDate(weekStart);


  React.useEffect(() => {
    setLoading(true);
    if (editable && !projectId) {
      api.getMyAvailability(weekStartStr)
        .then(data => {
          const slotsMap: Record<string, Set<number>> = {};
          for (const [date, hours] of Object.entries(data)) {
            slotsMap[date] = new Set(hours);
          }
          setMySlots(slotsMap);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (projectId) {
      api.getProjectHeatmap(projectId, weekStartStr)
        .then(data => {
          setHeatmap(data);
          let max = 0;
          Object.values(data).forEach(day => Object.values(day).forEach(c => { if (c > max) max = c; }));
          setTotalMembers(max);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [weekStartStr, projectId, editable]);


  const toggleCell = useCallback((date: string, hour: number, forceMode?: 'add' | 'remove') => {
    if (!editable) return;
    setMySlots(prev => {
      const next = { ...prev };
      const set = new Set(next[date] ?? []);
      const mode = forceMode ?? dragMode.current;
      if (mode === 'add') set.add(hour); else set.delete(hour);
      next[date] = set;
      return next;
    });
  }, [editable]);

  const handleMouseDown = (date: string, hour: number) => {
    if (!editable) return;
    dragging.current = true;
    const has = mySlots[date]?.has(hour);
    dragMode.current = has ? 'remove' : 'add';
    toggleCell(date, hour, dragMode.current);
  };

  const handleMouseEnter = (date: string, hour: number) => {
    if (!dragging.current || !editable) return;
    toggleCell(date, hour, dragMode.current);
  };

  const stopDrag = () => { dragging.current = false; };


  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, number[]> = {};
      for (const day of weekDays) {
        const ds = isoDate(day);
        payload[ds] = Array.from(mySlots[ds] ?? []).sort((a, b) => a - b);
      }
      await api.saveMyAvailability(payload);
      toast.success('Доступность сохранена');
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };


  function cellColor(date: string, hour: number): string {
    if (projectId) {
      const count = heatmap[date]?.[String(hour)] ?? 0;
      if (count === 0) return 'transparent';
      const alpha = Math.min(0.15 + (count / Math.max(totalMembers, 1)) * 0.7, 0.85);
      return `rgba(${rgb}, ${alpha.toFixed(2)})`;
    } else {
      return mySlots[date]?.has(hour) ? `rgba(${rgb}, 0.55)` : 'transparent';
    }
  }

  function cellBorder(date: string, hour: number): string {
    const base = `1px solid rgba(${rgb}, 0.15)`;
    if (!projectId && mySlots[date]?.has(hour)) return `1px solid rgba(${rgb}, 0.5)`;
    return base;
  }


  return (
    <div
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      style={{ userSelect: 'none' }}
    >
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          style={{ background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.2)`, borderRadius: '0.5rem', padding: '0.35rem 0.6rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 600, color: theme.text, fontSize: '0.9rem' }}>
          {format(weekStart, 'd MMM', { locale: ru })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}
        </span>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          style={{ background: `rgba(${rgb}, 0.1)`, border: `1px solid rgba(${rgb}, 0.2)`, borderRadius: '0.5rem', padding: '0.35rem 0.6rem', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center' }}
        >
          <ChevronRight size={16} />
        </button>
        {editable && !projectId && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', borderRadius: '0.6rem', padding: '0.4rem 0.9rem', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
            Сохранить
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader size={28} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 52 }} />
              {weekDays.map((_, i) => <col key={i} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '0.25rem', fontSize: '0.7rem', color: theme.textSecondary }} />
                {weekDays.map(day => (
                  <th key={day.toISOString()} style={{ padding: '0.25rem 0.15rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: theme.text }}>
                    <div>{format(day, 'EEE', { locale: ru })}</div>
                    <div style={{ color: theme.textSecondary, fontWeight: 400 }}>{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '1px 4px', textAlign: 'right', fontSize: '0.68rem', color: theme.textSecondary, whiteSpace: 'nowrap' }}>
                    {hour}:00
                  </td>
                  {weekDays.map(day => {
                    const ds = isoDate(day);
                    return (
                      <td
                        key={ds}
                        onMouseDown={() => handleMouseDown(ds, hour)}
                        onMouseEnter={() => handleMouseEnter(ds, hour)}
                        style={{
                          height: 24,
                          cursor: editable && !projectId ? 'pointer' : 'default',
                          background: cellColor(ds, hour),
                          border: cellBorder(ds, hour),
                          borderRadius: 3,
                          transition: 'background 0.1s',
                          position: 'relative',
                        }}
                        title={projectId
                          ? `${format(day, 'd MMM', { locale: ru })} ${hour}:00 — ${heatmap[ds]?.[String(hour)] ?? 0} из ${totalMembers} доступны`
                          : undefined
                        }
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {projectId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: theme.textSecondary }}>
          <span>Меньше</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(a => (
            <span key={a} style={{ width: 18, height: 18, borderRadius: 3, background: `rgba(${rgb}, ${a})`, display: 'inline-block' }} />
          ))}
          <span>Больше участников</span>
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: theme.textSecondary }}>
          Кликайте по ячейкам или перетаскивайте, чтобы отметить свою доступность
        </div>
      )}
    </div>
  );
}
