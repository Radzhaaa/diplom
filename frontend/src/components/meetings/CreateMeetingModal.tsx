import React, { useState, useEffect, useRef } from 'react';
import { api, Meeting, MeetingSlotSuggestion, User } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { AvailabilityGrid } from './AvailabilityGrid';
import {
  CalendarDays, X, Loader, Sparkles, Check, Bell,
  ChevronDown, ChevronLeft, ChevronRight, Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, getDaysInMonth, startOfMonth, startOfWeek, getDay, isToday as dfIsToday } from 'date-fns';
import { ru } from 'date-fns/locale';

const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAY_SHORT_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const HOURS_LIST     = Array.from({ length: 14 }, (_, i) => i + 8);

export function generateIcs(meetings: Meeting[]): string {
  const fmt = (dt: string) => dt.replace(/[-:]/g, '').replace(/\.\d+/, '').replace(/T/, 'T').slice(0, 15) + 'Z';
  const escape = (s: string) => (s ?? '').replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const events = meetings.map(m => {
    const start = fmt(m.dateTime);
    const endMs = new Date(m.dateTime).getTime() + m.durationMinutes * 60000;
    const end = fmt(new Date(endMs).toISOString());
    return ['BEGIN:VEVENT', `UID:xproject-meeting-${m.id}@xproject`, `DTSTAMP:${fmt(new Date().toISOString())}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${escape(m.title)}`, m.description ? `DESCRIPTION:${escape(m.description)}` : '', `URL:${m.jitsiLink}`, 'END:VEVENT'].filter(Boolean).join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//XProject//Meeting//RU', ...events, 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(meetings: Meeting[], filename = 'xproject-meetings.ics') {
  const blob = new Blob([generateIcs(meetings)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function DurationSelect({ value, onChange, theme, rgb }: { value: number; onChange: (v: number) => void; theme: any; rgb: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [15, 30, 45, 60, 90, 120];
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, 0.25)`, background: `rgba(${rgb}, 0.05)`, color: theme.text, fontSize: '0.875rem', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' as const }}>
        <span>{value} мин</span>
        <ChevronDown size={14} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 400, background: theme.surface, border: `1px solid rgba(${rgb}, 0.2)`, borderRadius: '0.75rem', boxShadow: '0 8px 28px rgba(0,0,0,0.3)', padding: '0.25rem', overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} style={{ width: '100%', padding: '0.45rem 0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0.5rem', border: 'none', background: value === opt ? `rgba(${rgb}, 0.12)` : 'transparent', color: value === opt ? theme.primary : theme.text, fontSize: '0.875rem', fontWeight: value === opt ? 600 : 400, cursor: 'pointer' }}>
              {opt} мин {value === opt && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateTimePicker({ value, onChange, theme, rgb }: { value: string; onChange: (v: string) => void; theme: any; rgb: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const selDate = value ? value.substring(0, 10) : '';
  const selHour = value ? parseInt(value.substring(11, 13)) : 10;
  const selMin  = value ? parseInt(value.substring(14, 16)) : 0;
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }
  function pickDay(day: number) { const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; onChange(`${dateStr}T${String(selHour).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`); }
  function pickHour(h: number) { const dateStr = selDate || format(now, 'yyyy-MM-dd'); onChange(`${dateStr}T${String(h).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`); }
  function pickMin(m: number)  { const dateStr = selDate || format(now, 'yyyy-MM-dd'); onChange(`${dateStr}T${String(selHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`); }

  const daysInMonth  = getDaysInMonth(new Date(viewYear, viewMonth));
  const firstWeekday = (getDay(startOfMonth(new Date(viewYear, viewMonth))) + 6) % 7;
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const displayVal = value ? format(parseISO(value.length === 16 ? value + ':00' : value), "d MMM yyyy, HH:mm", { locale: ru }) : '';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, ${open ? 0.5 : 0.25})`, background: open ? `rgba(${rgb}, 0.08)` : `rgba(${rgb}, 0.05)`, color: displayVal ? theme.text : theme.textSecondary, fontSize: '0.875rem', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxSizing: 'border-box' as const, transition: 'border-color 0.2s, background 0.2s' }}>
        <CalendarDays size={14} style={{ color: theme.primary, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{displayVal || 'Выберите дату и время'}</span>
        <ChevronDown size={13} style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500, background: theme.surface, border: `1px solid rgba(${rgb}, 0.2)`, borderRadius: '1rem', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', padding: '1rem', display: 'flex', gap: '1rem', minWidth: 360 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '0.2rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></button>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: theme.text }}>{MONTH_NAMES_RU[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '0.2rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
              {DAY_SHORT_RU.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: theme.textSecondary, padding: '2px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSel  = dateStr === selDate;
                const isNow  = dfIsToday(new Date(viewYear, viewMonth, day));
                const isPast = new Date(viewYear, viewMonth, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return (
                  <button key={i} type="button" disabled={isPast} onClick={() => pickDay(day)} style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', border: 'none', background: isSel ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : isNow ? `rgba(${rgb}, 0.12)` : 'transparent', color: isSel ? '#fff' : isPast ? theme.textSecondary : theme.text, fontSize: '0.8rem', cursor: isPast ? 'default' : 'pointer', fontWeight: isSel ? 700 : 400, outline: isNow && !isSel ? `2px solid rgba(${rgb}, 0.4)` : 'none', outlineOffset: '-1px', opacity: isPast ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ width: 1, background: `rgba(${rgb}, 0.12)`, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 100 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Время</div>
            <div style={{ fontSize: '0.75rem', color: theme.textSecondary, marginBottom: 2 }}>Час</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px', maxHeight: 120, overflowY: 'auto' }}>
              {HOURS_LIST.map(h => (
                <button key={h} type="button" onClick={() => pickHour(h)} style={{ padding: '0.3rem 0', borderRadius: '0.4rem', border: 'none', background: selHour === h ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${rgb}, 0.05)`, color: selHour === h ? '#fff' : theme.text, fontSize: '0.78rem', fontWeight: selHour === h ? 700 : 400, cursor: 'pointer' }}>
                  {String(h).padStart(2, '0')}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: theme.textSecondary, marginTop: 4, marginBottom: 2 }}>Минуты</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {[0, 15, 30, 45].map(m => (
                <button key={m} type="button" onClick={() => pickMin(m)} style={{ padding: '0.35rem 0', borderRadius: '0.4rem', border: 'none', background: selMin === m ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${rgb}, 0.05)`, color: selMin === m ? '#fff' : theme.text, fontSize: '0.78rem', fontWeight: selMin === m ? 700 : 400, cursor: 'pointer' }}>
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            {selDate && (
              <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 'auto', padding: '0.4rem', borderRadius: '0.5rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Готово</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


interface CreateModalProps {
  projectId?: number | null;
  onClose: () => void;
  onCreated: (m: Meeting) => void;
}

function getMondayStr(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function CreateMeetingModal({ projectId, onClose, onCreated }: CreateModalProps) {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  const glassStyle = getGlassCardStyle(theme);

  const [title,         setTitle]         = useState('');
  const [description,   setDescription]   = useState('');
  const [dateTime,      setDateTime]      = useState('');
  const [duration,      setDuration]      = useState(60);
  const [members,       setMembers]       = useState<User[]>([]);
  const [selectedIds,   setSelectedIds]   = useState<Set<number>>(new Set());
  const [suggestions,   setSuggestions]   = useState<MeetingSlotSuggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    if (projectId) {
      api.getProjectMembers(projectId).then(data => {
        setMembers(data);
        setSelectedIds(new Set(data.map((m: User) => m.id)));
      }).catch(() => {});
    }
  }, [projectId]);

  const handleSuggest = async () => {
    if (!projectId) return;
    setLoadingSuggest(true);
    try {
      const monday = format(new Date(new Date().setDate(new Date().getDate() - ((new Date().getDay() + 6) % 7))), 'yyyy-MM-dd');
      const slots = await api.suggestMeetingSlots(projectId, monday, duration);
      setSuggestions(slots);
    } catch { toast.error('Не удалось получить предложения'); }
    finally { setLoadingSuggest(false); }
  };

  const handleCreate = async () => {
    if (!title.trim() || !dateTime) { toast.error('Введите название и дату встречи'); return; }
    setSaving(true);
    const dateTimeWithSeconds = dateTime.length === 16 ? dateTime + ':00' : dateTime;
    try {
      const meeting = await api.createMeeting({ title: title.trim(), description: description.trim() || undefined, projectId: projectId ?? undefined, dateTime: dateTimeWithSeconds, durationMinutes: duration, participantIds: Array.from(selectedIds) });
      toast.success('Встреча создана');
      onCreated(meeting);
    } catch (err: any) { toast.error(err?.message || 'Не удалось создать встречу'); }
    finally { setSaving(false); }
  };

  const toggleMember = (id: number) => setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const showHeatmap = !!projectId;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ ...glassStyle, background: theme.surface, width: '100%', maxWidth: showHeatmap ? 960 : 540, maxHeight: '92vh', overflowY: 'auto', borderRadius: '1.25rem', padding: '2rem', position: 'relative', display: 'grid', gridTemplateColumns: showHeatmap ? '1fr 340px' : '1fr', gap: '2rem', alignItems: 'start' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.15)`, borderRadius: '0.5rem', cursor: 'pointer', color: theme.textSecondary, padding: '0.3rem', display: 'flex', zIndex: 1 }}>
          <X size={16} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '1.35rem', color: theme.text }}>Новая встреча</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: theme.textSecondary }}>Заполните детали — участники получат уведомление</p>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 4 }}>Название *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Спринт-ретро, Stand-up..." style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, 0.25)`, background: `rgba(${rgb}, 0.05)`, color: theme.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 4 }}>Описание</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Повестка встречи..." style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, 0.25)`, background: `rgba(${rgb}, 0.05)`, color: theme.text, fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 4 }}>Дата и время *</label>
              <DateTimePicker value={dateTime} onChange={setDateTime} theme={theme} rgb={rgb} />
            </div>
            <div style={{ width: 110 }}>
              <label style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 4 }}>Длительность</label>
              <DurationSelect value={duration} onChange={setDuration} theme={theme} rgb={rgb} />
            </div>
          </div>

          {projectId && (
            <div>
              <button onClick={handleSuggest} disabled={loadingSuggest} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, 0.3)`, background: `rgba(${rgb}, 0.08)`, color: theme.text, cursor: loadingSuggest ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                {loadingSuggest ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={14} style={{ color: theme.primary }} />}
                Найти оптимальное время
              </button>
              {suggestions.length > 0 && (
                <div style={{ marginTop: '0.5rem', maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', border: `1px solid rgba(${rgb}, 0.15)`, borderRadius: '0.75rem', padding: '0.4rem', background: `rgba(${rgb}, 0.03)` }}>
                  {suggestions.map((s, i) => {
                    const isSel = dateTime === s.dateTime.substring(0, 16);
                    const pct = Math.round((s.availableCount / Math.max(s.totalMembers, 1)) * 100);
                    return (
                      <button key={i} onClick={() => setDateTime(s.dateTime.substring(0, 16))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.65rem', borderRadius: '0.5rem', border: `1px solid rgba(${rgb}, ${isSel ? 0.5 : 0.15})`, background: isSel ? `rgba(${rgb}, 0.15)` : 'transparent', color: theme.text, cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: isSel ? 700 : 400 }}>{format(parseISO(s.dateTime), 'EEE d MMM, HH:mm', { locale: ru })}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '0.75rem', background: pct >= 80 ? 'rgba(16,185,129,0.15)' : pct >= 50 ? `rgba(${rgb}, 0.12)` : 'rgba(239,68,68,0.1)', color: pct >= 80 ? '#10b981' : pct >= 50 ? theme.primary : '#ef4444' }}>{s.availableCount}/{s.totalMembers} свободны</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {members.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: theme.textSecondary, fontWeight: 600 }}>Участники</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: theme.textSecondary }}>{selectedIds.size} из {members.length} выбрано</span>
                  <button type="button" onClick={() => setSelectedIds(selectedIds.size === members.length ? new Set() : new Set(members.map(m => m.id)))} style={{ fontSize: '0.72rem', color: theme.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    {selectedIds.size === members.length ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 200, overflowY: 'auto' }}>
                {members.map(m => {
                  const sel = selectedIds.has(m.id);
                  const initials = `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.75rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, ${sel ? 0.4 : 0.12})`, background: sel ? `rgba(${rgb}, 0.1)` : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: sel ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${rgb}, 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: sel ? '#fff' : theme.textSecondary, transition: 'all 0.15s' }}>{initials || '?'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.firstName} {m.lastName}</div>
                        {(m as any).role && <div style={{ fontSize: '0.72rem', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m as any).role}</div>}
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${sel ? theme.primary : `rgba(${rgb}, 0.25)`}`, background: sel ? theme.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {sel && <Check size={11} color="#fff" strokeWidth={2.5} />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', color: theme.textSecondary }}>
                <Bell size={12} style={{ color: theme.primary, flexShrink: 0 }} /> Участники получат уведомление и ссылку на видеовстречу
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.6rem', border: `1px solid rgba(${rgb}, 0.2)`, background: 'transparent', color: theme.text, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>Отмена</button>
            <button onClick={handleCreate} disabled={saving} style={{ padding: '0.6rem 1.4rem', borderRadius: '0.6rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {saving && <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Создать встречу
            </button>
          </div>
        </div>

        {showHeatmap && (
          <div style={{ borderLeft: `1px solid rgba(${rgb}, 0.1)`, paddingLeft: '2rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: '1rem', color: theme.text }}>Доступность команды</h3>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: theme.textSecondary, lineHeight: 1.5 }}>Тёмнее — больше участников свободно. Нажмите «Найти оптимальное время» для автоподбора.</p>
            <AvailabilityGrid editable={false} projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
