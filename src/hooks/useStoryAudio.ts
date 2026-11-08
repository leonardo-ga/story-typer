import { useEffect, useRef, useState } from 'react';
import { createTypingAudio } from '../audio/typingAudio';
import { createAmbience } from '../audio/ambience';
import type { Theme } from '../stories/types';

interface Options {
  inStory: boolean;
  paused: boolean;
  finished: boolean;
  theme: Theme;
  focusTyping: () => void;
}

export function useStoryAudio({
  inStory,
  paused,
  finished,
  theme,
  focusTyping,
}: Options) {
  const [sound, setSound] = useState(false);
  const [typingSound, setTypingSound] = useState(false);
  const typingAudio = useRef<ReturnType<typeof createTypingAudio> | null>(null);

  useEffect(() => {
    if (!inStory || !sound || paused || finished) return;
    try {
      const context = createAmbience(theme);
      void context.resume().catch(() => setSound(false));
      return () => {
        void context.close().catch(() => {});
      };
    } catch {
      setSound(false);
    }
  }, [inStory, sound, paused, finished, theme]);

  useEffect(() => {
    if (inStory && typingSound && !finished) return;
    const current = typingAudio.current;
    typingAudio.current = null;
    if (current) void current.close().catch(() => {});
  }, [inStory, typingSound, finished]);

  useEffect(
    () => () => {
      void typingAudio.current?.close().catch(() => {});
    },
    [],
  );

  function toggleTypingSound() {
    if (!typingSound) {
      try {
        typingAudio.current ??= createTypingAudio();
        void typingAudio.current.resume().catch(() => setTypingSound(false));
        setTypingSound(true);
      } catch {
        setTypingSound(false);
      }
    } else setTypingSound(false);
    focusTyping();
  }

  function playTyping(backspace: boolean) {
    if (!typingSound) return;
    try {
      typingAudio.current ??= createTypingAudio();
      const current = typingAudio.current;
      void current
        .resume()
        .then(() => current.play(backspace))
        .catch(() => {});
    } catch {
      setTypingSound(false);
    }
  }

  return { sound, setSound, typingSound, toggleTypingSound, playTyping };
}
