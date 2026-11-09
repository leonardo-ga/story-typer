import { useEffect, useRef, useState } from 'react';
import { moveCaretToEnd } from '../typing.mjs';

export function useCompositionInput(
  value: string,
  commit: (text: string, composition?: boolean) => void,
  paused: boolean,
  storyId: string,
  preventCorrections = false,
) {
  const composing = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => {
    composing.current = false;
    setDraft(null);
  }, [paused, storyId]);
  return {
    value: draft ?? value,
    onCompositionStart: (
      event: React.CompositionEvent<HTMLTextAreaElement>,
    ) => {
      composing.current = true;
      setDraft(event.currentTarget.value);
    },
    onCompositionEnd: (event: React.CompositionEvent<HTMLTextAreaElement>) => {
      composing.current = false;
      setDraft(null);
      if (!paused && !event.currentTarget.readOnly)
        commit(event.currentTarget.value, true);
    },
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (composing.current || (event.nativeEvent as InputEvent).isComposing)
        setDraft(event.currentTarget.value);
      else commit(event.currentTarget.value);
    },
    onSelect: (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
      if (!composing.current) moveCaretToEnd(event.currentTarget);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        composing.current ||
        event.nativeEvent.isComposing ||
        event.keyCode === 229
      )
        return;
      if (
        preventCorrections &&
        (event.key === 'Backspace' ||
          event.key === 'Delete' ||
          ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'))
      ) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat && !paused) commit(value + '\n');
      }
    },
  };
}
