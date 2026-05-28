import { useAchievementUnlock } from '../../contexts/AchievementUnlockContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Trophy, X } from 'lucide-react';
import { hexToRgb } from '../../utils/glassStyles';

export function AchievementUnlockModal() {
  const { achievement, open, hideUnlock } = useAchievementUnlock();
  const { theme } = useTheme();

  if (!open || !achievement) return null;

  const primaryRgb = hexToRgb(theme.primary);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={hideUnlock}>
      <div style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.95)`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid rgba(${primaryRgb}, 0.3)`, borderRadius: '1.5rem', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: `0 24px 64px rgba(${primaryRgb}, 0.3)` }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={hideUnlock} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: `0 8px 24px rgba(${primaryRgb}, 0.4)` }}>
          <Trophy size={36} style={{ color: '#fff' }} />
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.primary, marginBottom: '0.5rem' }}>Достижение разблокировано!</div>
        <h2 style={{ color: theme.text, fontWeight: 800, fontSize: '1.375rem', margin: '0 0 0.5rem' }}>{achievement.name}</h2>
        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>{achievement.description}</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: `rgba(${primaryRgb}, 0.15)`, padding: '0.375rem 0.875rem', borderRadius: '9999px', color: theme.primary, fontWeight: 700, fontSize: '0.9375rem' }}>
          +{achievement.xpReward} XP
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button onClick={hideUnlock} style={{ padding: '0.625rem 1.75rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Отлично!
          </button>
        </div>
      </div>
    </div>
  );
}
