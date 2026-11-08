import { accuracy } from '../metrics.mjs';
import type { StoryGame } from '../hooks/useStoryGame';

export function StoryResults({ game }: { game: StoryGame }) {
  const { selected, wpm, correct, attempts, elapsed, restart } = game;
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
          <strong>{accuracy(correct, attempts)}%</strong>
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
      <button className="primary" onClick={restart}>
        Read it again ↺
      </button>
    </div>
  );
}
