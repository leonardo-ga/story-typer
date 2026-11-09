import { stories } from '../stories';
import { KeyboardCompatibility } from './KeyboardCompatibility';
import type { Session } from '../types';
import { StoryCover } from './StoryCover';
import { analyzeTyping, typingCursor } from '../typing.mjs';
import {
  filterStories,
  languageNames,
  defaultFilters,
  type LibraryFilters as Filters,
} from '../library';
import { LibraryFilters } from './LibraryFilters';
import type { Preferences } from '../preferences';

export function StoryLibrary({
  sessions,
  filters,
  onFiltersChange,
  preferences,
}: {
  sessions: Record<string, Session>;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  preferences: Preferences;
}) {
  const visibleStories = filterStories(
    stories,
    filters,
    sessions,
    preferences.language,
  );
  const storyCount = new Set(stories.map((story) => story.storyId)).size;
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
        <LibraryFilters filters={filters} onChange={onFiltersChange} />
        <div className="collection-heading">
          <h2>The collection</h2>
          <span role="status">
            {visibleStories.length} OF {storyCount} STORIES
          </span>
        </div>
        {visibleStories.map((item) => {
          const saved = sessions[item.id];
          const target = item.paragraphs
            .map((part) => part.text.normalize('NFC'))
            .join(' ');
          const analysis = analyzeTyping(
            saved?.value ?? '',
            target,
            saved?.assistance ?? false,
          );
          const savedProgress = saved
            ? Math.round(
                ((saved.errorMode && saved.errorMode !== 'correct'
                  ? typingCursor(saved.value, target).count
                  : analysis.correct) /
                  analysis.total) *
                  100,
              )
            : 0;
          return (
            <article className={`story-card theme-${item.theme}`} key={item.id}>
              <StoryCover story={item} />
              <div className="story-card-body">
                <span className="eyebrow">{item.genre.toUpperCase()}</span>
                <h2 lang={item.language}>{item.title}</h2>
                <p lang={item.language}>{item.description}</p>
                <div className="tags">
                  <span>{item.paragraphs.length} PARAGRAPHS</span>
                  <span title="Estimated typing time; varies with your speed">
                    ~{item.estimatedMinutes} MIN
                  </span>
                  <span lang={item.language}>
                    {languageNames[item.language]}
                  </span>
                </div>
                {preferences.language !== 'none' &&
                  item.language !== preferences.language && (
                    <p className="edition-fallback">
                      {stories.some(
                        (edition) =>
                          edition.storyId === item.storyId &&
                          edition.language === preferences.language,
                      )
                        ? `Showing ${languageNames[item.language]} for these filters.`
                        : `Not yet in ${languageNames[preferences.language]}. Available in ${languageNames[item.language]}.`}
                    </p>
                  )}
                <KeyboardCompatibility
                  text={target}
                  preferences={preferences}
                />
                <a className="primary" href={`#${item.id}`}>
                  {saved?.finished
                    ? 'View your results'
                    : saved?.started
                      ? 'Continue story'
                      : 'Explore story'}{' '}
                  <span>→</span>
                </a>
                {stories.some(
                  (edition) =>
                    edition.storyId === item.storyId && edition.id !== item.id,
                ) && (
                  <div
                    className="story-editions"
                    aria-label="Other language editions"
                  >
                    <span>Also in</span>
                    {stories
                      .filter(
                        (edition) =>
                          edition.storyId === item.storyId &&
                          edition.id !== item.id,
                      )
                      .map((edition) => (
                        <a
                          key={edition.id}
                          href={`#${edition.id}`}
                          lang={edition.language}
                          aria-label={`${edition.title} — ${languageNames[edition.language]}`}
                        >
                          {languageNames[edition.language]}
                        </a>
                      ))}
                  </div>
                )}
                {saved?.started && !saved.finished && (
                  <span className="saved-progress">
                    {savedProgress}% complete · Saved for this visit
                  </span>
                )}
              </div>
            </article>
          );
        })}
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
