import { useState } from 'react';
import {
  readPreferences,
  storePreferences,
  hasSavedPreferences,
  type Preferences,
} from '../preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [saved, setSaved] = useState(true);
  const [configured, setConfigured] = useState(hasSavedPreferences);
  function updatePreferences(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    setConfigured(true);
    setSaved(storePreferences(next));
  }
  return {
    preferences,
    updatePreferences,
    preferencesSaved: saved,
    preferencesConfigured: configured,
  };
}
