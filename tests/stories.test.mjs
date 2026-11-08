import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryText,
  constrainTyping,
  normalizeParagraphBreaks,
} from '../src/typing.mjs';

import { stories } from '../src/stories/index.ts';

test('stories have unique routes and complete presentation metadata', () => {
  assert.equal(new Set(stories.map((story) => story.id)).size, stories.length);
  for (const story of stories) {
    for (const key of [
      'id',
      'title',
      'description',
      'genre',
      'duration',
      'theme',
      'caption',
      'setting',
      'ending',
      'epilogue',
    ]) {
      assert.ok(story[key]?.trim(), `${story.id}: missing ${key}`);
    }
    assert.ok(story.paragraphs.length > 0);
    assert.ok(story.effect === null || typeof story.effect === 'string');
  }
});

for (const story of stories) {
  test(`${story.title} can be completed using Enter at every paragraph break`, () => {
    const parts = buildStoryText(story.paragraphs);
    const target = parts.map((part) => part.text).join('');
    let entered = '';
    for (const [index, part] of story.paragraphs.entries()) {
      for (const char of part.text) {
        const next = entered + char;
        assert.equal(constrainTyping(entered, next, target), next);
        entered = next;
      }
      if (index < parts.length - 1)
        entered = normalizeParagraphBreaks(entered + '\n', parts);
    }
    assert.equal(entered, target);
  });
}
