import { checkKeyboardCompatibility } from '../keyboardCompatibility';
import type { Preferences } from '../preferences';

export function KeyboardCompatibility({
  text,
  preferences,
  detailed = false,
}: {
  text: string;
  preferences: Pick<Preferences, 'keyboard' | 'assistance'>;
  detailed?: boolean;
}) {
  const result = checkKeyboardCompatibility(
    text,
    preferences.keyboard,
    preferences.assistance,
  );
  if (result.status === 'unknown' && !detailed) return null;
  const label = {
    compatible: 'Compatible with your selected keyboard',
    assisted: 'Compatible with character help',
    'needs-input': 'Some characters need extra input',
    unknown: 'Keyboard compatibility not verified',
  }[result.status];
  const detail = result.missing.length
    ? /\p{Script=Hangul}/u.test(result.missing.join(''))
      ? 'This story uses Korean Hangul. Enable a Korean input method to type it; character help cannot replace Hangul with Latin letters.'
      : `Check these characters: ${result.missing.join(' ')}. They may need shortcuts or another input method.`
    : result.assisted.length
      ? `Accepted with character help: ${result.assisted.join(' ')}. Similar characters appear in yellow.`
      : result.status === 'unknown'
        ? 'Choose English (US), Italian QWERTY, or French AZERTY (classic) in Preferences to check this story.'
        : 'Based on the layout selected in Preferences, including normal modifier keys.';
  return (
    <p
      className={`keyboard-compatibility keyboard-compatibility--${result.status}`}
      title={detail}
    >
      <span aria-hidden="true">
        {result.status === 'compatible' || result.status === 'assisted'
          ? '✓'
          : 'ⓘ'}
      </span>{' '}
      {label}
      {detailed && <small>{detail}</small>}
    </p>
  );
}
