import { lastFrequency } from './last-frequency';
import { oneSmallGarden } from './one-small-garden';
import { theOvenInspector } from './the-oven-inspector';
import { theLastRepair } from './the-last-repair';
import type { Story } from './types';

export const stories: Story[] = [
  lastFrequency,
  oneSmallGarden,
  theOvenInspector,
  theLastRepair,
];
export const findStory = (hash: string) =>
  stories.find((story) => '#' + story.id === hash);
