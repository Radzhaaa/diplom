import { createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

const DialogContext = createContext<{ open?: boolean }>({});

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange?.(false); }}>
      <DialogContext.Provider value={{ open }}>{children}</DialogContext.Provider>
    </div>
  );
}

export function DialogContent({ children, className, style, ...props }: any) {
  const { theme } = useTheme();
  return (
    <div className={className} style={{ background: theme.surface, borderRadius: '1rem', padding: '1.5rem', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', ...style }} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className, style, ...props }: any) {
  return <div className={className} style={{ marginBottom: '1rem', ...style }} {...props}>{children}</div>;
}

export function DialogTitle({ children, className, style, ...props }: any) {
  return <h2 className={className} style={{ fontWeight: 700, fontSize: '1.25rem', margin: 0, ...style }} {...props}>{children}</h2>;
}

export function DialogDescription({ children, className, style, ...props }: any) {
  return <p className={className} style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0', ...style }} {...props}>{children}</p>;
}

export function DialogFooter({ children, className, style, ...props }: any) {
  return <div className={className} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem', ...style }} {...props}>{children}</div>;
}

export function DialogClose({ children, className, ...props }: any) {
  return <button className={className} style={{ cursor: 'pointer' }} {...props}>{children}</button>;
}

export function DialogTrigger({ children, asChild, ...props }: any) {
  return <>{children}</>;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Удалить',
  danger = true,
}: {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const { theme, lightMode } = useTheme();
  if (!open) return null;
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: lightMode ? theme.surface : 'linear-gradient(135deg, rgba(30,30,50,0.98) 0%, rgba(20,20,40,0.98) 100%)',
        border: `1px solid ${lightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '1rem',
        padding: '1.5rem',
        maxWidth: 400,
        width: '90vw',
        boxShadow: lightMode ? '0 24px 64px rgba(0,0,0,0.15)' : '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {title && (
          <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1rem', color: theme.text }}>
            {title}
          </h3>
        )}
        <p style={{ margin: '0 0 1.5rem', color: theme.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.45rem 1rem', borderRadius: 99,
              border: `1px solid ${lightMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)'}`,
              background: 'transparent', color: theme.textSecondary,
              cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = theme.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = theme.textSecondary; }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.45rem 1rem', borderRadius: 99, border: 'none',
              background: danger ? '#ef4444' : '#6366f1',
              color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
