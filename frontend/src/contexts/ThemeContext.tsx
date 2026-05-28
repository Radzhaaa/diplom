import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primaryForeground?: string;
  glassBackground?: string;
  glassBorder?: string;
  glassBlur?: number;
}

export const defaultThemes: Record<string, ThemeColors> = {
  indigo: {
    primary: '#6366f1',
    secondary: '#334155',
    accent: '#a855f7',
    background: '#0f0f13',
    surface: '#1a1a24',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(99, 102, 241, 0.08)',
    glassBorder: 'rgba(99, 102, 241, 0.18)',
    glassBlur: 12,
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#1e3a5f',
    accent: '#22d3ee',
    background: '#070d1a',
    surface: '#0f1e35',
    text: '#ffffff',
    textSecondary: '#93c5fd',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(59, 130, 246, 0.08)',
    glassBorder: 'rgba(59, 130, 246, 0.18)',
    glassBlur: 12,
  },
  green: {
    primary: '#10b981',
    secondary: '#14532d',
    accent: '#34d399',
    background: '#050f0a',
    surface: '#0d1f13',
    text: '#ffffff',
    textSecondary: '#6ee7b7',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(16, 185, 129, 0.08)',
    glassBorder: 'rgba(16, 185, 129, 0.18)',
    glassBlur: 12,
  },
  purple: {
    primary: '#a855f7',
    secondary: '#4c1d95',
    accent: '#e879f9',
    background: '#0d0414',
    surface: '#180a2a',
    text: '#ffffff',
    textSecondary: '#d8b4fe',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(168, 85, 247, 0.08)',
    glassBorder: 'rgba(168, 85, 247, 0.18)',
    glassBlur: 12,
  },
  orange: {
    primary: '#f97316',
    secondary: '#7c2d12',
    accent: '#fb923c',
    background: '#0f0805',
    surface: '#1c1208',
    text: '#ffffff',
    textSecondary: '#fdba74',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(249, 115, 22, 0.08)',
    glassBorder: 'rgba(249, 115, 22, 0.18)',
    glassBlur: 12,
  },
  red: {
    primary: '#ef4444',
    secondary: '#7f1d1d',
    accent: '#f87171',
    background: '#0f0505',
    surface: '#1c0a0a',
    text: '#ffffff',
    textSecondary: '#fca5a5',
    primaryForeground: '#ffffff',
    glassBackground: 'rgba(239, 68, 68, 0.08)',
    glassBorder: 'rgba(239, 68, 68, 0.18)',
    glassBlur: 12,
  },
};

export function toLightVariant(colors: ThemeColors): ThemeColors {
  return {
    ...colors,
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    primaryForeground: colors.primaryForeground ?? '#ffffff',
    glassBackground: 'rgba(255, 255, 255, 0.9)',
    glassBorder: 'rgba(15, 23, 42, 0.1)',
    glassBlur: 6,
  };
}

interface ThemeContextType {
  theme: ThemeColors;
  themeName: string;
  setTheme: (themeName: string) => void;
  customTheme: ThemeColors | null;
  setCustomTheme: (colors: ThemeColors) => void;
  lightMode: boolean;
  setLightMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<string>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'darkRed') return 'indigo';
    return saved || 'indigo';
  });

  const [customTheme, setCustomThemeState] = useState<ThemeColors | null>(() => {
    try {
      const saved = localStorage.getItem('customTheme');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('customTheme');
      return null;
    }
  });

  const [lightMode, setLightModeState] = useState<boolean>(() => {
    return localStorage.getItem('themeLightMode') === 'true';
  });

  const [baseTheme, setBaseThemeState] = useState<ThemeColors>(() => {
    if (customTheme) return customTheme;
    return defaultThemes[themeName] || defaultThemes.indigo;
  });

  const theme = lightMode ? toLightVariant(baseTheme) : baseTheme;

  useEffect(() => {
    if (customTheme) {
      setBaseThemeState(customTheme);
      localStorage.setItem('customTheme', JSON.stringify(customTheme));
    } else {
      const selectedTheme = defaultThemes[themeName] || defaultThemes.indigo;
      setBaseThemeState(selectedTheme);
      localStorage.setItem('theme', themeName);
      localStorage.removeItem('customTheme');
    }
  }, [themeName, customTheme]);

  useEffect(() => {
    localStorage.setItem('themeLightMode', String(lightMode));
  }, [lightMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--glass-background', theme.glassBackground || 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--glass-border', theme.glassBorder || 'rgba(255, 255, 255, 0.2)');
    root.style.setProperty('--glass-blur', `${theme.glassBlur || 20}px`);

    const hexToRgb = (hex: string) => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : '99, 102, 241';
    };
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.primary));
    root.style.setProperty('--color-accent-rgb', hexToRgb(theme.accent));

    const bgMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(theme.background);
    if (bgMatch) {
      const r = parseInt(bgMatch[1], 16), g = parseInt(bgMatch[2], 16), b = parseInt(bgMatch[3], 16);
      root.style.setProperty('--glass-main-bg', `rgba(${r}, ${g}, ${b}, 0.88)`);
      root.style.setProperty('--glass-sidebar-bg', `rgba(${r}, ${g}, ${b}, 0.75)`);
    } else {
      root.style.setProperty('--glass-main-bg', 'rgba(26, 26, 26, 0.88)');
      root.style.setProperty('--glass-sidebar-bg', 'rgba(26, 26, 26, 0.75)');
    }
  }, [theme]);

  const setLightMode = (value: boolean) => setLightModeState(value);

  const setTheme = (name: string) => {
    setThemeNameState(name);
    setCustomThemeState(null);
  };

  const setCustomTheme = (colors: ThemeColors) => {
    setCustomThemeState(colors);
    setThemeNameState('custom');
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, customTheme, setCustomTheme, lightMode, setLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
