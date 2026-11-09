import { useEffect, useState } from 'react';

export const preferencesSuggestionDelay = 4000;
const dismissalKey = 'story-typer.preferences-suggestion.dismissed';
const snoozeKey = 'story-typer.preferences-suggestion.snoozed';

function wasDismissed() {
  try {
    return localStorage.getItem(dismissalKey) === 'true';
  } catch {
    return false;
  }
}

function wasSnoozed() {
  try {
    return window.sessionStorage.getItem(snoozeKey) === 'true';
  } catch {
    return false;
  }
}

export function usePreferencesSuggestion(
  configured: boolean,
  enabled: boolean,
) {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [snoozed, setSnoozed] = useState(wasSnoozed);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (configured || dismissed || snoozed || !enabled) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(
      () => setVisible(true),
      preferencesSuggestionDelay,
    );
    return () => window.clearTimeout(timer);
  }, [configured, dismissed, snoozed, enabled]);

  function postpone() {
    setVisible(false);
    setSnoozed(true);
    try {
      window.sessionStorage.setItem(snoozeKey, 'true');
    } catch {
      /* Keep it hidden in memory if session storage is unavailable. */
    }
  }

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(dismissalKey, 'true');
    } catch {
      /* The current visit still remembers dismissal. */
    }
  }
  return {
    visible: visible && enabled && !configured && !dismissed && !snoozed,
    dismiss,
    postpone,
  };
}
