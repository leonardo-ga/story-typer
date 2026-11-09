import { useEffect, useState } from 'react';

const topZone = 80;
const revealDistance = 12;
const hideDistance = 24;

/** Accumulate movement in one direction so trackpad jitter cannot flicker. */
export function useScrollHeader(enabled: boolean, pinned: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(false);
    if (!enabled || pinned) return;
    const position = () =>
      Math.max(
        0,
        Math.min(
          window.scrollY,
          Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
          ),
        ),
      );
    let previous = position();
    let direction = 0;
    let distance = 0;
    const scroll = () => {
      const current = position();
      const delta = current - previous;
      previous = current;
      if (current <= topZone) {
        setHidden(false);
        distance = 0;
        direction = 0;
        return;
      }
      if (!delta) return;
      const nextDirection = Math.sign(delta);
      if (direction !== nextDirection) distance = 0;
      direction = nextDirection;
      distance += Math.abs(delta);
      if (distance >= (direction > 0 ? hideDistance : revealDistance)) {
        setHidden(direction > 0);
        distance = 0;
      }
    };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, [enabled, pinned]);
  return enabled && !pinned && hidden;
}
