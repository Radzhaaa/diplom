
export interface FrameStyle {
  border: string;
  boxShadow: string;
  animClass?: string;
  padding?: number;
}

export function getAvatarFrame(level: number, streak: number): FrameStyle | null {
  // Streak takes priority over level when strong enough
  if (streak >= 100) {
    return {
      border: '2.5px solid #38bdf8',
      boxShadow: '0 0 0 3px rgba(56,189,248,0.25), 0 0 20px rgba(56,189,248,0.6), 0 0 40px rgba(56,189,248,0.25)',
      animClass: 'avatar-frame-diamond',
    };
  }
  if (streak >= 30) {
    return {
      border: '2.5px solid #fb923c',
      boxShadow: '0 0 0 3px rgba(251,146,60,0.2), 0 0 18px rgba(251,146,60,0.7), 0 0 36px rgba(251,146,60,0.3)',
      animClass: 'avatar-frame-fire',
    };
  }
  if (streak >= 7) {
    return {
      border: '2px solid #fb923c',
      boxShadow: '0 0 0 2px rgba(251,146,60,0.15), 0 0 12px rgba(251,146,60,0.5)',
    };
  }

  // Level-based frames
  if (level >= 31) {
    return {
      border: '2.5px solid transparent',
      boxShadow: '0 0 0 2px rgba(168,85,247,0.3), 0 0 20px rgba(99,102,241,0.5)',
      animClass: 'avatar-frame-rainbow',
    };
  }
  if (level >= 21) {
    return {
      border: '2px solid #a855f7',
      boxShadow: '0 0 0 2px rgba(168,85,247,0.2), 0 0 16px rgba(168,85,247,0.5)',
      animClass: 'avatar-frame-pulse',
    };
  }
  if (level >= 11) {
    return {
      border: '2px solid #f59e0b',
      boxShadow: '0 0 0 2px rgba(245,158,11,0.15), 0 0 12px rgba(245,158,11,0.5)',
    };
  }
  if (level >= 6) {
    return {
      border: '2px solid #94a3b8',
      boxShadow: '0 0 0 2px rgba(148,163,184,0.1), 0 0 8px rgba(148,163,184,0.35)',
    };
  }

  return null; // level 1-5, no frame
}

export function getAvatarFrameStyle(level: number, streak: number): React.CSSProperties {
  const frame = getAvatarFrame(level, streak);
  if (!frame) return {};
  return {
    border: frame.border,
    boxShadow: frame.boxShadow,
  };
}

export interface UserTitle {
  label: string;
  emoji: string;
  color: string;
}

export function getUserTitle(level: number): UserTitle {
  if (level >= 31) return { label: 'Легенда',    emoji: '💎', color: '#38bdf8' };
  if (level >= 26) return { label: 'Архитектор', emoji: '🏗️', color: '#a855f7' };
  if (level >= 21) return { label: 'Тимлид',     emoji: '👑', color: '#a855f7' };
  if (level >= 16) return { label: 'Сеньор',     emoji: '🔥', color: '#f59e0b' };
  if (level >= 11) return { label: 'Мид',        emoji: '⚡', color: '#f59e0b' };
  if (level >= 6)  return { label: 'Джун',       emoji: '💻', color: '#94a3b8' };
  if (level >= 3)  return { label: 'Стажёр',     emoji: '📚', color: '#6b7280' };
  return                  { label: 'Новичок',    emoji: '🌱', color: '#6b7280' };
}

export function getStreakBadge(streak: number): string | null {
  if (streak >= 100) return '💎 ' + streak + ' дн.';
  if (streak >= 30)  return '🔥 ' + streak + ' дн.';
  if (streak >= 7)   return '🔥 ' + streak + ' дн.';
  return null;
}
