import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryText,
  constrainTyping,
  normalizeParagraphBreaks,
} from '../src/typing.mjs';

import { stories } from '../src/stories/index.ts';
import { getTheme } from '../src/stories/themes.ts';
import { createStoryCatalog } from '../src/stories/catalog.ts';
import { getStoryText } from '../src/stories/text.ts';
import { covers } from '../src/components/covers/index.ts';

test('the catalog indexes routes and editions and rejects ambiguous registrations', () => {
  const catalog = createStoryCatalog(stories);
  for (const story of stories) {
    assert.equal(catalog.findStory(`#${story.id}`), story);
    assert.ok(catalog.editionsFor(story.storyId).includes(story));
    assert.ok(covers[story.theme]);
    assert.equal(getStoryText(story), getStoryText(story));
    assert.equal(
      getStoryText(story).text,
      story.paragraphs.map((part) => part.text.normalize('NFC')).join(' '),
    );
  }
  assert.equal(catalog.findStory('#missing-story'), undefined);
  assert.throws(() => createStoryCatalog([]), /empty/);
  assert.throws(
    () => createStoryCatalog([stories[0], stories[0]]),
    /Duplicate story route/,
  );
  assert.throws(
    () =>
      createStoryCatalog([
        stories[0],
        { ...stories[0], id: 'duplicate-edition' },
      ]),
    /Duplicate .* edition/,
  );
});

test('catalog indexes remain independent when the source collection changes', () => {
  const collection = Array.from({ length: 1000 }, (_, index) => ({
    ...stories[0],
    id: `story-${index}`,
    storyId: `story-${index}`,
  }));
  const catalog = createStoryCatalog(collection);
  collection.pop();
  assert.equal(catalog.storyCount, 1000);
  assert.equal(catalog.stories.length, 1000);
  assert.equal(catalog.findStory('#story-999')?.id, 'story-999');
});

test('stories have unique routes and complete presentation metadata', () => {
  assert.equal(new Set(stories.map((story) => story.id)).size, stories.length);
  for (const story of stories) {
    for (const key of [
      'id',
      'title',
      'description',
      'genre',
      'language',
      'storyId',
      'theme',
      'caption',
      'setting',
      'ending',
      'epilogue',
    ]) {
      assert.ok(story[key]?.trim(), `${story.id}: missing ${key}`);
    }
    assert.ok(story.paragraphs.length > 0);
    assert.ok(story.estimatedMinutes > 0);
    assert.ok(getTheme(story.theme));
  }
});

test('each language edition has a unique route and independent session key', () => {
  const gardenEditions = stories.filter(
    (story) => story.storyId === 'one-small-garden',
  );
  assert.deepEqual(
    new Set(gardenEditions.map((story) => story.language)),
    new Set(['en', 'it', 'fr']),
  );
  assert.equal(
    new Set(gardenEditions.map((story) => story.id)).size,
    gardenEditions.length,
  );
  assert.notEqual(
    gardenEditions[0].paragraphs[0].text,
    gardenEditions[1].paragraphs[0].text,
  );
});

for (const story of stories) {
  test(`${story.title} can be completed using Enter at every paragraph break`, () => {
    const parts = buildStoryText(story.paragraphs);
    const target = parts.map((part) => part.text).join('');
    let entered = '';
    for (const [index, part] of story.paragraphs.entries()) {
      // Validate every character in batches; per-keystroke edge cases live in
      // metrics/interactions tests. Avoid quadratic work for a large catalog.
      const next = entered + part.text;
      assert.equal(constrainTyping(entered, next, target), next);
      entered = next;
      if (index < parts.length - 1)
        entered = normalizeParagraphBreaks(entered + '\n', parts);
    }
    assert.equal(entered, target);
  });
}
