import type { Story, Language } from './stories/types';
import type { Session } from './types';

export const languageNames: Record<Language, string> = {
  en: 'English',
  ko: '한국어',
  it: 'Italiano',
  fr: 'Français',
};
export interface LibraryFilters {
  query: string;
  genre: string;
  language: string;
  time: 'all' | 'short' | 'medium' | 'long';
  progress: 'all' | 'new' | 'started' | 'finished';
  sort: 'collection' | 'title' | 'shortest';
}
export const defaultFilters: LibraryFilters = {
  query: '',
  genre: 'all',
  language: 'all',
  time: 'all',
  progress: 'all',
  sort: 'collection',
};
const searchable = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

export function filterStories(
  stories: Story[],
  filters: LibraryFilters,
  sessions: Record<string, Session>,
  preferredLanguage: Language | 'none' = 'none',
) {
  const query = searchable(filters.query.trim());
  const matches = stories.filter((story) => {
    const session = sessions[story.id];
    if (filters.genre !== 'all' && story.genre !== filters.genre) return false;
    if (filters.language !== 'all' && story.language !== filters.language)
      return false;
    if (filters.time === 'short' && story.estimatedMinutes > 5) return false;
    if (
      filters.time === 'medium' &&
      (story.estimatedMinutes <= 5 || story.estimatedMinutes > 10)
    )
      return false;
    if (filters.time === 'long' && story.estimatedMinutes <= 10) return false;
    if (filters.progress === 'new' && session?.started) return false;
    if (
      filters.progress === 'started' &&
      (!session?.started || session.finished)
    )
      return false;
    if (filters.progress === 'finished' && !session?.finished) return false;
    return (
      !query ||
      searchable(`${story.title} ${story.description}`).includes(query)
    );
  });
  // Keep editions together. Prefer the edition already in progress when no language is selected.
  const groups = new Map<string, Story>();
  const sessionRank = (story: Story) => {
    const session = sessions[story.id];
    const languageRank = story.language === preferredLanguage ? 4 : 0;
    return (
      languageRank +
      (session?.started && !session.finished ? 2 : session?.finished ? 1 : 0)
    );
  };
  for (const story of matches) {
    const previous = groups.get(story.storyId);
    if (!previous || sessionRank(story) > sessionRank(previous))
      groups.set(story.storyId, story);
  }
  const result = [...groups.values()];
  if (filters.sort === 'title')
    result.sort((a, b) => a.title.localeCompare(b.title));
  if (filters.sort === 'shortest')
    result.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
  return result;
}
