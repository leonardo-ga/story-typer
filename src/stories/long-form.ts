import type { Story } from './types';

export const practiceWordsPerMinute = 25;

/** Estimates use five visible characters per word, like the game's WPM. */
export function longFormStory(
  metadata: Omit<Story, 'paragraphs' | 'estimatedMinutes' | 'estimateWpm'>,
  prose: string,
): Story {
  const texts = prose
    .trim()
    .split(/\n\s*\n/)
    .map((text) => text.replace(/\s+/g, ' ').normalize('NFC'));
  const characters = Array.from(texts.join(' ')).length;
  return {
    ...metadata,
    estimateWpm: practiceWordsPerMinute,
    estimatedMinutes: Math.max(
      1,
      Math.round(characters / (5 * practiceWordsPerMinute)),
    ),
    paragraphs: texts.map((text, index) => ({
      title: `Passage ${index + 1}`,
      time: '',
      text,
    })),
  };
}
