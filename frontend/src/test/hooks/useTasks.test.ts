import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../../hooks/useTasks';
import { api } from '../../services/api';
import type { Task } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getTasks: vi.fn(),
    getUserTasks: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'user@test.com' } }),
}));

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 1,
  title: 'Fix bug',
  projectId: 10,
  status: 'TODO',
  priority: 'HIGH',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches project tasks when projectId is provided', async () => {
    const tasks = [makeTask({ id: 1 }), makeTask({ id: 2 })];
    vi.mocked(api.getTasks).mockResolvedValue(tasks);

    const { result } = renderHook(() => useTasks(10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toHaveLength(2);
    expect(api.getTasks).toHaveBeenCalledWith(10);
    expect(api.getUserTasks).not.toHaveBeenCalled();
  });

  it('fetches user tasks and filters by assignedTo when no projectId', async () => {
    const tasks = [
      makeTask({ id: 1, assignedTo: { id: 1, email: 'user@test.com' } }),
      makeTask({ id: 2, assignedTo: { id: 99, email: 'other@test.com' } }),
    ];
    vi.mocked(api.getUserTasks).mockResolvedValue(tasks);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Only task assigned to user id=1 should be shown
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(1);
  });

  it('sets error on API failure', async () => {
    vi.mocked(api.getTasks).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useTasks(10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBe('Server error');
  });

  it('reloads on reloadKey change', async () => {
    vi.mocked(api.getTasks).mockResolvedValue([makeTask({ id: 1 })]);

    const { rerender } = renderHook(({ key }) => useTasks(10, key), {
      initialProps: { key: 0 },
    });

    await waitFor(() => expect(api.getTasks).toHaveBeenCalledTimes(1));

    rerender({ key: 1 });

    await waitFor(() => expect(api.getTasks).toHaveBeenCalledTimes(2));
  });
});
