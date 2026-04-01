/**
 * Custom hook for stream timer management.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function useStreamTimer(isActive: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const formatted = useCallback(() => {
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsed]);

  return { elapsed, formatted: formatted(), hours: Math.floor(elapsed / 3600000) };
}

/**
 * Custom hook for debouncing values.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for controlling visibility with auto-hide (for stream controls).
 */
export function useAutoHideVisibility(
  showDuration: number = 5000
): { visible: boolean; show: () => void; hide: () => void; toggle: () => void } {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const show = useCallback(() => {
    setVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(hide, showDuration);
  }, [hide, showDuration]);

  const toggle = useCallback(() => {
    if (visible) hide();
    else show();
  }, [visible, hide, show]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { visible, show, hide, toggle };
}
