import type { KeyboardLayout } from './preferences';
import { matchCharacter, segmentText } from './typing.mjs';

// Conservative inventories: absent characters may still work via composition
// or OS shortcuts. Broad layout families deliberately remain unverified.
const ascii = Array.from({ length: 95 }, (_, i) =>
  String.fromCharCode(i + 32),
).join('');
const profiles: Partial<Record<KeyboardLayout, string>> = {
  us: ascii,
  italian: ascii.replace(/[`~]/g, '') + 'àèéìòùç€£§°',
  french: ascii.replace(/[`~]/g, '') + 'àçéèùâêîôûëïüÿÂÊÎÔÛËÏÜŸ€£§°²µ¨',
};

export function checkKeyboardCompatibility(
  text: string,
  keyboard: KeyboardLayout,
  assistance: boolean,
) {
  const inventory = profiles[keyboard];
  if (!inventory)
    return { status: 'unknown' as const, assisted: [], missing: [] };
  const assisted: string[] = [];
  const missing: string[] = [];
  for (const char of new Set(
    segmentText(text.normalize('NFC')).map((part) => part.char),
  )) {
    if (char.length === 1 && inventory.includes(char)) continue;
    if (
      assistance &&
      [...inventory].some(
        (key) => matchCharacter(key, char, true) === 'assisted',
      )
    )
      assisted.push(char);
    else missing.push(char);
  }
  return {
    status: missing.length
      ? ('needs-input' as const)
      : assisted.length
        ? ('assisted' as const)
        : ('compatible' as const),
    assisted,
    missing,
  };
}
