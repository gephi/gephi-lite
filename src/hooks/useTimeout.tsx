import { useCallback, useEffect, useRef } from "react";

function isTimeoutValid(timeout: number): boolean {
  return !isNaN(timeout) && timeout >= 0 && timeout !== Infinity;
}

/**
 * React hook for delaying calls in time.
 *
 * @param callback The function to execute for the timeout
 * @param timeout The time to wait before to execute the callback
 * @returns a function to cancel the timeout, and an other to reschedule it
 */
export function useTimeout(callback: () => void, timeout: number = 0): { cancel: () => void; reschedule: () => void } {
  // reference the current timeoutId
  const timeoutIdRef = useRef<number | null>(null);

  /**
   * Function that clear the current timeout.
   */
  const cancel = useCallback(() => {
    const timeoutId = timeoutIdRef.current;
    if (timeoutId) {
      timeoutIdRef.current = null;
      clearTimeout(timeoutId);
    }
  }, [timeoutIdRef]);

  /**
   * Function that reschedule the timeout.
   */
  const reschedule = useCallback(() => {
    cancel();
    timeoutIdRef.current = isTimeoutValid(timeout) ? window.setTimeout(callback, timeout) : null;
  }, [callback, timeout, cancel]);

  /**
   * When the hook props change
   *  => create the new timeout
   */
  useEffect(() => {
    timeoutIdRef.current = isTimeoutValid(timeout) ? window.setTimeout(callback, timeout) : null;
    return cancel;
  }, [callback, timeout, cancel]);

  return { cancel, reschedule };
}
