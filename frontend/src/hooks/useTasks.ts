import { useState, useEffect } from 'react';
import { api, Task } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useTasks(projectId?: number, reloadKey?: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = projectId
        ? await api.getTasks(projectId)
        : await api.getUserTasks();
      const filtered = projectId
        ? data
        : data.filter((t: Task) => t.assignedTo?.id === user?.id);
      setTasks(filtered);
    } catch (err: any) {
      setTasks([]);
      setError(err.message || 'Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId, reloadKey]);

  return { tasks, loading, error, reload: loadTasks };
}
