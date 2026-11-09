import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accuracy, wordsPerMinute } from '../src/metrics.mjs';
import {
  activeParagraphIndex,
  analyzeTyping,
  segmentText,
  matchCharacter,
  applyErrorMode,
  typingCursor,
  buildStoryText,
  constrainTyping,
  countEdit,
  moveCaretToEnd,
  normalizeParagraphBreaks,
} from '../src/typing.mjs';

test('error policies distinguish blocking, irreversible typing, and optional corrections', () => {
  assert.equal(applyErrorMode('a', 'axc', 'abc', false, 'correct'), 'ax');
  assert.equal(applyErrorMode('ax', 'a', 'abc', false, 'forward'), 'ax');
  assert.equal(applyErrorMode('ax', 'ab', 'abc', false, 'forward'), 'ax');
  assert.equal(applyErrorMode('ax', 'a', 'abc', false, 'free'), 'a');
  assert.equal(applyErrorMode('', 'xyzextra', 'abc', false, 'free'), 'xyz');
  assert.equal(typingCursor('😀x cd', 'ab cd').count, 5);
  assert.equal(typingCursor('😀x cd', 'ab cd').offset, 5);
  const parts = buildStoryText([{ text: 'ab' }, { text: 'cd' }]);
  assert.equal(normalizeParagraphBreaks('😀x\n', parts), '😀x ');
  assert.equal(analyzeTyping('😀x cd', 'ab cd').correct, 3);
});

test('assisted typing accepts defined equivalents without accepting unrelated letters or case', () => {
  assert.equal(matchCharacter('a', 'à', true), 'assisted');
  assert.equal(matchCharacter('e', 'È', true), 'incorrect');
  assert.equal(matchCharacter('a', 'à', false), 'incorrect');
  assert.equal(matchCharacter('а', 'à', true), 'incorrect');
  assert.equal(matchCharacter("'", '’', true), 'assisted');
  assert.equal(matchCharacter('-', '—', true), 'assisted');
  assert.equal(matchCharacter('b', 'à', true), 'incorrect');
  assert.equal(constrainTyping('', 'da qua', 'dà qua', true), 'da qua');
  assert.deepEqual(analyzeTyping('da qua', 'dà qua', true), {
    correct: 6,
    mistake: -1,
    total: 6,
  });
  assert.deepEqual(countEdit('', 'da', 'dà', true), {
    attempts: 2,
    correct: 2,
  });
  assert.deepEqual(countEdit('', 'da', 'dà'), { attempts: 2, correct: 1 });
});

test('emoji and combined characters count as complete visible characters', () => {
  const target = 'A😀👩‍🔧é';
  assert.deepEqual(countEdit('', target, target), { attempts: 4, correct: 4 });
  assert.deepEqual(analyzeTyping(target, target), {
    correct: 4,
    mistake: -1,
    total: 4,
  });
  assert.equal(segmentText(target)[2].char, '👩‍🔧');
  assert.equal(constrainTyping('A', 'A🙃extra', target), 'A🙃');
  assert.equal(analyzeTyping('A🙃', target).mistake, 1);
  const paragraphs = buildStoryText([{ text: 'café' }]);
  assert.equal(normalizeParagraphBreaks('cafe\u0301', paragraphs), 'café');
});

test('Enter and Space are equivalent only at paragraph boundaries', () => {
  const parts = buildStoryText([{ text: 'Rain falls.' }, { text: 'A voice.' }]);
  assert.equal(
    normalizeParagraphBreaks('Rain falls.\n', parts),
    'Rain falls. ',
  );
  assert.equal(
    normalizeParagraphBreaks('Rain falls.\r\n', parts),
    'Rain falls. ',
  );
  assert.equal(normalizeParagraphBreaks('Rain falls. ', parts), 'Rain falls. ');
  assert.equal(normalizeParagraphBreaks('Rain\n', parts), 'Rain');
  assert.equal(
    normalizeParagraphBreaks('Rain falls.\n\n', parts),
    'Rain falls. ',
  );
  assert.equal(
    normalizeParagraphBreaks('Rain falls.\nA voice.\n', parts),
    'Rain falls. A voice.',
  );
  assert.deepEqual(
    countEdit(
      'Rain falls.',
      normalizeParagraphBreaks('Rain falls.\n', parts),
      'Rain falls. A voice.',
    ),
    { attempts: 1, correct: 1 },
  );
});

