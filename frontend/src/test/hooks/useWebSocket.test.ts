import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebSocket } from '../../hooks/useWebSocket';

// Mock STOMP client
const mockSubscribe = vi.fn();
const mockActivate = vi.fn();
const mockDeactivate = vi.fn().mockResolvedValue(undefined);

const mockClient = {
  connected: false,
  subscribe: mockSubscribe,
  activate: mockActivate,
  deactivate: mockDeactivate,
};

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation((config: { onConnect?: () => void }) => {
    setTimeout(() => {
      mockClient.connected = true;
      config.onConnect?.();
    }, 0);
    return mockClient;
  }),
}));

vi.mock('sockjs-client', () => ({
  default: vi.fn().mockReturnValue({}),
}));

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.connected = false;
  });

  it('does not connect when token is null', () => {
    renderHook(() => useWebSocket(null));
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('connects when token is provided', () => {
    renderHook(() => useWebSocket('my-jwt-token'));
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it('returns subscribe function', () => {
    const { result } = renderHook(() => useWebSocket('token'));
    expect(typeof result.current.subscribe).toBe('function');
  });

  it('adds to pending subscriptions when not yet connected', () => {
    mockClient.connected = false;
    const handler = vi.fn();

    const { result } = renderHook(() => useWebSocket('token'));

    act(() => {
      result.current.subscribe('/topic/tasks/1', handler);
    });

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes immediately when already connected', async () => {
    mockClient.connected = true;
    const handler = vi.fn();

    const { result } = renderHook(() => useWebSocket('token'));

    const mockStompSub = { unsubscribe: vi.fn() };
    mockSubscribe.mockReturnValue(mockStompSub);

    act(() => {
      result.current.subscribe('/topic/tasks/1', handler);
    });

    expect(mockSubscribe).toHaveBeenCalledWith(
      '/topic/tasks/1',
      expect.any(Function)
    );
  });

  it('returns unsubscribe function that removes subscription', async () => {
    mockClient.connected = true;
    const handler = vi.fn();
    const mockStompSub = { unsubscribe: vi.fn() };
    mockSubscribe.mockReturnValue(mockStompSub);

    const { result } = renderHook(() => useWebSocket('token'));

    let unsubscribe: (() => void) | undefined;
    act(() => {
      unsubscribe = result.current.subscribe('/topic/tasks/1', handler);
    });

    act(() => {
      unsubscribe?.();
    });

    expect(mockStompSub.unsubscribe).toHaveBeenCalled();
  });

  it('deactivates client on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('token'));
    unmount();
    expect(mockDeactivate).toHaveBeenCalled();
  });
});
