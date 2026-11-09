import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stories } from '../src/stories';
import { defaultFilters, filterStories } from '../src/library';
import type { Session } from '../src/types';

test('Korean stories are available through the language filter', () => {
  const result = filterStories(
    stories,
    { ...defaultFilters, language: 'ko' },
    {},
  );
  assert.equal(
    result.length,
    stories.filter((story) => story.language === 'ko').length,
  );
  assert.equal(result[0].title, '비를 멈추는 버튼');
});

test('the default catalog groups translations into one story card', () => {
  const result = filterStories(stories, defaultFilters, {});
  assert.equal(
    result.length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  assert.equal(
    result.filter((story) => story.storyId === 'one-small-garden').length,
    1,
  );
});

test('genre, language, and time filters intersect', () => {
  const filters = {
    ...defaultFilters,
    genre: 'Science fiction',
    language: 'it',
    time: 'medium' as const,
  };
  assert.deepEqual(
    filterStories(stories, filters, {}).map((story) => story.id),
    ['un-piccolo-giardino'],
  );
  assert.equal(
    filterStories(stories, { ...filters, time: 'short' }, {}).length,
    0,
  );
  for (const [time, minimum, maximum] of [
    ['long', 11, 30],
    ['extended', 31, 60],
    ['epic', 61, Infinity],
  ] as const) {
    const result = filterStories(stories, { ...defaultFilters, time }, {});
    assert.ok(result.length > 0);
    assert.ok(
      result.every(
        (story) =>
          story.estimatedMinutes >= minimum &&
          story.estimatedMinutes <= maximum,
      ),
    );
  }
});

test('search ignores case and accents', () => {
  assert.equal(
    filterStories(stories, { ...defaultFilters, query: 'MANUTENZIONE' }, {})[0]
      .language,
    'it',
  );
  const accented = { ...stories[0], title: 'Caffè' };
  assert.equal(
    filterStories([accented], { ...defaultFilters, query: 'caffe' }, {}).length,
    1,
  );
});

test('progress filters operate independently for each language edition', () => {
  const session: Session = {
    value: 'Ogni',
    started: true,
    finished: false,
    attempts: 4,
    correct: 4,
    elapsed: 1000,
  };
  const sessions = { 'un-piccolo-giardino': session };
  assert.equal(
    filterStories(
      stories,
      { ...defaultFilters, progress: 'started' },
      sessions,
    )[0].id,
    'un-piccolo-giardino',
  );
  assert.equal(
    filterStories(
      stories,
      { ...defaultFilters, language: 'en', progress: 'new' },
      sessions,
    ).length,
    stories.filter((story) => story.language === 'en').length,
  );
  assert.equal(
    filterStories(
      stories,
      { ...defaultFilters, progress: 'finished' },
      sessions,
    ).length,
    0,
  );
  assert.equal(
    filterStories(
      stories,
      { ...defaultFilters, progress: 'finished' },
      { 'un-piccolo-giardino': { ...session, finished: true } },
    ).length,
    1,
  );
});

test('shortest first uses numeric estimates', () => {
  const result = filterStories(
    stories,
    { ...defaultFilters, sort: 'shortest' },
    {},
  );
  const minutes = result.map((story) => story.estimatedMinutes);
  assert.deepEqual(
    minutes,
    [...minutes].sort((a, b) => a - b),
  );
});

test('the grouped card prefers an unfinished edition over a completed one', () => {
  const completed: Session = {
    value: '',
    started: true,
    finished: true,
    attempts: 0,
    correct: 0,
    elapsed: 0,
  };
  const result = filterStories(stories, defaultFilters, {
    'one-small-garden': completed,
    'un-piccolo-giardino': { ...completed, finished: false },
  });
  assert.equal(
    result.find((story) => story.storyId === 'one-small-garden')!.id,
    'un-piccolo-giardino',
  );
});

test('preferred language chooses a translated edition without hiding other stories', () => {
  const result = filterStories(stories, defaultFilters, {}, ['it']);
  assert.equal(
    result.length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  assert.equal(
    result.find((story) => story.storyId === 'one-small-garden')!.language,
    'it',
  );
  assert.ok(result.some((story) => story.language === 'en'));
});

test('French can be filtered or preferred without duplicating story cards', () => {
  const french = filterStories(
    stories,
    { ...defaultFilters, language: 'fr' },
    {},
  );
  assert.ok(french.some((story) => story.id === 'un-petit-jardin'));
  assert.ok(french.every((story) => story.language === 'fr'));
  const result = filterStories(stories, defaultFilters, {}, ['fr']);
  assert.equal(
    result.length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  assert.equal(
    result.find((story) => story.storyId === 'one-small-garden')!.title,
    'Un petit jardin',
  );
});

test('multiple reading languages prefer available editions and preserve an in-progress preferred edition', () => {
  const result = filterStories(
    stories,
    defaultFilters,
    {
      'un-piccolo-giardino': {
        value: 'Ogni',
        started: true,
        finished: false,
        attempts: 4,
        correct: 4,
        elapsed: 100,
      },
    },
    ['en', 'it'],
  );
  assert.equal(
    result.find((story) => story.storyId === 'one-small-garden')!.language,
    'it',
  );
  assert.ok(result.some((story) => story.language === 'en'));
  assert.equal(
    result.length,
    new Set(stories.map((story) => story.storyId)).size,
  );
  const explicitFrench = filterStories(
    stories,
    { ...defaultFilters, language: 'fr' },
    {},
    ['en', 'it'],
  );
  assert.equal(explicitFrench[0].language, 'fr');
});

test('remembered editions override automatic ranking but respect filters', () => {
  const choices = { 'one-small-garden': 'un-piccolo-giardino' };
  const selected = filterStories(
    stories,
    defaultFilters,
    {},
    ['en', 'it'],
    choices,
  );
  assert.equal(
    selected.find((s) => s.storyId === 'one-small-garden')?.id,
    choices['one-small-garden'],
  );
  const english = filterStories(
    stories,
    { ...defaultFilters, language: 'en' },
    {},
    ['en', 'it'],
    choices,
  );
  assert.equal(
    english.find((s) => s.storyId === 'one-small-garden')?.language,
    'en',
  );
  const stale = filterStories(stories, defaultFilters, {}, ['en'], {
    'one-small-garden': 'deleted-edition',
  });
  assert.equal(
    stale.find((s) => s.storyId === 'one-small-garden')?.language,
    'en',
  );
});
