import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/api';

export function useGameSocket(onMessage) {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(WS_URL);
      ws.current.onmessage = (e) => {
        try { onMessageRef.current(JSON.parse(e.data)); } catch {}
      };
      ws.current.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.current.onerror = () => ws.current?.close();
    } catch {}
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);
}
