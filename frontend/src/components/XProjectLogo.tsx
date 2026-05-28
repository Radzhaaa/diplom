import type { CSSProperties } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface XProjectLogoProps {
  variant?: 'full' | 'short';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const fontSizeMap: Record<string, number> = {
  sm: 22,
  md: 30,
  lg: 38,
  xl: 50,
};

export function XProjectLogo({ variant = 'full', size = 'md', className }: XProjectLogoProps) {
  const { theme } = useTheme();
  const fontSize = fontSizeMap[size] ?? 26;
  const text = variant === 'short' ? 'XP' : 'XProject';

  const textStyle: CSSProperties = {
    fontFamily: '"Zen Tokyo Zoo", cursive',
    fontSize,
    lineHeight: 1,
    letterSpacing: '0.01em',
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'block', lineHeight: 1, userSelect: 'none', width: '100%', textAlign: 'center' }}
    >
      {/* Glow layer — same text, same size, blurred */}
      <span
        aria-hidden
        style={{
          ...textStyle,
          WebkitTextFillColor: theme.primary,
          background: 'none',
          color: theme.primary,
          position: 'absolute',
          inset: 0,
          filter: `blur(10px)`,
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      >
        {text}
      </span>

      {/* Actual text */}
      <span style={{ ...textStyle, position: 'relative' }}>
        {text}
      </span>
    </div>
  );
}
