import { useEffect, useMemo, useRef, useState } from 'react';
import { stories, findStory } from '../stories';
import { wordsPerMinute } from '../metrics.mjs';
import {
  activeParagraphIndex,
  analyzeTyping,
  buildStoryText,
  constrainTyping,
  countEdit,
  moveCaretToEnd,
  normalizeParagraphBreaks,
  segmentText,
} from '../typing.mjs';
import type { Session } from '../types';
import { useStoryAudio } from './useStoryAudio';
import { useReaderViewport } from './useReaderViewport';

const emptySession: Session = {
  value: '',
  started: false,
  finished: false,
  attempts: 0,
  correct: 0,
  elapsed: 0,
};

export function useStoryGame() {
  const initialStory = findStory(window.location.hash);
  const [selectedId, setSelectedId] = useState(
    initialStory?.id ?? stories[0].id,
  );
  const [inStory, setInStory] = useState(!!initialStory);
  const sessions = useRef<Record<string, Session>>({});
  const selected = stories.find((item) => item.id === selectedId)!;
  const story = selected.paragraphs;
  const paragraphs = useMemo(() => buildStoryText(story), [story]);
  const storyText = useMemo(
    () => paragraphs.map((part) => part.text).join(''),
    [paragraphs],
  );
  const [value, setValue] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rain, setRain] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const input = useRef<HTMLTextAreaElement>(null);

  const clock = useRef<number | null>(null);
  const scene = activeParagraphIndex(paragraphs, value.length);
  const complete = value === storyText;
  const analysis = useMemo(
    () => analyzeTyping(value, storyText),
    [value, storyText],
  );
  const { mistake, correct: matching } = analysis;
  const expectedCharacter =
    mistake < 0 ? '' : (segmentText(storyText.slice(mistake))[0]?.char ?? '');
  const progress = complete
    ? 100
    : Math.min(99, Math.round((matching / analysis.total) * 100));
  useEffect(() => {
    const pauseWhenHidden = (event: Event) => {
      if (
        (document.hidden || event.type === 'pagehide') &&
        inStory &&
        started &&
        !finished
      ) {
        setPaused(true);
        if (input.current) input.current.readOnly = true;
        input.current?.blur();
      }
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    window.addEventListener('pagehide', pauseWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      window.removeEventListener('pagehide', pauseWhenHidden);
    };
  }, [inStory, started, finished]);
  useEffect(() => {
    const navigate = () => {
      sessions.current[selectedId] = {
        value,
        started,
        finished,
        attempts,
        correct,
        elapsed,
      };
      const destination = findStory(window.location.hash);
      setInStory(!!destination);
      setPaused(true);
      if (destination && destination.id !== selectedId) {
        const saved = sessions.current[destination.id] ?? emptySession;
        setSelectedId(destination.id);
        setValue(saved.value);
        setStarted(saved.started);
        setFinished(saved.finished);
        setAttempts(saved.attempts);
        setCorrect(saved.correct);
        setElapsed(saved.elapsed);
        scrollTarget.current = null;
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [selectedId, value, started, finished, attempts, correct, elapsed]);
  useEffect(() => {
    document.title = inStory
      ? `${selected.title} — Story Typer`
      : 'Story Typer — Choose your story';
  }, [inStory, selected.title]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.isComposing ||
        event.keyCode === 229 ||
        !inStory ||
        !started ||
        finished
      )
        return;
      event.preventDefault();
      togglePause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inStory, started, finished, paused]);
  useEffect(() => {
    if (!inStory || !started || paused || finished || complete) {
      clock.current = null;
      return;
    }
    clock.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - (clock.current ?? now);
      clock.current = now;
      setElapsed((e) => e + delta);
    }, 100);
    return () => {
      window.clearInterval(id);
      clock.current = null;
    };
  }, [inStory, started, paused, finished, complete]);
  useEffect(() => {
    if (inStory && started && !paused && !finished)
      input.current?.focus({ preventScroll: true });
  }, [inStory, started, paused, finished, scene]);
  const { reader, activeParagraph, scrollTarget } = useReaderViewport({
    inStory,
    paused,
    finished,
    started,
    scene,
    value,
  });
  function focusTyping() {
    if (started && !paused && !finished)
      input.current?.focus({ preventScroll: true });
  }
  const audio = useStoryAudio({
    inStory,
    paused,
    finished,
    theme: selected.theme,
    focusTyping,
  });
  function change(next: string) {
    if (paused || finished || complete || document.hidden) return;
    const normalized = normalizeParagraphBreaks(next, paragraphs);
    const accepted = constrainTyping(value, normalized, storyText);
    if (accepted !== value) audio.playTyping(accepted.length < value.length);
    const edit = countEdit(value, normalized, storyText);
    setAttempts((a) => a + edit.attempts);
    setCorrect((c) => c + countEdit(value, accepted, storyText).correct);
    setValue(accepted);
    if (input.current && next !== accepted) {
      input.current.value = accepted;
      moveCaretToEnd(input.current);
    }
    if (accepted === storyText) setFinished(true);
  }
  function togglePause() {
    setPaused((current) => !current);
    scrollTarget.current = null;
    if (paused) {
      if (input.current) input.current.readOnly = false;
      input.current?.focus({ preventScroll: true });
    } else {
      if (input.current) input.current.readOnly = true;
      input.current?.blur();
    }
  }
  function restart() {
    setValue('');
    setAttempts(0);
    setCorrect(0);
    setElapsed(0);
    setFinished(false);
    setPaused(false);
    setStarted(false);
    scrollTarget.current = null;
  }
  const wpm = wordsPerMinute(matching, elapsed);

  return {
    inStory,
    selected,
    sessions,
    rain,
    setRain,
    focusTyping,
    scene,
    started,
    setStarted,
    paused,
    setPaused,
    finished,
    value,
    storyText,
    paragraphs,
    reader,
    activeParagraph,
    input,
    change,
    mistake,
    expectedCharacter,
    progress,
    togglePause,
    restart,
    wpm,
    correct,
    attempts,
    elapsed,
    ...audio,
  };
}

export type StoryGame = ReturnType<typeof useStoryGame>;
