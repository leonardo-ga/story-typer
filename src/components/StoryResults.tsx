import { useI18n } from '../i18n/I18nProvider';
import { accuracy } from '../metrics.mjs';
import type { StoryGame } from '../hooks/useStoryGame';
import { errorModeNames } from '../preferences';

export function StoryResults({ game }: { game: StoryGame }) {
  const { t, text } = useI18n();
  const {
    selected,
    wpm,
    correct,
    assisted,
    assistance,
    errorMode,
    attempts,
    elapsed,
    restart,
  } = game;
  return (
    <div className="results">
      <span className="eyebrow">{t('STORY COMPLETE')}</span>
      <h2 lang={selected.language}>{selected.ending}</h2>
      <p lang={selected.language}>{selected.epilogue}</p>
      <div className="result-stats">
        <div>
          <strong>{wpm}</strong>
          <span>{t('WORDS / MIN')}</span>
        </div>
        <div>
          <strong>{accuracy(correct + assisted, attempts)}%</strong>
          <span>{t('ACCURACY')}</span>
        </div>
        <div>
          <strong>
            {Math.floor(elapsed / 60000)}:
            {String(Math.floor(elapsed / 1000) % 60).padStart(2, '0')}
          </strong>
          <span>{t('ACTIVE TIME')}</span>
        </div>
      </div>
      {assistance && (
        <p className="results-assistance">
          {t(
            'Assisted mode · {count} assisted entries · {accuracy}% exact accuracy',
            { count: assisted, accuracy: accuracy(correct, attempts) },
          )}
        </p>
      )}
      <p className="results-mode">{text(errorModeNames[errorMode])}</p>
      <button className="primary" onClick={restart}>
        {t('Read it again ↺')}
      </button>
    </div>
  );
}
