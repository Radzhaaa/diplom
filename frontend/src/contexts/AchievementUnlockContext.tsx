import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { Achievement } from '../services/api';

type AchievementWithDate = Achievement & { unlockedAt?: string };

interface AchievementUnlockContextValue {
  showUnlock: (achievement: AchievementWithDate) => void;
  hideUnlock: () => void;
  achievement: AchievementWithDate | null;
  open: boolean;
}

const AchievementUnlockContext = createContext<AchievementUnlockContextValue | null>(null);

export function AchievementUnlockProvider({ children }: { children: React.ReactNode }) {
  const [achievement, setAchievement] = useState<AchievementWithDate | null>(null);
  const [open, setOpen] = useState(false);
  const queueRef = useRef<AchievementWithDate[]>([]);
  const isShowingRef = useRef(false);

  const showUnlock = useCallback((a: AchievementWithDate) => {
    if (isShowingRef.current) {
      queueRef.current = [...queueRef.current, a];
      return;
    }
    isShowingRef.current = true;
    setAchievement(a);
    setOpen(true);
  }, []);

  const hideUnlock = useCallback(() => {
    const q = queueRef.current;
    if (q.length > 0) {
      const [next, ...rest] = q;
      queueRef.current = rest;
      setAchievement(next);
      setOpen(true);
      return;
    }
    isShowingRef.current = false;
    setOpen(false);
    setAchievement(null);
  }, []);

  return (
    <AchievementUnlockContext.Provider value={{ showUnlock, hideUnlock, achievement, open }}>
      {children}
    </AchievementUnlockContext.Provider>
  );
}

export function useAchievementUnlock() {
  const ctx = useContext(AchievementUnlockContext);
  if (!ctx) return { showUnlock: () => {}, hideUnlock: () => {}, achievement: null, open: false };
  return ctx;
}
