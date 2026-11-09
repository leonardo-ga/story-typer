import { useEffect, useState } from 'react';

/** Count only active play time; callers restore/reset elapsed for each session. */
export function useActiveTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    let previous = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - previous;
      previous = now;
      setElapsed((value) => value + delta);
    }, 100);
    return () => window.clearInterval(id);
  }, [active]);
  return { elapsed, setElapsed };
}
