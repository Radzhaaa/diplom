import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjects } from '../../hooks/useProjects';
import { api } from '../../services/api';
import type { Project } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getProjects: vi.fn(),
  },
}));

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Alpha',
    status: 'ACTIVE',
    priority: 'HIGH',
    ownerId: 1,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Beta',
    status: 'PLANNING',
    priority: 'MEDIUM',
    ownerId: 1,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty projects and loading=false', () => {
    vi.mocked(api.getProjects).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects());

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads projects successfully', async () => {
    vi.mocked(api.getProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.projects[0].name).toBe('Alpha');
    expect(result.current.error).toBeNull();
  });

  it('sets error on API failure', async () => {
    vi.mocked(api.getProjects).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('does not fetch when enabled=false', async () => {
    const { result } = renderHook(() => useProjects(false));

    await new Promise((r) => setTimeout(r, 0));

    expect(api.getProjects).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('reloads when reload() is called', async () => {
    vi.mocked(api.getProjects)
      .mockResolvedValueOnce(mockProjects)
      .mockResolvedValueOnce([mockProjects[0]]);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toHaveLength(2);

    result.current.reload();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toHaveLength(1);
    expect(api.getProjects).toHaveBeenCalledTimes(2);
  });
});
