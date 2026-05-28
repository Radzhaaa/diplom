import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';
import type { User, Project, Task } from '../../services/api';

// Helper to mock fetch
function mockFetch(body: unknown, status = 200) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as unknown as Response);
}

function mockFetchError(status: number, message: string) {
  const response = {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ message }),
    text: vi.fn().mockResolvedValue(JSON.stringify({ message })),
  };
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response as unknown as Response);
}

const mockUser: User = {
  id: 1,
  email: 'user@test.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'TEAM_MEMBER',
  level: 3,
  xp: 1500,
};

describe('ApiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    api.setToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });


  it('setToken stores token in localStorage', () => {
    api.setToken('jwt-token');
    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  it('setToken removes token from localStorage when null', () => {
    localStorage.setItem('token', 'old');
    api.setToken(null);
    expect(localStorage.getItem('token')).toBeNull();
  });


  it('login sends POST and returns token+user', async () => {
    mockFetch({ token: 'jwt', user: mockUser });

    const result = await api.login({ email: 'user@test.com', password: 'secret' });

    expect(result.token).toBe('jwt');
    expect(result.user.email).toBe('user@test.com');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('login throws with server error message', async () => {
    mockFetchError(401, 'Invalid credentials');

    await expect(api.login({ email: 'x@x.com', password: 'bad' }))
      .rejects.toThrow('Invalid credentials');
  });


  it('getCurrentUser sends Authorization header when token is set', async () => {
    api.setToken('my-jwt');
    mockFetch(mockUser);

    await api.getCurrentUser();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-jwt' }),
      })
    );
  });

  it('getCurrentUser returns user data', async () => {
    api.setToken('token');
    mockFetch(mockUser);

    const user = await api.getCurrentUser();

    expect(user.id).toBe(1);
    expect(user.email).toBe('user@test.com');
  });


  it('getProjects returns list of projects', async () => {
    const projects: Project[] = [
      { id: 1, name: 'P1', status: 'ACTIVE', priority: 'HIGH', ownerId: 1, createdAt: '2024-01-01' },
    ];
    api.setToken('token');
    mockFetch(projects);

    const result = await api.getProjects();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('P1');
  });


  it('getTasks appends projectId to query when provided', async () => {
    api.setToken('token');
    mockFetch([]);

    await api.getTasks(42);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('projectId=42'),
      expect.any(Object)
    );
  });


  it('request returns undefined for 204 No Content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
      text: vi.fn().mockResolvedValue(''),
    } as unknown as Response);

    api.setToken('token');
    const result = await api.deleteProject(1);

    expect(result).toBeUndefined();
  });
});
