import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Notification, User } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAchievementUnlock } from './AchievementUnlockContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  user: User | null;
}

const CONNECTION_ERROR_NOTIFICATION: Notification = {
  id: -1,
  type: 'DEADLINE_APPROACHING',
  title: 'Нет связи с сервером',
  message: 'Проверьте, что backend запущен (например: ./run-platform-no-docker.sh).',
  isRead: false,
  createdAt: new Date().toISOString(),
};

function encodeEmail(email: string): string {
  return email.replace('@', '_at_').replace(/\./g, '_');
}

export function NotificationProvider({ children, user }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const { showUnlock } = useAchievementUnlock();

  const token = localStorage.getItem('token');
  const { subscribe } = useWebSocket(token);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setConnectionFailed(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    const topic = `/topic/notifications/${encodeEmail(user.email)}`;
    const unsub = subscribe(topic, (payload: unknown) => {
      const msg = payload as { type: string; data: Notification };
      if (msg.type === 'NOTIFICATION' && msg.data) {
        const newNotif = msg.data;
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== -1)]);
        setUnreadCount((prev) => prev + 1);
        if (newNotif.type === 'ACHIEVEMENT_UNLOCKED' && newNotif.relatedEntityId) {
          api.getUserAchievements().then((achievements) => {
            const found = achievements.find((a) => a.id === newNotif.relatedEntityId);
            if (found) showUnlock({ ...found, unlockedAt: newNotif.createdAt });
          }).catch(() => {});
        }
      }
    });
    return unsub;
  }, [user?.email, subscribe]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setConnectionFailed(false);
      const [allNotifications, unread] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotifications(),
      ]);
      setNotifications(allNotifications);
      setUnreadCount(unread.length);
    } catch {
      setConnectionFailed(true);
      setNotifications([{ ...CONNECTION_ERROR_NOTIFICATION, createdAt: new Date().toISOString() }]);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    if (id === -1) {
      setConnectionFailed(false);
      setNotifications(notifications.filter(n => n.id !== -1));
      setUnreadCount(Math.max(0, unreadCount - 1));
      return;
    }
    try {
      await api.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {
    }
  };

  const markAllAsRead = async () => {
    setConnectionFailed(false);
    setNotifications(notifications.filter(n => n.id !== -1).map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.markAllNotificationsAsRead();
      const [allNotifications, unread] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotifications(),
      ]);
      setNotifications(allNotifications);
      setUnreadCount(unread.length);
    } catch {
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, loadNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
