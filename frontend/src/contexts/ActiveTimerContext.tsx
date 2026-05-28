import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, TimeEntry } from '../services/api';

interface ActiveTimerContextValue {
  activeTimer: TimeEntry | null;
  elapsedSeconds: number;
  refreshTimer: () => void;
  clearTimer: () => void;
}

const ActiveTimerContext = createContext<ActiveTimerContextValue>({
  activeTimer: null,
  elapsedSeconds: 0,
  refreshTimer: () => {},
  clearTimer: () => {},
});

export function ActiveTimerProvider({ children }: { children: ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const refreshTimer = useCallback(() => {
    api.getGlobalActiveTimer().then(entry => {
      setActiveTimer(entry);
      if (entry) {
        const elapsed = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
        setElapsedSeconds(elapsed);
      } else {
        setElapsedSeconds(0);
      }
    }).catch(() => {});
  }, []);

  const clearTimer = useCallback(() => {
    setActiveTimer(null);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    refreshTimer();
    const interval = setInterval(refreshTimer, 60_000);
    return () => clearInterval(interval);
  }, [refreshTimer]);

  useEffect(() => {
    if (!activeTimer) return;
    const iv = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [activeTimer]);

  return (
    <ActiveTimerContext.Provider value={{ activeTimer, elapsedSeconds, refreshTimer, clearTimer }}>
      {children}
    </ActiveTimerContext.Provider>
  );
}

export function useActiveTimer() {
  return useContext(ActiveTimerContext);
}
