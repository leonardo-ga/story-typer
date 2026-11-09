// DOM offsets use UTF-16; scoring and rendering use complete visible characters.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
let cachedTarget = '';
/** @type {{char:string, start:number, end:number}[]} */
let cachedCharacters = [];

/** @param {string} target */
function expectedCharacters(target) {
  if (target !== cachedTarget) {
    cachedCharacters = segmentText(target);
    cachedTarget = target;
  }
  return cachedCharacters;
}

/** @param {string} text */
export function segmentText(text) {
  return Array.from(segmenter.segment(text), (part) => ({
    char: part.segment,
    start: part.index,
    end: part.index + part.segment.length,
  }));
}

/** Read one grapheme lazily; do not segment a long remaining story on timer ticks.
 * @param {string} text
 */
export function firstCharacter(text) {
  return segmenter.segment(text)[Symbol.iterator]().next().value?.segment ?? '';
}

/** @param {string | undefined} actual @param {string | undefined} expected @param {boolean} [assistance] */
export function matchCharacter(actual, expected, assistance = false) {
  if (actual === undefined || expected === undefined) return 'incorrect';
  if (actual === expected) return 'correct';
  if (!assistance || actual.length !== 1 || expected.length !== 1)
    return 'incorrect';
  const base = (/** @type {string} */ char) =>
    char.normalize('NFD').replace(/\p{M}/gu, '');
  const expectedBase = base(expected);
  if (
    /^[A-Za-z]$/.test(expectedBase) &&
    expectedBase !== expected &&
    base(actual) === expectedBase
  )
    return 'assisted';
  const punctuation = ["'‘’", '"“”', '-–—', ' \u00a0'];
  if (
    punctuation.some(
      (group) => group.includes(actual) && group.includes(expected),
    )
  )
    return 'assisted';
  return 'incorrect';
}

/** @param {string} value @param {string} target @param {boolean} [assistance] */
export function analyzeTyping(value, target, assistance = false) {
  const expected = expectedCharacters(target);
  let correct = 0;
  let mistake = -1;
  for (const [index, part] of segmentText(value).entries()) {
    if (
      matchCharacter(part.char, expected[index]?.char, assistance) !==
      'incorrect'
    )
      correct++;
    else if (mistake === -1) mistake = expected[index]?.start ?? target.length;
  }
  return { correct, mistake, total: expected.length };
}
/** @param {string} value @param {string} target */
export function typingCursor(value, target) {
  const expected = expectedCharacters(target);
  const count = segmentText(value).length;
  return {
    count,
    offset: expected[count]?.start ?? target.length,
    total: expected.length,
  };
}
// Unicode uses different jamo for final and initial consonants. An IME can
// move a final consonant to the next syllable when the next vowel arrives.
const hangulFinals = [
  'ᄀ',
  'ᄁ',
  'ᄀᄉ',
  'ᄂ',
  'ᄂᄌ',
  'ᄂᄒ',
  'ᄃ',
  'ᄅ',
  'ᄅᄀ',
  'ᄅᄆ',
  'ᄅᄇ',
  'ᄅᄉ',
  'ᄅᄐ',
  'ᄅᄑ',
  'ᄅᄒ',
  'ᄆ',
  'ᄇ',
  'ᄇᄉ',
  'ᄉ',
  'ᄊ',
  'ᄋ',
  'ᄌ',
  'ᄎ',
  'ᄏ',
  'ᄐ',
  'ᄑ',
  'ᄒ',
];
/** @param {string} text */
function hangulSequence(text) {
  return text
    .normalize('NFD')
    .replace(/[ᆨ-ᇂ]/g, (char) => hangulFinals[char.charCodeAt(0) - 0x11a8]);
}
/** @param {string} previous @param {string} next @param {string} target @param {boolean} assistance @param {'correct'|'forward'|'free'} mode @param {boolean} [composition] */
export function applyErrorMode(
  previous,
  next,
  target,
  assistance,
  mode,
  composition = false,
) {
  if (mode === 'forward' && !next.startsWith(previous)) {
    // Korean IMEs may extend the last committed syllable or carry its final
    // consonant into the next one. Preserve earlier text and permit only an
    // extension of its decomposed Hangul sequence, never deletion/correction.
    const last = segmentText(previous).at(-1);
    const hangulExtension =
      composition &&
      last &&
      /^\p{Script=Hangul}+$/u.test(last.char) &&
      next.startsWith(previous.slice(0, last.start)) &&
      hangulSequence(next).startsWith(hangulSequence(previous));
    if (!hangulExtension) return previous;
  }
  if (mode === 'correct')
    return constrainTyping(previous, next, target, assistance);
  const limit = expectedCharacters(target).length;
  return segmentText(next)
    .slice(0, limit)
    .map((part) => part.char)
    .join('');
}
/**
 * @template {{ text: string }} T
 * @param {T[]} paragraphs
 */
