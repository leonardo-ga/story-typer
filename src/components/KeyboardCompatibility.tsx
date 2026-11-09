import { useI18n } from '../i18n/I18nProvider';
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
  const { t } = useI18n();
  const result = checkKeyboardCompatibility(
    text,
    preferences.keyboard,
    preferences.assistance,
  );
  if (result.status === 'unknown' && !detailed) return null;
  const label = {
    compatible: t('Compatible with your selected keyboard'),
    assisted: t('Compatible with character help'),
    'needs-input': t('Some characters need extra input'),
    unknown: t('Keyboard compatibility not verified'),
  }[result.status];
  const detail = result.missing.length
    ? /\p{Script=Hangul}/u.test(result.missing.join(''))
      ? t(
          'This story uses Korean Hangul. Enable a Korean input method to type it; character help cannot replace Hangul with Latin letters.',
        )
      : t(
          'Check these characters: {characters}. They may need shortcuts or another input method.',
          { characters: result.missing.join(' ') },
        )
    : result.assisted.length
      ? t(
          'Accepted with character help: {characters}. Similar characters appear in yellow.',
          { characters: result.assisted.join(' ') },
        )
      : result.status === 'unknown'
        ? t(
            'Choose English (US), Italian QWERTY, or French AZERTY (classic) in Preferences to check this story.',
          )
        : t(
            'Based on the layout selected in Preferences, including normal modifier keys.',
          );
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
