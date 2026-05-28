import { useState, useEffect } from 'react';
import { api, Project } from '../services/api';

export function useProjects(enabled = true) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setProjects([]);
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    loadProjects();
  }, [enabled]);

  return { projects, loading, error, reload: loadProjects };
}
