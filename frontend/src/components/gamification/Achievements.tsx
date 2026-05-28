import { useState, useEffect } from 'react';
import { api, Achievement } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Trophy, Loader, Lock } from 'lucide-react';

export function Achievements() {
  const { theme } = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    api.getUserAchievements()
      .then(setAchievements)
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter(a => a.unlocked || a.unlockedAt);
  const locked = achievements.filter(a => !a.unlocked && !a.unlockedAt);

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: 0 }}>Достижения</h1>
        <p style={{ color: theme.textSecondary, marginTop: '0.25rem' }}>Разблокировано: {unlocked.length} / {achievements.length}</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {achievements.map((a) => {
            const isUnlocked = a.unlocked || !!a.unlockedAt;
            return (
              <div key={a.id} style={{ ...getGlassCardStyle(theme), padding: '1.25rem', opacity: isUnlocked ? 1 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: isUnlocked ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isUnlocked ? <Trophy size={22} style={{ color: '#fff' }} /> : <Lock size={20} style={{ color: theme.textSecondary }} />}
                  </div>
                  <div>
                    <div style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem' }}>{a.name}</div>
                    <div style={{ color: theme.primary, fontSize: '0.75rem', fontWeight: 600 }}>+{a.xpReward} XP</div>
                  </div>
                </div>
                <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>{a.description}</p>
                {isUnlocked && a.unlockedAt && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: theme.textSecondary }}>
                    {new Date(a.unlockedAt).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>
            );
          })}
          {achievements.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: theme.textSecondary }}>
              <Trophy size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Достижений пока нет</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
