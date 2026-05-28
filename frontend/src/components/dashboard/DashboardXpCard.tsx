import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { Flame, Star } from 'lucide-react';
import type { User } from '../../services/api';

interface Props {
  user: User | null;
}

export function DashboardXpCard({ user }: Props) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const accentRgb  = hexToRgb(theme.accent);

  const xpToNextLevel = (user?.level ?? 1) * 1000;
  const xpCurrent    = (user?.xp ?? 0) % 1000;
  const xpPercent    = Math.min(100, (xpCurrent / 1000) * 100);

  return (
    <div
      className="bento-xp xp-hero-card glass-card"
      style={{
        background: `linear-gradient(135deg,
          rgba(${primaryRgb}, 0.18) 0%,
          rgba(${accentRgb}, 0.10) 50%,
          rgba(${primaryRgb}, 0.06) 100%)`,
        border: `1px solid rgba(${primaryRgb}, 0.22)`,
      }}
    >
      <div className="xp-hero-orb xp-hero-orb-1" style={{ background: theme.primary }} />
      <div className="xp-hero-orb xp-hero-orb-2" style={{ background: theme.accent }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              className="animate-float"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '1.25rem',
                boxShadow: `0 4px 20px rgba(${primaryRgb}, 0.5), 0 0 40px rgba(${primaryRgb}, 0.2)`,
                flexShrink: 0,
              }}
            >
              {user?.level ?? 1}
            </div>
            <div>
              <div style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.025em' }}>
                Уровень {user?.level ?? 1}
              </div>
              <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', marginTop: '2px' }}>
                {xpCurrent} / {xpToNextLevel} XP до следующего
              </div>
              {(user?.currentStreak ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '4px' }}>
                  <Flame size={13} style={{ color: '#fb923c', flexShrink: 0 }} />
                  <span style={{ color: '#fb923c', fontSize: '0.75rem', fontWeight: 600 }}>
                    {user!.currentStreak}-дневная серия
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{
            fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {Math.round(xpPercent)}%
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
