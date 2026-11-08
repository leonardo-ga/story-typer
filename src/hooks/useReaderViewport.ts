import { useEffect, useRef, useState } from 'react';

interface Options {
  inStory: boolean;
  paused: boolean;
  finished: boolean;
  started: boolean;
  scene: number;
  value: string;
}

export function useReaderViewport({
  inStory,
  paused,
  finished,
  started,
  scene,
  value,
}: Options) {
  const reader = useRef<HTMLDivElement>(null);
  const activeParagraph = useRef<HTMLElement>(null);
  const scrollTarget = useRef<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    if (!inStory) return;
    document.body.classList.add('reading');
    const viewport = window.visualViewport;
    const resize = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--reading-height',
        `${height}px`,
      );
      setViewportHeight(height);
    };
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => {
      document.body.classList.remove('reading');
      document.documentElement.style.removeProperty('--reading-height');
      viewport?.removeEventListener('resize', resize);
      window.removeEventListener('resize', resize);
    };
  }, [inStory]);

  useEffect(() => {
    if (!inStory || paused || finished) {
      scrollTarget.current = null;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const container = reader.current;
      const paragraph = activeParagraph.current;
      const anchor = container?.querySelector('.cursor') ?? paragraph;
      if (!container || !anchor) return;
      const bounds = container.getBoundingClientRect();
      const position = anchor.getBoundingClientRect();
      if (
        position.top < bounds.top + bounds.height * 0.25 ||
        position.bottom > bounds.top + bounds.height * 0.65 ||
        value.length === 0
      ) {
        const target = Math.max(
          0,
          Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop +
              position.top -
              bounds.top -
              bounds.height * 0.35,
          ),
        );
        if (
          scrollTarget.current !== null &&
          Math.abs(scrollTarget.current - target) < 2
        )
          return;
        scrollTarget.current = target;
        container.scrollTo({
          top: target,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [inStory, scene, value, paused, finished, started, viewportHeight]);

  return { reader, activeParagraph, scrollTarget };
}
