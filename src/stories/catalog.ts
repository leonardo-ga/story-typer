import type { Language, Story } from './types';

export interface StoryCatalog {
  readonly stories: readonly Story[];
  readonly storyCount: number;
  readonly genres: readonly string[];
  readonly languages: readonly Language[];
  findStory: (hash: string) => Story | undefined;
  editionsFor: (storyId: string) => readonly Story[];
}

/** Build once per collection, rather than scanning every edition per card. */
export function createStoryCatalog(stories: readonly Story[]): StoryCatalog {
  if (stories.length === 0)
    throw new Error('The story catalog cannot be empty.');
  const byId = new Map<string, Story>();
  const editions = new Map<string, Story[]>();
  for (const story of stories) {
    if (byId.has(story.id))
      throw new Error(`Duplicate story route: ${story.id}`);
    const family = editions.get(story.storyId) ?? [];
    if (family.some((edition) => edition.language === story.language))
      throw new Error(`Duplicate ${story.language} edition: ${story.storyId}`);
    byId.set(story.id, story);
    family.push(story);
    editions.set(story.storyId, family);
  }
  return {
    stories: [...stories],
    storyCount: editions.size,
    genres: [...new Set(stories.map((story) => story.genre))].sort(),
    languages: [...new Set(stories.map((story) => story.language))],
    findStory: (hash: string) =>
      byId.get(hash.startsWith('#') ? hash.slice(1) : hash),
    editionsFor: (storyId: string): readonly Story[] =>
      editions.get(storyId) ?? [],
  };
}
