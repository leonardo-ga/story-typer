import { useStoryEditions } from '../hooks/useStoryEditions';
import { useI18n } from '../i18n/I18nProvider';
import type { StoryCatalog } from '../stories/catalog';
import { StoryCard } from './StoryCard';
import type { Session } from '../types';
import {
  filterStories,
  matchingEditions,
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
  const { t } = useI18n();
  const { selectedEditions, selectEdition } = useStoryEditions();
  const eligibleEditions = matchingEditions(catalog.stories, filters, sessions);
  const visibleStories = filterStories(
    catalog.stories,
    filters,
    sessions,
    preferences.readingLanguages,
    selectedEditions,
  );
  const { storyCount } = catalog;
  return (
    <>
      <section className="library-intro">
        <span className="eyebrow">
          <span className="live-dot" />
          {t('A LITTLE PRACTICE. A DIFFERENT WORLD.')}
        </span>
        <h1 id="library-title">
          {t('Find your next story')}
          <span>.</span>
        </h1>
        <p>{t('Slow down. Settle in. Let your fingertips turn the pages.')}</p>
      </section>
      <section className="library" aria-labelledby="library-title">
        <LibraryFilters
          catalog={catalog}
          filters={filters}
          onChange={onFiltersChange}
        />
        <div className="collection-heading">
          <h2>{t('The collection')}</h2>
          <span role="status">
            {t('{visible} OF {total} STORIES', {
              visible: visibleStories.length,
              total: storyCount,
            })}
          </span>
        </div>
        {visibleStories.map((story) => (
          <StoryCard
            key={story.storyId}
            availableEditions={eligibleEditions.filter(
              (edition) => edition.storyId === story.storyId,
            )}
            onSelectEdition={(editionId) =>
              selectEdition(story.storyId, editionId)
            }
            story={story}
            catalog={catalog}
            saved={sessions[story.id]}
            preferences={preferences}
          />
        ))}
        {visibleStories.length === 0 && (
          <div className="library-empty">
            <h2>{t('No matching stories')}</h2>
            <p>{t('Try another language, genre, or typing time.')}</p>
            <button
              type="button"
              className="primary"
              onClick={() => onFiltersChange({ ...defaultFilters })}
            >
              {t('Reset filters')}
            </button>
          </div>
        )}
      </section>
      <footer className="library-footer">
        <p>{t('Every story begins with a single keystroke.')}</p>
        <span>{t('More stories to come')}</span>
      </footer>
    </>
  );
}
