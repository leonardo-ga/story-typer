import { useState } from 'react';
import {
  readPreferences,
  storePreferences,
  type Preferences,
} from '../preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [saved, setSaved] = useState(true);
  function updatePreferences(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    setSaved(storePreferences(next));
  }
  return { preferences, updatePreferences, preferencesSaved: saved };
}
