import { useI18n } from '../i18n/I18nProvider';
import type { Story } from '../stories/types';
import type { StoryCatalog } from '../stories/catalog';
import { getStoryPlainText } from '../stories/text';
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
  availableEditions: readonly Story[];
  onSelectEdition: (editionId: string) => void;
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

export function StoryCard({
  story,
  catalog,
  saved,
  preferences,
  availableEditions,
  onSelectEdition,
}: Props) {
  const { t, text: localize } = useI18n();
  const text = getStoryPlainText(story);
  const editions = catalog.editionsFor(story.storyId);
  const readingLanguages = preferences.readingLanguages;
  const preferredEditions = availableEditions.filter((edition) =>
    readingLanguages.includes(edition.language),
  );
  const otherEditions = availableEditions.filter(
    (edition) => !readingLanguages.includes(edition.language),
  );
  return (
    <article className={`story-card theme-${story.theme}`}>
      <StoryCover story={story} />
      <div className="story-card-body">
        <span className="eyebrow">
          {localize(story.genre).toLocaleUpperCase()}
        </span>
        <h2 lang={story.language}>{story.title}</h2>
        <p lang={story.language}>{story.description}</p>
        <div className="tags">
          <span>
            {t('{count} PARAGRAPHS', { count: story.paragraphs.length })}
          </span>
          <span
            title={
              story.estimateWpm
                ? t('Estimated at {speed} WPM; varies with your speed', {
                    speed: story.estimateWpm,
                  })
                : t('Estimated typing time; varies with your speed')
            }
          >
            ~{story.estimatedMinutes} MIN
          </span>
          {editions.length > 1 && preferredEditions.length > 0 ? (
            <div
              className="story-language-picker"
              role="group"
              aria-label={t('Your languages')}
            >
              <div className="story-language-label">{t('Read in')}</div>
              <div className="story-language-segments">
                {preferredEditions.map((edition) => (
                  <button
                    type="button"
                    key={edition.id}
                    lang={edition.language}
                    aria-pressed={edition.id === story.id}
                    onClick={() => onSelectEdition(edition.id)}
                  >
                    {languageNames[edition.language]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span lang={story.language}>{languageNames[story.language]}</span>
          )}
          {!preferredEditions.some((edition) => edition.id === story.id) &&
            preferredEditions.length > 0 &&
            editions.length > 1 && (
              <span lang={story.language}>{languageNames[story.language]}</span>
            )}
        </div>
        {readingLanguages.length > 0 &&
          !readingLanguages.includes(story.language) && (
            <p className="edition-fallback">
              {editions.some((edition) =>
                readingLanguages.includes(edition.language),
              )
                ? t('Showing {language} for these filters.', {
                    language: languageNames[story.language],
                  })
                : t(
                    'Not yet in your reading languages. Available in {language}.',
                    { language: languageNames[story.language] },
                  )}
            </p>
          )}
        <KeyboardCompatibility text={text} preferences={preferences} />
        <a className="primary" href={`#${story.id}`}>
          {saved?.finished
            ? t('View your results')
            : saved?.started
              ? t('Continue story')
              : t('Explore story')}{' '}
          <span>→</span>
        </a>
        {editions.length > 1 && otherEditions.length > 0 && (
          <div
            className="story-editions"
            role="group"
            aria-label={t('Other available languages')}
          >
            <span>{t('Also in')}</span>
            {otherEditions.map((edition) => (
              <button
                type="button"
                key={edition.id}
                lang={edition.language}
                aria-pressed={edition.id === story.id}
                onClick={() => onSelectEdition(edition.id)}
              >
                {languageNames[edition.language]}
              </button>
            ))}
          </div>
        )}
        {saved?.started && !saved.finished && (
          <span className="saved-progress">
            {t('{progress}% complete · Saved for this visit', {
              progress: savedProgress(saved, text),
            })}
          </span>
        )}
      </div>
    </article>
  );
}