test('a mistake blocks further progress until corrected, including across paragraphs', () => {
  const target = 'Rain. A voice.';
  assert.equal(constrainTyping('Ra', 'Rax', target), 'Rax');
  assert.equal(constrainTyping('Rax', 'Rax more words', target), 'Rax');
  assert.equal(constrainTyping('Rax', 'Ra', target), 'Ra');
  assert.equal(constrainTyping('Ra', 'Rain. A', target), 'Rain. A');
  assert.equal(constrainTyping('Rain.', 'Rain.A voice.', target), 'Rain.A');
});

test('paragraph boundaries preserve a natural space and support backspace into earlier text', () => {
  const parts = buildStoryText([{ text: 'Rain.' }, { text: 'A voice.' }]);
  const target = parts.map((part) => part.text).join('');
  assert.equal(target, 'Rain. A voice.');
  assert.equal(activeParagraphIndex(parts, 5), 0);
  assert.equal(activeParagraphIndex(parts, 6), 1);
  assert.equal(activeParagraphIndex(parts, target.length), 1);
  assert.equal(activeParagraphIndex(parts, 5), 0);
  assert.deepEqual(countEdit('Rain. A', 'Rain.', target), {
    attempts: 0,
    correct: 0,
  });
  assert.deepEqual(countEdit('Rain.', 'Rain. A', target), {
    attempts: 2,
    correct: 2,
  });
});
test('an error before a paragraph boundary can be corrected without resetting input', () => {
  const target = buildStoryText([{ text: 'Rain.' }, { text: 'A voice.' }])
    .map((part) => part.text)
    .join('');
  const entered = 'Rxin. A';
  assert.notEqual(entered, target.slice(0, entered.length));
  assert.deepEqual(countEdit(entered, 'Rain. A', target), {
    attempts: 1,
    correct: 1,
  });
});
test('refocusing keeps the native insertion point aligned with the displayed cursor', () => {
  const input = {
    value: 'Rain',
    selectionStart: 1,
    selectionEnd: 1,
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
  };
  moveCaretToEnd(input);
  assert.equal(input.selectionStart, 4);
  assert.equal(input.selectionEnd, 4);
});
test('deletion never counts unchanged characters as new typing attempts', () => {
  assert.deepEqual(countEdit('Raxin', 'Rain', 'Rain'), {
    attempts: 0,
    correct: 0,
  });
  assert.deepEqual(countEdit('Rain', 'Rai', 'Rain'), {
    attempts: 0,
    correct: 0,
  });
});
test('correction counts only the replacement, not the unchanged suffix', () => {
  assert.deepEqual(countEdit('Rxin', 'Rain', 'Rain'), {
    attempts: 1,
    correct: 1,
  });
  assert.deepEqual(countEdit('Rai', 'Rain', 'Rain'), {
    attempts: 1,
    correct: 1,
  });
});
test('extra characters at the paragraph end are errors and backspace removes them first', () => {
  const target = 'Rain.';
  const entered = 'Rxin.';
  const overflow = entered + 'ab';
  assert.deepEqual(countEdit(entered, overflow, target), {
    attempts: 2,
    correct: 0,
  });
  assert.deepEqual(countEdit(overflow, overflow.slice(0, -1), target), {
    attempts: 0,
    correct: 0,
  });
  assert.equal(overflow.slice(0, -2), entered);
  assert.deepEqual(countEdit(entered, target, target), {
    attempts: 1,
    correct: 1,
  });
});
test('accuracy includes mistakes even after correction', () => {
  assert.equal(accuracy(0, 0), 100);
  assert.equal(accuracy(9, 10), 90);
  assert.equal(accuracy(10, 11), 91);
});
test('WPM uses five characters per word and active elapsed time', () => {
  assert.equal(wordsPerMinute(250, 60000), 50);
  assert.equal(wordsPerMinute(250, 120000), 25);
  assert.equal(wordsPerMinute(0, 0), 0);
});
