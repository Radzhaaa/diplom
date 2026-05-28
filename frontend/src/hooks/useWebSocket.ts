import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

const RECONNECT_BASE_MS  = 2_000;
const RECONNECT_MAX_MS   = 30_000;
const RECONNECT_FACTOR   = 2;

export type WsEventHandler = (payload: unknown) => void;

interface Subscription {
  topic: string;
  handler: WsEventHandler;
}

export function useWebSocket(token: string | null) {
  const clientRef    = useRef<Client | null>(null);
  const pendingRef   = useRef<Subscription[]>([]);
  const activeRef    = useRef<Map<string, ReturnType<Client['subscribe']>>>(new Map());
  const attemptRef   = useRef<number>(0);
  const retryTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;

    function connect() {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 0,
        onConnect: () => {
          attemptRef.current = 0; // reset backoff on successful connection
          for (const { topic, handler } of pendingRef.current) {
            const sub = client.subscribe(topic, (frame) => {
              try { handler(JSON.parse(frame.body)); } catch { handler(frame.body); }
            });
            activeRef.current.set(topic, sub);
          }
          pendingRef.current = [];
        },
        onDisconnect: () => {
          activeRef.current.clear();
          scheduleReconnect();
        },
        onStompError: () => {
          scheduleReconnect();
        },
      });

      client.activate();
      clientRef.current = client;
    }

    function scheduleReconnect() {
      if (retryTimer.current !== null) return; // already scheduled
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(RECONNECT_FACTOR, attemptRef.current),
        RECONNECT_MAX_MS,
      );
      attemptRef.current += 1;
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null;
        if (clientRef.current) {
          clientRef.current.deactivate().then(() => {
            clientRef.current = null;
            connect();
          });
        } else {
          connect();
        }
      }, delay);
    }

    connect();

    return () => {
      if (retryTimer.current !== null) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      clientRef.current?.deactivate();
      clientRef.current = null;
      activeRef.current.clear();
    };
  }, [token]);

  const subscribe = useCallback((topic: string, handler: WsEventHandler): (() => void) => {
    const client = clientRef.current;

    if (client?.connected) {
      const sub = client.subscribe(topic, (frame) => {
        try { handler(JSON.parse(frame.body)); } catch { handler(frame.body); }
      });
      activeRef.current.set(topic, sub);
      return () => {
        sub.unsubscribe();
        activeRef.current.delete(topic);
      };
    }

    const entry: Subscription = { topic, handler };
    pendingRef.current.push(entry);
    return () => {
      pendingRef.current = pendingRef.current.filter((s) => s !== entry);
      const active = activeRef.current.get(topic);
      if (active) {
        active.unsubscribe();
        activeRef.current.delete(topic);
      }
    };
  }, []);

  return { subscribe };
}
