import { useEffect, useRef } from 'react';

/**
 * usePolling hook for periodic background refreshing without page reload
 * @param {Function} callback Function to invoke periodically
 * @param {number} intervalMs Polling interval in milliseconds (default: 30000)
 * @param {boolean} enabled Whether polling is active
 * @param {boolean} executeImmediately Whether to run the callback on mount / enabled change
 */
export const usePolling = (callback, intervalMs = 30000, enabled = true, executeImmediately = false) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !intervalMs) return;

    if (executeImmediately) {
      savedCallback.current();
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled, executeImmediately]);
};

export default usePolling;
