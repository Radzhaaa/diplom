import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';

const DDContext = createContext<{ open: boolean; setOpen: (o: boolean) => void }>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return <DDContext.Provider value={{ open, setOpen }}><div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>{children}</div></DDContext.Provider>;
}

export function DropdownMenuTrigger({ children, asChild }: any) {
  const { setOpen, open } = useContext(DDContext);
  return <div onClick={() => setOpen(!open)} style={{ display: 'inline-block', cursor: 'pointer' }}>{children}</div>;
}

export function DropdownMenuContent({ children, className, style, align = 'start', ...props }: any) {
  const { open } = useContext(DDContext);
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  if (!open) return null;
  return (
    <div className={className} style={{
      position: 'absolute', zIndex: 100,
      background: theme.surface,
      border: `1px solid rgba(${rgb},0.2)`,
      borderRadius: '0.75rem', padding: '0.5rem', minWidth: '10rem',
      top: '100%', ...(align === 'end' ? { right: 0 } : { left: 0 }), marginTop: '4px',
      boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
      ...style,
    }} {...props}>{children}</div>
  );
}

export function DropdownMenuItem({ children, className, style, onClick, ...props }: any) {
  const { setOpen } = useContext(DDContext);
  const { theme } = useTheme();
  return (
    <div className={className} onClick={() => { onClick?.(); setOpen(false); }}
      style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', color: theme.text, ...style }} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  const { theme } = useTheme();
  const rgb = hexToRgb(theme.primary);
  return <hr style={{ border: 'none', borderTop: `1px solid rgba(${rgb},0.15)`, margin: '0.25rem 0' }} />;
}
export function DropdownMenuLabel({ children, className, style }: any) {
  const { theme } = useTheme();
  return <div className={className} style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: theme.textSecondary, ...style }}>{children}</div>;
}
export function DropdownMenuGroup({ children }: any) { return <>{children}</>; }
export function DropdownMenuShortcut({ children, className }: any) {
  const { theme } = useTheme();
  return <span className={className} style={{ fontSize: '0.75rem', color: theme.textSecondary, marginLeft: 'auto' }}>{children}</span>;
}
export function DropdownMenuSub({ children }: any) { return <>{children}</>; }
export function DropdownMenuSubTrigger({ children }: any) { return <>{children}</>; }
export function DropdownMenuSubContent({ children }: any) { return null; }
export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, ...props }: any) {
  return <DropdownMenuItem {...props}>{children}</DropdownMenuItem>;
}
export function DropdownMenuRadioGroup({ children }: any) { return <>{children}</>; }
export function DropdownMenuRadioItem({ children, ...props }: any) { return <DropdownMenuItem {...props}>{children}</DropdownMenuItem>; }
