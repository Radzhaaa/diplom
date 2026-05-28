import type { ThemeColors } from '../contexts/ThemeContext';

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '99, 102, 241';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export function getGlassCardStyle(theme: ThemeColors, options?: {
  hover?:    boolean;
  noBorder?: boolean;
  alpha?:    number;
  glow?:     boolean;
  elevated?: boolean;
}): React.CSSProperties {
  const alpha      = options?.alpha ?? 0.06;
  const primaryRgb = hexToRgb(theme.primary);
  const surfaceRgb = hexToRgb(theme.surface);

  const borderColor = options?.noBorder
    ? 'transparent'
    : `rgba(${primaryRgb}, 0.15)`;

  const glowShadow = options?.glow
    ? `, 0 0 28px rgba(${primaryRgb}, 0.32), 0 0 64px rgba(${primaryRgb}, 0.10)`
    : '';

  const baseShadow = options?.elevated
    ? `0 28px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset`
    : `0 8px 28px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset`;

  return {
    background: options?.elevated
      ? `rgba(${surfaceRgb}, 0.55)`
      : `rgba(${surfaceRgb}, ${alpha + 0.04})`,
    backdropFilter:        'blur(20px)',
    WebkitBackdropFilter:  'blur(20px)',
    border:       `1px solid ${borderColor}`,
    borderRadius: '1.25rem',
    boxShadow:    `${baseShadow}${glowShadow}`,
    transition:   'transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1), border-color 250ms cubic-bezier(0.4,0,0.2,1)',
  };
}

export function getGlowCardStyle(theme: ThemeColors, color?: string): React.CSSProperties {
  const rgb = hexToRgb(color ?? theme.primary);
  const surfaceRgb = hexToRgb(theme.surface);
  return {
    background:            `rgba(${surfaceRgb}, 0.10)`,
    backdropFilter:        'blur(20px)',
    WebkitBackdropFilter:  'blur(20px)',
    border:                `1px solid rgba(${rgb}, 0.22)`,
    borderRadius:          '1.25rem',
    boxShadow:             `0 8px 28px rgba(0,0,0,0.4), 0 0 20px rgba(${rgb}, 0.15)`,
    transition:            'transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms cubic-bezier(0.4,0,0.2,1)',
  };
}

export function getGlassInputStyle(theme: ThemeColors): React.CSSProperties {
  const primaryRgb = hexToRgb(theme.primary);
  return {
    background:            'rgba(255,255,255,0.04)',
    border:                `1px solid rgba(255,255,255,0.07)`,
    color:                 theme.text,
    borderRadius:          '0.875rem',
    outline:               'none',
    transition:            'border-color 0.15s, box-shadow 0.15s, background 0.15s',
    width:                 '100%',
    padding:               '0.625rem 1rem',
    fontSize:              '0.9375rem',
  };
}

export function getGlassInputIconStyle(theme: ThemeColors): React.CSSProperties {
  return { ...getGlassInputStyle(theme), paddingLeft: '2.75rem' };
}

export function getGlassInputIconRightStyle(theme: ThemeColors): React.CSSProperties {
  return { ...getGlassInputIconStyle(theme), paddingRight: '2.75rem' };
}

export function getGlassButtonStyle(theme: ThemeColors, variant: 'primary' | 'secondary' | 'ghost' = 'primary'): React.CSSProperties {
  const primaryRgb = hexToRgb(theme.primary);

  if (variant === 'primary') {
    return {
      background:   `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
      color:        '#fff',
      border:       'none',
      borderRadius: '0.875rem',
      padding:      '0.625rem 1.375rem',
      cursor:       'pointer',
      fontWeight:   600,
      fontSize:     '0.9375rem',
      boxShadow:    `0 4px 16px rgba(${primaryRgb}, 0.40), 0 0 32px rgba(${primaryRgb}, 0.15)`,
      transition:   'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      position:     'relative',
      overflow:     'hidden',
    };
  }

  if (variant === 'ghost') {
    return {
      background:   'transparent',
      color:        theme.textSecondary,
      border:       'none',
      borderRadius: '0.875rem',
      padding:      '0.625rem 1.25rem',
      cursor:       'pointer',
      transition:   'all 0.2s ease',
    };
  }

  // secondary
  return {
    background:   `rgba(${primaryRgb}, 0.10)`,
    color:        theme.text,
    border:       `1px solid rgba(${primaryRgb}, 0.22)`,
    borderRadius: '0.875rem',
    padding:      '0.625rem 1.25rem',
    cursor:       'pointer',
    transition:   'all 0.2s ease',
  };
}

export function getStatusColor(status: string, theme: ThemeColors): string {
  switch (status) {
    case 'TODO':
    case 'NEW':         return theme.textSecondary;
    case 'IN_PROGRESS': return '#f59e0b';
    case 'IN_REVIEW':   return '#8b5cf6';
    case 'DONE':
    case 'COMPLETED':   return '#10b981';
    case 'BLOCKED':     return '#ef4444';
    case 'CANCELLED':   return '#6b7280';
    default:            return theme.textSecondary;
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#eab308';
    case 'LOW':      return '#3b82f6';
    default:         return '#6b7280';
  }
}

export function getLevelBadgeStyle(theme: ThemeColors, size = 44): React.CSSProperties {
  const primaryRgb = hexToRgb(theme.primary);
  return {
    width:           `${size}px`,
    height:          `${size}px`,
    borderRadius:    '50%',
    background:      `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    fontSize:        `${size * 0.36}px`,
    fontWeight:      800,
    color:           '#fff',
    boxShadow:       `0 4px 16px rgba(${primaryRgb}, 0.45), 0 0 32px rgba(${primaryRgb}, 0.18)`,
    position:        'relative',
    overflow:        'hidden',
  };
}

export function getStatIconStyle(color: string): React.CSSProperties {
  const rgb = hexToRgb(color);
  return {
    width:           '42px',
    height:          '42px',
    borderRadius:    '0.875rem',
    background:      `rgba(${rgb}, 0.15)`,
    border:          `1px solid rgba(${rgb}, 0.22)`,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    boxShadow:       `0 0 16px rgba(${rgb}, 0.18)`,
  };
}
