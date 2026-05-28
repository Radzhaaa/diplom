import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterOption { value: string; label: string; color?: string; }

interface Props {
  value: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (v: string) => void;
  theme: any;
  primaryRgb: string;
}

export function FilterDropdown({ value, placeholder, options, onChange, theme, primaryRgb }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: '36px',
          padding: '0 0.625rem 0 0.75rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: value ? `rgba(${primaryRgb},0.12)` : `rgba(${primaryRgb},0.06)`,
          border: `1px solid rgba(${primaryRgb},${value ? '0.3' : '0.14'})`,
          borderRadius: '0.875rem',
          color: value ? theme.primary : theme.textSecondary,
          fontSize: '0.8125rem', fontWeight: value ? 600 : 400,
          cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {selected?.color && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected.color, flexShrink: 0 }} />
        )}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={12} style={{ opacity: 0.55, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0,
          minWidth: 170, zIndex: 300,
          background: theme.surface,
          border: `1px solid rgba(${primaryRgb},0.18)`,
          borderRadius: '1rem',
          boxShadow: `0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(${primaryRgb},0.06)`,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          padding: '0.3rem',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.75rem', width: '100%', textAlign: 'left',
              background: !value ? `rgba(${primaryRgb},0.1)` : 'transparent',
              border: 'none', cursor: 'pointer',
              color: !value ? theme.primary : theme.textSecondary,
              fontSize: '0.8125rem', fontWeight: !value ? 600 : 400,
              borderRadius: '0.625rem', transition: 'background 0.12s',
            }}
          >
            {placeholder}
            {!value && <Check size={12} style={{ marginLeft: 'auto', color: theme.primary }} />}
          </button>

          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 0.75rem', width: '100%', textAlign: 'left',
                background: value === opt.value ? `rgba(${primaryRgb},0.1)` : 'transparent',
                border: 'none', cursor: 'pointer',
                color: value === opt.value ? theme.primary : theme.text,
                fontSize: '0.8125rem', fontWeight: value === opt.value ? 600 : 400,
                borderRadius: '0.625rem', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = `rgba(${primaryRgb},0.06)`; }}
              onMouseLeave={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {opt.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />}
              <span style={{ flex: 1 }}>{opt.label}</span>
              {value === opt.value && <Check size={12} style={{ color: theme.primary, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
