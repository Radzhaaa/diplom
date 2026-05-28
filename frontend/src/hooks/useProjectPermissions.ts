import { useState, useEffect } from 'react';
import { api, ProjectPermissions } from '../services/api';

export function useProjectPermissions(projectId: number | null) {
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.getProjectPermissions(projectId)
      .then(setPermissions)
      .catch(() => setPermissions(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { permissions, loading };
}
