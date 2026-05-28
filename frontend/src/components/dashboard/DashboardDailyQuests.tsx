import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import {
  Check, Target, Trophy, Star, Flame, Zap, Monitor, FileText,
  Lightbulb, Award, BarChart2, Key, Rocket, BookOpen, Users,
  Sparkles, Code, type LucideIcon,
} from 'lucide-react';
import type { Quest } from '../../services/api';

const QUEST_EMOJI_MAP: Record<string, LucideIcon> = {
  '🎯': Target,  '🏆': Trophy,  '⭐': Star,   '🌟': Star,
  '🔥': Flame,   '⚔️': Zap,    '🗡️': Zap,   '💻': Monitor,
  '📝': FileText,'💡': Lightbulb,'🎖️': Award, '📊': BarChart2,
  '🔑': Key,     '🚀': Rocket,  '📖': BookOpen,'👥': Users,
  '✨': Sparkles,'💫': Sparkles,'⚡': Zap,    '🧩': Code,
};

function QuestIcon({ icon, size = 16, color }: { icon?: string | null; size?: number; color?: string }) {
  const IconComponent = icon ? (QUEST_EMOJI_MAP[icon] ?? Target) : Target;
  return <IconComponent size={size} style={{ color: color ?? undefined }} />;
}

interface Props {
  quests: Quest[];
}

export function DashboardDailyQuests({ quests }: Props) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  if (quests.length === 0) return null;

  return (
    <div style={{ margin: '0 1.5rem 1.5rem' }}>
      <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Target size={18} style={{ color: theme.primary, flexShrink: 0 }} />
          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>Ежедневные квесты</span>
          <span style={{
            marginLeft: 'auto',
            background: `rgba(${primaryRgb}, 0.12)`, color: theme.primary,
            borderRadius: 99, padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 700,
          }}>
            {quests.filter(q => q.isCompleted).length}/{quests.length} выполнено
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {quests.map(q => {
            const pct = Math.min(100, q.progressPercentage ?? 0);
            const done = q.isCompleted;
            return (
              <div key={q.id} style={{
                padding: '1rem',
                borderRadius: '0.875rem',
                background: done ? 'rgba(74,222,128,0.07)' : `rgba(${primaryRgb}, 0.05)`,
                border: done ? '1px solid rgba(74,222,128,0.2)' : `1px solid rgba(${primaryRgb}, 0.1)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <QuestIcon icon={q.icon} size={16} color={done ? '#4ade80' : theme.primary} />
                  <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>{q.title}</span>
                  <span style={{ color: done ? '#4ade80' : theme.primary, fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                    +{q.xpReward}XP
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                    {done
                      ? <><Check size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />Выполнено</>
                      : `${q.currentProgress ?? 0} / ${q.targetValue}`}
                  </span>
                  <span style={{ color: done ? '#4ade80' : theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${pct}%`,
                    background: done
                      ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                      : `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
