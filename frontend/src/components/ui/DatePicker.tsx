import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const RU_MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const RU_DAYS  = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function formatDisplay(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${d}.${m}.${y}`;
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: string;
  style?: React.CSSProperties;
  clearable?: boolean;
}

export function DatePicker({ value, onChange, placeholder = 'Выберите дату', min, style, clearable = true }: DatePickerProps) {
  const { theme, lightMode } = useTheme();
  const rgb = hexToRgb(theme.primary);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const today = new Date();
  const initYear  = value ? parseInt(value.split('-')[0]) : today.getFullYear();
  const initMonth = value ? parseInt(value.split('-')[1]) - 1 : today.getMonth();
  const [viewYear,  setViewYear]  = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.split('-')[0]));
      setViewMonth(parseInt(value.split('-')[1]) - 1);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const cells = buildCalendar(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return value === `${viewYear}-${mm}-${dd}`;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const isDisabled = (day: number) => {
    if (!min) return false;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}` < min;
  };

  let portalTop: number | undefined;
  let portalBottom: number | undefined;
  let portalLeft = 0;
  let portalWidth = 280;
  if (open && btnRef.current) {
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const dropH = 340;
    portalWidth = Math.max(r.width, 280);
    // Clamp left so dropdown doesn't go off the right edge
    portalLeft = Math.min(r.left, window.innerWidth - portalWidth - 8);
    portalLeft = Math.max(8, portalLeft);
    if (spaceBelow >= dropH || r.top < dropH) {
      portalTop = r.bottom + 6;
    } else {
      portalBottom = window.innerHeight - r.top + 6;
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    width: '100%', padding: '0.625rem 0.875rem',
    background: `rgba(${rgb}, 0.07)`,
    border: `1px solid rgba(${rgb}, ${open ? '0.4' : '0.18'})`,
    borderRadius: '0.625rem', cursor: 'pointer',
    color: value ? theme.text : theme.textSecondary,
    fontSize: '0.9375rem', outline: 'none', textAlign: 'left',
    transition: 'border-color 0.15s',
    ...style,
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button ref={btnRef} type="button" style={btnBase} onClick={() => setOpen(v => !v)}>
        <Calendar size={15} style={{ color: `rgba(${rgb}, 0.7)`, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value ? formatDisplay(value) : placeholder}</span>
        {clearable && value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ display: 'flex', alignItems: 'center', color: theme.textSecondary, cursor: 'pointer' }}
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          {/* Backdrop to close on outside click */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
          {/* Calendar dropdown */}
          <div
            style={{
              position: 'fixed', zIndex: 9999,
              top: portalTop, bottom: portalBottom, left: portalLeft,
              minWidth: portalWidth,
              background: lightMode ? 'rgba(255,255,255,0.98)' : 'rgba(18,18,30,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid rgba(${rgb}, 0.2)`,
              borderRadius: '1rem', padding: '1rem',
              boxShadow: lightMode
                ? `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(${rgb},0.08)`
                : `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(${rgb},0.08)`,
              userSelect: 'none',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <button type="button" onClick={prevMonth} style={{ background: `rgba(${rgb},0.1)`, border: 'none', borderRadius: '0.5rem', padding: '4px 7px', cursor: 'pointer', color: theme.text, display: 'flex' }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9rem' }}>
                {RU_MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} style={{ background: `rgba(${rgb},0.1)`, border: 'none', borderRadius: '0.5rem', padding: '4px 7px', cursor: 'pointer', color: theme.text, display: 'flex' }}>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.25rem' }}>
              {RU_DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: theme.textSecondary, padding: '2px 0', fontWeight: 600 }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const selected = isSelected(day);
                const todayMark = isToday(day);
                const disabled = isDisabled(day);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: '0.4rem', border: 'none',
                      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: selected ? 700 : 400,
                      background: selected
                        ? `rgba(${rgb}, 0.9)`
                        : todayMark ? `rgba(${rgb}, 0.15)` : 'transparent',
                      color: selected ? '#fff' : disabled ? theme.textSecondary : theme.text,
                      opacity: disabled ? 0.35 : 1,
                      outline: todayMark && !selected ? `1.5px solid rgba(${rgb}, 0.5)` : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!disabled && !selected) (e.currentTarget as HTMLButtonElement).style.background = `rgba(${rgb}, 0.15)`; }}
                    onMouseLeave={e => { if (!disabled && !selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <div style={{ marginTop: '0.75rem', borderTop: `1px solid rgba(${rgb},0.1)`, paddingTop: '0.6rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const y = today.getFullYear();
                  const m = String(today.getMonth() + 1).padStart(2, '0');
                  const d = String(today.getDate()).padStart(2, '0');
                  onChange(`${y}-${m}-${d}`);
                  setOpen(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: `rgba(${rgb}, 0.8)`, fontSize: '0.8rem', fontWeight: 600 }}
              >
                Сегодня
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
