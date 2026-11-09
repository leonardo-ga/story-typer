import { accuracy } from '../metrics.mjs';
import type { StoryGame } from '../hooks/useStoryGame';
import { errorModeNames } from '../preferences';

export function StoryResults({ game }: { game: StoryGame }) {
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
      <span className="eyebrow">STORY COMPLETE</span>
      <h2>{selected.ending}</h2>
      <p>{selected.epilogue}</p>
      <div className="result-stats">
        <div>
          <strong>{wpm}</strong>
          <span>WORDS / MIN</span>
        </div>
        <div>
          <strong>{accuracy(correct + assisted, attempts)}%</strong>
          <span>ACCURACY</span>
        </div>
        <div>
          <strong>
            {Math.floor(elapsed / 60000)}:
            {String(Math.floor(elapsed / 1000) % 60).padStart(2, '0')}
          </strong>
          <span>ACTIVE TIME</span>
        </div>
      </div>
      {assistance && (
        <p className="results-assistance">
          Assisted mode · {assisted} assisted entries ·{' '}
          {accuracy(correct, attempts)}% exact accuracy
        </p>
      )}
      <p className="results-mode">{errorModeNames[errorMode]}</p>
      <button className="primary" onClick={restart}>
        Read it again ↺
      </button>
    </div>
  );
}
