import { buildStoryText } from '../typing.mjs';
import type { Story } from './types';

function prepareStory(story: Story) {
  const paragraphs = buildStoryText(story.paragraphs);
  return {
    paragraphs,
    text: paragraphs.map((part) => part.text).join(''),
    specialCharacters: [
      ...new Set(
        paragraphs
          .flatMap((part) => part.characters.map((character) => character.char))
          .filter((char) => /\p{M}/u.test(char.normalize('NFD'))),
      ),
    ],
  };
}

const prepared = new WeakMap<Story, ReturnType<typeof prepareStory>>();
const plainText = new WeakMap<Story, string>();

/** Catalog cards need text, not every grapheme's rendering metadata. */
export function getStoryPlainText(story: Story) {
  let result = plainText.get(story);
  if (result === undefined) {
    result = story.paragraphs
      .map((part) => part.text.normalize('NFC'))
      .join(' ');
    plainText.set(story, result);
  }
  return result;
}

/** Story content is static. Normalize and segment it only when first needed. */
export function getStoryText(story: Story) {
  let result = prepared.get(story);
  if (!result) {
    result = prepareStory(story);
    prepared.set(story, result);
  }
  return result;
}
