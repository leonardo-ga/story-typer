import type { Story } from '../stories/types';
import type { StoryCatalog } from '../stories/catalog';
import { getStoryText } from '../stories/text';
import type { Session } from '../types';
import type { Preferences } from '../preferences';
import { languageNames } from '../languages';
import { analyzeTyping, typingCursor } from '../typing.mjs';
import { StoryCover } from './StoryCover';
import { KeyboardCompatibility } from './KeyboardCompatibility';

interface Props {
  story: Story;
  catalog: StoryCatalog;
  saved?: Session;
  preferences: Preferences;
}

function savedProgress(saved: Session | undefined, target: string) {
  if (!saved) return 0;
  const analysis = analyzeTyping(
    saved.value,
    target,
    saved.assistance ?? false,
  );
  const count =
    saved.errorMode && saved.errorMode !== 'correct'
      ? typingCursor(saved.value, target).count
      : analysis.correct;
  return Math.round((count / analysis.total) * 100);
}

export function StoryCard({ story, catalog, saved, preferences }: Props) {
  const { text } = getStoryText(story);
  const editions = catalog.editionsFor(story.storyId);
  const otherEditions = editions.filter((edition) => edition.id !== story.id);
  const preferredLanguage = preferences.language;
  return (
    <article className={`story-card theme-${story.theme}`}>
      <StoryCover story={story} />
      <div className="story-card-body">
        <span className="eyebrow">{story.genre.toUpperCase()}</span>
        <h2 lang={story.language}>{story.title}</h2>
        <p lang={story.language}>{story.description}</p>
        <div className="tags">
          <span>{story.paragraphs.length} PARAGRAPHS</span>
          <span title="Estimated typing time; varies with your speed">
            ~{story.estimatedMinutes} MIN
          </span>
          <span lang={story.language}>{languageNames[story.language]}</span>
        </div>
        {preferredLanguage !== 'none' &&
          story.language !== preferredLanguage && (
            <p className="edition-fallback">
              {editions.some(
                (edition) => edition.language === preferredLanguage,
              )
                ? `Showing ${languageNames[story.language]} for these filters.`
                : `Not yet in ${languageNames[preferredLanguage]}. Available in ${languageNames[story.language]}.`}
            </p>
          )}
        <KeyboardCompatibility text={text} preferences={preferences} />
        <a className="primary" href={`#${story.id}`}>
          {saved?.finished
            ? 'View your results'
            : saved?.started
              ? 'Continue story'
              : 'Explore story'}{' '}
          <span>→</span>
        </a>
        {otherEditions.length > 0 && (
          <div className="story-editions" aria-label="Other language editions">
            <span>Also in</span>
            {otherEditions.map((edition) => (
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
            {savedProgress(saved, text)}% complete · Saved for this visit
          </span>
        )}
      </div>
    </article>
  );
}
