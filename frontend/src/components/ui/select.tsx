import { createContext, useContext, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';

const SelectContext = createContext<{
  value?: string;
  onValueChange?: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>({ open: false, setOpen: () => {}, triggerRef: { current: null } });

export function Select({ children, value, onValueChange, defaultValue }: any) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue || '');
  const current = value !== undefined ? value : internal;
  const onChange = onValueChange || setInternal;
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <SelectContext.Provider value={{ value: current, onValueChange: onChange, open, setOpen, triggerRef }}>
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className, style, ...props }: any) {
  const { setOpen, open, triggerRef } = useContext(SelectContext);
  return (
    <button ref={triggerRef} type="button" className={className} onClick={() => setOpen(!open)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', ...style }} {...props}>
      {children}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder, children }: any) {
  const { value } = useContext(SelectContext);
  return <span>{children || value || placeholder}</span>;
}

const DROPDOWN_MAX_HEIGHT = 260;

export function SelectContent({ children, className, style, ...props }: any) {
  const { open, setOpen, triggerRef } = useContext(SelectContext);
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  if (!open) return null;

  // Reading getBoundingClientRect() during render is safe here because the trigger
  let top: number | undefined;
  let bottom: number | undefined;
  let left = 0;
  let width: number | string = 'auto';

  if (triggerRef.current) {
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const openUpward = spaceBelow < DROPDOWN_MAX_HEIGHT && r.top > DROPDOWN_MAX_HEIGHT;
    left  = r.left;
    width = r.width;
    if (openUpward) {
      bottom = window.innerHeight - r.top + 4;
    } else {
      top = r.bottom + 4;
    }
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
      <div className={className} style={{
        position: 'fixed', zIndex: 9999,
        top, bottom, left, width,
        maxHeight: DROPDOWN_MAX_HEIGHT,
        overflowY: 'auto',
        background: theme.surface,
        border: `1px solid rgba(${primaryRgb},0.22)`,
        borderRadius: '0.75rem',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        ...style,
      }} {...props}>
        {children}
      </div>
    </>,
    document.body,
  );
}

export function SelectItem({ children, value, className, style, ...props }: any) {
  const { onValueChange, setOpen } = useContext(SelectContext);
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const [hovered, setHovered] = useState(false);
  return (
    <div className={className}
      style={{
        padding: '0.5rem 0.875rem', cursor: 'pointer',
        background: hovered ? `rgba(${primaryRgb},0.12)` : 'transparent',
        color: theme.text,
        fontSize: '0.875rem', transition: 'background 0.1s',
        ...style
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { onValueChange?.(value); setOpen(false); }} {...props}>
      {children}
    </div>
  );
}

export function SelectGroup({ children }: any) { return <>{children}</>; }
export function SelectLabel({ children, className, style }: any) {
  const { theme } = useTheme();
  return <div className={className} style={{ padding: '0.375rem 0.875rem', fontSize: '0.75rem', fontWeight: 600, color: theme.textSecondary, ...style }}>{children}</div>;
}
export function SelectSeparator() {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  return <hr style={{ border: 'none', borderTop: `1px solid rgba(${primaryRgb},0.15)`, margin: '0.25rem 0' }} />;
}
