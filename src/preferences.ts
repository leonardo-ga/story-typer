import type { Language } from './stories/types';

export const keyboardNames = {
  unknown: 'Not set',
  us: 'English (US)',
  italian: 'Italian QWERTY',
  french: 'French AZERTY (classic)',
  azerty: 'AZERTY',
  qwertz: 'QWERTZ',
  other: 'Other / custom',
};
export type KeyboardLayout = keyof typeof keyboardNames;
export type ErrorMode = 'correct' | 'forward' | 'free';
export const errorModeNames: Record<ErrorMode, string> = {
  correct: 'Correct mistakes',
  forward: 'Keep moving',
  free: 'Free flow',
};
export interface Preferences {
  language: Language | 'none';
  assistance: boolean;
  keyboard: KeyboardLayout;
  errorMode: ErrorMode;
}
export const defaultPreferences: Preferences = {
  language: 'none',
  assistance: true,
  keyboard: 'unknown',
  errorMode: 'free',
};
export const preferenceKey = 'story-typer.preferences.v1';

export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(preferenceKey) ?? '{}');
    return {
      language: ['en', 'it', 'fr', 'ko', 'none'].includes(value?.language)
        ? value.language
        : 'none',
      assistance:
        typeof value?.assistance === 'boolean' ? value.assistance : true,
      keyboard: Object.hasOwn(keyboardNames, value?.keyboard)
        ? value.keyboard
        : 'unknown',
      errorMode: Object.hasOwn(errorModeNames, value?.errorMode)
        ? value.errorMode
        : 'free',
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function storePreferences(value: Preferences) {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function guessKeyboard(
  map: ReadonlyMap<string, string>,
): KeyboardLayout {
  if (
    map.get('Quote') === 'à' ||
    map.get('Semicolon') === 'ò' ||
    map.get('BracketLeft') === 'è'
  )
    return 'italian';
  if (map.get('KeyQ') === 'a' && map.get('KeyA') === 'q') return 'azerty';
  if (map.get('KeyY') === 'z' && map.get('KeyZ') === 'y') return 'qwertz';
  if (
    map.get('KeyQ') === 'q' &&
    map.get('KeyA') === 'a' &&
    map.get('Semicolon') === ';' &&
    map.get('Quote') === "'"
  )
    return 'us';
  return 'unknown';
}

export async function detectKeyboard(): Promise<KeyboardLayout> {
  const keyboard = (
    navigator as Navigator & {
      keyboard?: { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> };
    }
  ).keyboard;
  if (!keyboard?.getLayoutMap)
    throw new Error(
      'Keyboard detection is unavailable in this browser. You can choose a layout manually.',
    );
  return guessKeyboard(await keyboard.getLayoutMap());
}

export function supportsKeyboardDetection() {
  return (
    typeof (navigator as Navigator & { keyboard?: { getLayoutMap?: unknown } })
      .keyboard?.getLayoutMap === 'function'
  );
}
