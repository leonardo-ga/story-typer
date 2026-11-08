// DOM offsets use UTF-16; scoring and rendering use complete visible characters.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
let cachedTarget = '';
/** @type {Map<number, string>} */
let cachedCharacters = new Map();

/** @param {string} target */
function expectedCharacters(target) {
  if (target !== cachedTarget) {
    cachedCharacters = new Map(
      segmentText(target).map((part) => [part.start, part.char]),
    );
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

/** @param {string} value @param {string} target */
export function analyzeTyping(value, target) {
  const expected = expectedCharacters(target);
  let correct = 0;
  let mistake = -1;
  for (const part of segmentText(value)) {
    if (part.char === expected.get(part.start)) correct++;
    else if (mistake === -1) mistake = part.start;
  }
  return { correct, mistake, total: expected.size };
}
/**
 * @template {{ text: string }} T
 * @param {T[]} paragraphs
 */
export function buildStoryText(paragraphs) {
  let offset = 0;
  return paragraphs.map((paragraph, index) => {
    const text =
      paragraph.text.normalize('NFC') +
      (index < paragraphs.length - 1 ? ' ' : '');
    const part = {
      ...paragraph,
      text,
      characters: segmentText(text),
      start: offset,
      end: offset + text.length,
    };
    offset = part.end;
    return part;
  });
}

/** @param {{end: number}[]} paragraphs @param {number} length */
export function activeParagraphIndex(paragraphs, length) {
  const index = paragraphs.findIndex((paragraph) => length < paragraph.end);
  return index === -1 ? paragraphs.length - 1 : index;
}

/** @param {string} input @param {{end: number}[]} paragraphs */
export function normalizeParagraphBreaks(input, paragraphs) {
  const breaks = new Set(paragraphs.slice(0, -1).map((part) => part.end - 1));
  let normalized = '';
  for (const char of input.normalize('NFC').replace(/\r\n?/g, '\n')) {
    if (char !== '\n') normalized += char;
    else if (breaks.has(normalized.length)) normalized += ' ';
  }
  return normalized;
}

// Keep at most one unresolved mistake. Backspace and valid replacements remain available.
/** @param {string} previous @param {string} next @param {string} target */
export function constrainTyping(previous, next, target) {
  if (next.length < previous.length) return next;
  const expected = expectedCharacters(target);
  for (const part of segmentText(next)) {
    if (part.char !== expected.get(part.start)) return next.slice(0, part.end);
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

/** @param {string} previous @param {string} next @param {string} target */
export function countEdit(previous, next, target) {
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
    correct: inserted.filter((part) => part.char === expected.get(part.start))
      .length,
  };
}
