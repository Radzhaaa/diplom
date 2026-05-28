import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb } from '../utils/glassStyles';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
}

export function SlidePanel({ open, onClose, title, width = '480px', children }: SlidePanelProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
          zIndex: 200,
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}, 95vw)`,
          background: theme.surface,
          borderLeft: `1px solid rgba(${primaryRgb}, 0.2)`,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          animation: 'panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid rgba(${primaryRgb}, 0.12)`,
          flexShrink: 0,
        }}>
          <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: '0.375rem' }}
          >
            <X size={20} />
          </button>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </>
  );
}
