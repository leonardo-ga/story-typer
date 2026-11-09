import { accuracy } from '../metrics.mjs';
import type { StoryGame } from '../hooks/useStoryGame';

export function ReaderControls({ game }: { game: StoryGame }) {
  const {
    wpm,
    correct,
    assisted,
    nextCharacter,
    mistake,
    change,
    value,
    focusTyping,
    attempts,
    progress,
    started,
    togglePause,
    paused,
  } = game;
  return (
    <div className="stats-bar">
      <div className="stat">
        <strong>{wpm}</strong>
        <span>WORDS / MIN</span>
      </div>
      <div className="stat">
        <strong>{accuracy(correct + assisted, attempts)}%</strong>
        <span>ACCURACY</span>
      </div>
      <span className="compact-progress">{progress}% read</span>
      {assisted > 0 && (
        <span className="assisted-count">{assisted} assisted</span>
      )}
      {started &&
        !paused &&
        (game.errorMode !== 'correct' || mistake < 0) &&
        /\p{M}/u.test(nextCharacter.normalize('NFD')) && (
          <button
            className="insert-character"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              change(value + nextCharacter);
              focusTyping();
            }}
            aria-label={`Insert ${nextCharacter}`}
          >
            {nextCharacter}
          </button>
        )}
      {started && (
        <button
          className="pause-control"
          onClick={togglePause}
          aria-pressed={paused}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            {paused ? (
              <path d="m9 5 10 7-10 7V5Z" />
            ) : (
              <path d="M9 5v14M15 5v14" />
            )}
          </svg>
          {paused ? 'Resume' : 'Pause'}
        </button>
      )}
    </div>
  );
}
