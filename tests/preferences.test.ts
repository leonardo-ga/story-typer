import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkKeyboardCompatibility } from '../src/keyboardCompatibility';
import { applyErrorMode } from '../src/typing.mjs';
import { italian, translate, type MessageKey } from '../src/i18n/messages';

test('site translations preserve interpolation parameters', () => {
  for (const [key, value] of Object.entries(italian)) {
    assert.ok(value.trim());
    const placeholders = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(placeholders(value), placeholders(key), key);
    assert.equal(translate('en', key as MessageKey), key);
  }
  assert.equal(
    translate('it', '{count} PARAGRAPHS', { count: 4 }),
    '4 PARAGRAFI',
  );
});

test('forward composition permits only Hangul extensions at the end', () => {
  assert.equal(
    applyErrorMode('가', '각', '각자', false, 'forward', true),
    '각',
  );
  assert.equal(
    applyErrorMode('갈', '가라', '가라!', false, 'forward', true),
    '가라',
  );
  assert.equal(applyErrorMode('가', '각', '각자', false, 'forward'), '가');
  assert.equal(
    applyErrorMode('각', '가', '각자', false, 'forward', true),
    '각',
  );
  assert.equal(
    applyErrorMode('가', '나', '나무', false, 'forward', true),
    '가',
  );
  assert.equal(applyErrorMode('ab', 'ac', 'ac!', false, 'forward', true), 'ab');
});

test('story compatibility checks exact characters, assistance and unknown layouts', () => {
  for (const layout of ['us', 'italian', 'french'] as const) {
    const korean = checkKeyboardCompatibility('한글 이야기', layout, true);
    assert.equal(korean.status, 'needs-input');
    assert.ok(korean.missing.includes('한'));
    assert.equal(korean.assisted.length, 0);
  }
  assert.equal(
    checkKeyboardCompatibility('Hello, World! 123', 'us', false).status,
    'compatible',
  );
  assert.equal(
    checkKeyboardCompatibility('àèéìòù', 'italian', false).status,
    'compatible',
  );
  assert.equal(
    checkKeyboardCompatibility('éèàçù', 'french', false).status,
    'compatible',
  );
  assert.deepEqual(checkKeyboardCompatibility('àà è', 'us', false).missing, [
    'à',
    'è',
  ]);
  assert.equal(
    checkKeyboardCompatibility('à — “é”', 'us', true).status,
    'assisted',
  );
  assert.equal(
    checkKeyboardCompatibility('e\u0301', 'us', true).status,
    'assisted',
  );
  assert.deepEqual(checkKeyboardCompatibility('œ🙂', 'us', true).missing, [
    'œ',
    '🙂',
  ]);
  assert.equal(
    checkKeyboardCompatibility('Hello', 'azerty', true).status,
    'unknown',
  );
  assert.equal(
    checkKeyboardCompatibility('Hello', 'unknown', true).status,
    'unknown',
  );
});
import {
  guessKeyboard,
  readPreferences,
  storePreferences,
  preferenceKey,
  defaultPreferences,
  hasSavedPreferences,
  getDefaultPreferences,
} from '../src/preferences';

test('layout suggestions are best-effort and unknown layouts stay unknown', () => {
  assert.equal(
    guessKeyboard(
      new Map([
        ['KeyQ', 'q'],
        ['KeyA', 'a'],
        ['Semicolon', ';'],
        ['Quote', "'"],
      ]),
    ),
    'us',
  );
  assert.equal(guessKeyboard(new Map([['Semicolon', 'ò']])), 'italian');
  assert.equal(
    guessKeyboard(
      new Map([
        ['KeyQ', 'a'],
        ['KeyA', 'q'],
      ]),
    ),
    'azerty',
  );
  assert.equal(
    guessKeyboard(
      new Map([
        ['KeyY', 'z'],
        ['KeyZ', 'y'],
      ]),
    ),
    'qwertz',
  );
  assert.equal(guessKeyboard(new Map()), 'unknown');
});

test('browser-language defaults handle regional tags, unsupported languages and English without duplicates', () => {
  assert.equal(getDefaultPreferences('it-IT').siteLanguage, 'it');
  assert.deepEqual(getDefaultPreferences('it-IT').readingLanguages, [
    'it',
    'en',
  ]);
  assert.equal(getDefaultPreferences('fr-CA').siteLanguage, 'en');
  assert.deepEqual(getDefaultPreferences('fr-CA').readingLanguages, [
    'fr',
    'en',
  ]);
  assert.deepEqual(getDefaultPreferences('ko-KR').readingLanguages, [
    'ko',
    'en',
  ]);
  assert.deepEqual(getDefaultPreferences('en-US').readingLanguages, ['en']);
  assert.deepEqual(getDefaultPreferences('es-ES').readingLanguages, ['en']);
  assert.equal(getDefaultPreferences('').siteLanguage, 'en');
  assert.equal(getDefaultPreferences('IT-it').siteLanguage, 'it');
  assert.equal(getDefaultPreferences('it').keyboard, 'unknown');
});

test('preferences validate saved data and handle blocked browser storage', () => {
  let content: string | null = null;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => (key === preferenceKey ? content : null),
      setItem: (_key: string, value: string) => {
        content = value;
      },
    },
  });
  assert.deepEqual(readPreferences().readingLanguages, ['en']);
  assert.equal(hasSavedPreferences(), false);
  content = '{}';
  assert.equal(hasSavedPreferences(), false);
  assert.equal(
    storePreferences({
      ...defaultPreferences,
      readingLanguages: ['it'],
      assistance: false,
      keyboard: 'us',
    }),
    true,
  );
  assert.deepEqual(readPreferences(), {
    siteLanguage: 'en',
    readingLanguages: ['it'],
    assistance: false,
    keyboard: 'us',
    errorMode: 'free',
  });
  assert.equal(hasSavedPreferences(), true);
  content = '{bad json';
  assert.equal(hasSavedPreferences(), false);
  assert.equal(readPreferences().keyboard, 'unknown');
  content = JSON.stringify({ language: 'it' });
  assert.equal(hasSavedPreferences(), true);
  assert.deepEqual(readPreferences().readingLanguages, ['it']);
  assert.equal(readPreferences().siteLanguage, 'en');
  content = JSON.stringify({
    siteLanguage: 'it',
    readingLanguages: ['en', 'it', 'en', 'invalid'],
    language: 'fr',
  });
  assert.deepEqual(readPreferences().readingLanguages, ['en', 'it']);
  assert.equal(readPreferences().siteLanguage, 'it');
  content = JSON.stringify({ siteLanguage: 'invalid', readingLanguages: [] });
  assert.deepEqual(readPreferences().readingLanguages, []);
  content = JSON.stringify({ language: 'none' });
  assert.deepEqual(readPreferences().readingLanguages, []);
  assert.equal(readPreferences().siteLanguage, 'en');
  content = JSON.stringify({
    language: 'invalid',
    keyboard: 'invalid',
    assistance: 'yes',
  });
  assert.equal(readPreferences().assistance, true);
  assert.equal(hasSavedPreferences(), false);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage blocked');
    },
  });
  assert.deepEqual(readPreferences().readingLanguages, ['en']);
  assert.equal(hasSavedPreferences(), false);
  assert.equal(
    storePreferences({
      ...defaultPreferences,
      readingLanguages: ['it'],
      assistance: true,
      keyboard: 'italian',
    }),
    false,
  );
});
