import { useEffect, useMemo, useRef, useState } from 'react';
import type { StoryCatalog } from '../stories/catalog';
import { getStoryText } from '../stories/text';
import { wordsPerMinute } from '../metrics.mjs';
import {
  activeParagraphIndex,
  analyzeTyping,
  applyErrorMode,
  typingCursor,
  countEdit,
  moveCaretToEnd,
  normalizeParagraphBreaks,
  segmentText,
} from '../typing.mjs';
import type { Session } from '../types';
import { useStoryAudio } from './useStoryAudio';
import { useReaderViewport } from './useReaderViewport';
import type { ErrorMode } from '../preferences';
import { useActiveTimer } from './useActiveTimer';
import { useI18n } from '../i18n/I18nProvider';

const emptySession: Session = {
  value: '',
  started: false,
  finished: false,
  attempts: 0,
  correct: 0,
  elapsed: 0,
};

export function useStoryGame({
  catalog,
  defaultAssistance = false,
  defaultErrorMode = 'free',
}: {
  catalog: StoryCatalog;
  defaultAssistance?: boolean;
  defaultErrorMode?: ErrorMode;
}) {
  const { findStory, stories } = catalog;
  const { t } = useI18n();
  const initialStory = findStory(window.location.hash);
  const [selectedId, setSelectedId] = useState(
    initialStory?.id ?? stories[0].id,
  );
  const [inStory, setInStory] = useState(!!initialStory);
  const sessions = useRef<Record<string, Session>>({});
  const selected = findStory(selectedId)!;
  const { paragraphs, text: storyText } = getStoryText(selected);
  const [value, setValue] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rain, setRain] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [assisted, setAssisted] = useState(0);
  const [assistance, setAssistance] = useState(defaultAssistance);
  const [errorMode, setErrorMode] = useState<ErrorMode>(defaultErrorMode);

  const input = useRef<HTMLTextAreaElement>(null);

  const cursor = useMemo(
    () => typingCursor(value, storyText),
    [value, storyText],
  );
  const typedCharacters = useMemo(() => segmentText(value), [value]);
  const scene = activeParagraphIndex(paragraphs, cursor.offset);
  const analysis = useMemo(
    () => analyzeTyping(value, storyText, assistance),
    [value, storyText, assistance],
  );
  const complete =
    cursor.count === cursor.total &&
    (errorMode !== 'correct' || analysis.mistake === -1);
  const { elapsed, setElapsed } = useActiveTimer(
    inStory && started && !paused && !finished && !complete,
  );
  const { mistake, correct: matching } = analysis;
  const expectedCharacter =
    mistake < 0 ? '' : (segmentText(storyText.slice(mistake))[0]?.char ?? '');
  const nextCharacter =
    segmentText(storyText.slice(cursor.offset))[0]?.char ?? '';
  useEffect(() => {
    if (!started) {
      setAssistance(defaultAssistance);
      setErrorMode(defaultErrorMode);
    }
  }, [defaultAssistance, defaultErrorMode, started]);
  const progress = complete
    ? 100
    : Math.min(
        99,
        Math.round(
          ((errorMode === 'correct' ? matching : cursor.count) /
            analysis.total) *
            100,
        ),
      );
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
        assisted,
        assistance,
        errorMode,
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
        setAssisted(saved.assisted ?? 0);
        setAssistance(
          saved.started ? (saved.assistance ?? false) : defaultAssistance,
        );
        setErrorMode(
          saved.started ? (saved.errorMode ?? 'correct') : defaultErrorMode,
        );
        scrollTarget.current = null;
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, [
    findStory,
    selectedId,
    value,
    started,
    finished,
    attempts,
    correct,
    elapsed,
    assisted,
    assistance,
    defaultAssistance,
    defaultErrorMode,
    errorMode,
  ]);
  useEffect(() => {
    document.title = inStory
      ? `${selected.title} — Story Typer`
      : `Story Typer — ${t('Choose your story')}`;
  }, [inStory, selected.title, t]);
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
  function change(next: string, composition = false) {
    if (paused || finished || complete || document.hidden) return;
    const normalized = normalizeParagraphBreaks(next, paragraphs);
    const accepted = applyErrorMode(
      value,
      normalized,
      storyText,
      assistance,
      errorMode,
      composition,
    );
    if (accepted !== value) audio.playTyping(accepted.length < value.length);
    const edit = countEdit(
      value,
      errorMode === 'forward' ? accepted : normalized,
      storyText,
    );
    setAttempts((a) => a + edit.attempts);
    const exact = countEdit(value, accepted, storyText).correct;
    const acceptedCount = countEdit(
      value,
      accepted,
      storyText,
      assistance,
    ).correct;
    setCorrect((c) => c + exact);
    setAssisted((count) => count + acceptedCount - exact);
    setValue(accepted);
    if (input.current && next !== accepted) {
      input.current.value = accepted;
      moveCaretToEnd(input.current);
    }
    if (
      typingCursor(accepted, storyText).count === cursor.total &&
      (errorMode !== 'correct' ||
        analyzeTyping(accepted, storyText, assistance).mistake === -1)
    )
      setFinished(true);
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
    setAssisted(0);
    setAssistance(defaultAssistance);
    setErrorMode(defaultErrorMode);
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
    typedCharacters,
    cursorPosition: cursor.offset,
    errorMode,
    storyText,
    paragraphs,
    reader,
    activeParagraph,
    input,
    change,
    mistake,
    expectedCharacter,
    nextCharacter,
    assistance,
    assisted,
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