export function buildStoryText(paragraphs) {
  let offset = 0;
  let characterOffset = 0;
  return paragraphs.map((paragraph, index) => {
    const text =
      paragraph.text.normalize('NFC') +
      (index < paragraphs.length - 1 ? ' ' : '');
    const characters = segmentText(text);
    const part = {
      ...paragraph,
      text,
      characters,
      characterStart: characterOffset,
      characterEnd: characterOffset + characters.length,
      start: offset,
      end: offset + text.length,
    };
    offset = part.end;
    characterOffset = part.characterEnd;
    return part;
  });
}

/** @param {{end: number}[]} paragraphs @param {number} length */
export function activeParagraphIndex(paragraphs, length) {
  const index = paragraphs.findIndex((paragraph) => length < paragraph.end);
  return index === -1 ? paragraphs.length - 1 : index;
}

/** @param {string} input @param {{end: number, characterEnd?:number}[]} paragraphs */
export function normalizeParagraphBreaks(input, paragraphs) {
  const breaks = new Set(
    paragraphs.slice(0, -1).map((part) => (part.characterEnd ?? part.end) - 1),
  );
  let normalized = '';
  let count = 0;
  for (const { char } of segmentText(
    input.normalize('NFC').replace(/\r\n?/g, '\n'),
  )) {
    if (char !== '\n') {
      normalized += char;
      count++;
    } else if (breaks.has(count)) {
      normalized += ' ';
      count++;
    }
  }
  return normalized;
}

// Keep at most one unresolved mistake. Backspace and valid replacements remain available.
/** @param {string} previous @param {string} next @param {string} target @param {boolean} [assistance] */
export function constrainTyping(previous, next, target, assistance = false) {
  if (next.length < previous.length) return next;
  const expected = expectedCharacters(target);
  for (const [index, part] of segmentText(next).entries()) {
    if (
      matchCharacter(part.char, expected[index]?.char, assistance) ===
      'incorrect'
    )
      return next.slice(0, part.end);
  }
  return next;
}

/** @param {Pick<HTMLTextAreaElement, 'value' | 'selectionStart' | 'selectionEnd' | 'setSelectionRange'>} input */
export function moveCaretToEnd(input) {
  const end = input.value.length;
  if (input.selectionStart !== end || input.selectionEnd !== end) {
    input.setSelectionRange(end, end);
  }
}

/** @param {string} previous @param {string} next @param {string} target @param {boolean} [assistance] */
export function countEdit(previous, next, target, assistance = false) {
  const before = segmentText(previous);
  const after = segmentText(next);
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start].char === after[start].char
  )
    start++;
  let oldEnd = before.length;
  let newEnd = after.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    before[oldEnd - 1].char === after[newEnd - 1].char
  ) {
    oldEnd--;
    newEnd--;
  }
  const inserted = after.slice(start, newEnd);
  const expected = expectedCharacters(target);
  return {
    attempts: inserted.length,
    correct: inserted.filter(
      (part, index) =>
        matchCharacter(part.char, expected[start + index]?.char, assistance) !==
        'incorrect',
    ).length,
  };
}
