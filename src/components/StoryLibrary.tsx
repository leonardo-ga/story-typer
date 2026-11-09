import type { StoryCatalog } from '../stories/catalog';
import { StoryCard } from './StoryCard';
import type { Session } from '../types';
import {
  filterStories,
  defaultFilters,
  type LibraryFilters as Filters,
} from '../library';
import { LibraryFilters } from './LibraryFilters';
import type { Preferences } from '../preferences';

export function StoryLibrary({
  catalog,
  sessions,
  filters,
  onFiltersChange,
  preferences,
}: {
  catalog: StoryCatalog;
  sessions: Record<string, Session>;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  preferences: Preferences;
}) {
  const visibleStories = filterStories(
    catalog.stories,
    filters,
    sessions,
    preferences.language,
  );
  const { storyCount } = catalog;
  return (
    <>
      <section className="library-intro">
        <span className="eyebrow">
          <span className="live-dot" /> A LITTLE PRACTICE. A DIFFERENT WORLD.
        </span>
        <h1 id="library-title">
          Find your next story<span>.</span>
        </h1>
        <p>Slow down. Settle in. Let your fingertips turn the pages.</p>
      </section>
      <section className="library" aria-labelledby="library-title">
        <LibraryFilters
          catalog={catalog}
          filters={filters}
          onChange={onFiltersChange}
        />
        <div className="collection-heading">
          <h2>The collection</h2>
          <span role="status">
            {visibleStories.length} OF {storyCount} STORIES
          </span>
        </div>
        {visibleStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            catalog={catalog}
            saved={sessions[story.id]}
            preferences={preferences}
          />
        ))}
        {visibleStories.length === 0 && (
          <div className="library-empty">
            <h2>No matching stories</h2>
            <p>Try another language, genre, or typing time.</p>
            <button
              type="button"
              className="primary"
              onClick={() => onFiltersChange({ ...defaultFilters })}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>
      <footer className="library-footer">
        <p>Every story begins with a single keystroke.</p>
        <span>More stories to come</span>
      </footer>
    </>
  );
}
