import { moveCaretToEnd } from '../typing.mjs';
import type { StoryGame } from '../hooks/useStoryGame';
import { StoryResults } from './StoryResults';
import { ReaderControls } from './ReaderControls';
import { useCompositionInput } from '../hooks/useCompositionInput';

export function StoryReader({ game }: { game: StoryGame }) {
  const {
    selected,
    finished,
    reader,
    paused,
    started,
    input,
    paragraphs,
    scene,
    activeParagraph,
    value,
    storyText,
    change,
    mistake,
    expectedCharacter,
    progress,
    setStarted,
    setPaused,
  } = game;
  const compositionInput = useCompositionInput(
    value,
    change,
    paused,
    selected.id,
  );
  return (
    <>
      <nav className="story-nav" aria-label="Story navigation">
        <a href="#">← All stories</a>
        <span>{selected.title}</span>
      </nav>
      <div className="game-layout">
        <section className="console" aria-label="Typing exercise">
          {finished ? (
            <StoryResults game={game} />
          ) : (
            <>
              <div className="reader-shell">
                <div
                  ref={reader}
                  className={`story-stream ${paused || !started ? 'stream-paused' : ''}`}
                  tabIndex={paused ? 0 : -1}
                  aria-label="Story paragraphs"
                  onClick={() => {
                    if (!paused) {
                      input.current?.focus({ preventScroll: true });
                      if (input.current) moveCaretToEnd(input.current);
                    }
                  }}
                >
                  {paragraphs.map((part, index) => (
                    <section
                      key={part.title}
                      ref={index === scene ? activeParagraph : undefined}
                      className={`stream-paragraph ${index === scene ? 'current-paragraph' : index < scene ? 'past-paragraph' : 'future-paragraph'}`}
                      aria-current={index === scene ? 'step' : undefined}
                      aria-label={`Paragraph ${index + 1}`}
                    >
                      <p className="passage" aria-hidden="true">
                        {part.characters.map(({ char, start }) => {
                          const position = part.start + start;
                          return (
                            <span
                              key={start}
                              className={`${position < value.length ? (value.slice(position, position + char.length) === char ? 'correct' : 'incorrect') : 'pending'} ${position === value.length ? 'cursor' : ''}`}
                            >
                              {char}
                            </span>
                          );
                        })}
                        {index === paragraphs.length - 1 &&
                          value.length >= storyText.length && (
                            <>
                              <span className="incorrect">
                                {value.slice(storyText.length)}
                              </span>
                              <span className="cursor"> </span>
                            </>
                          )}
                      </p>
                    </section>
                  ))}
                </div>
                <textarea
                  readOnly={!started || paused}
                  tabIndex={started && !paused ? 0 : -1}
                  className="reader-input"
                  ref={input}
                  aria-label="Type the story passage"
                  aria-describedby="passage-description"
                  {...compositionInput}
                  onFocus={(e) => moveCaretToEnd(e.currentTarget)}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <p id="passage-description" className="sr-only">
                  {storyText}
                </p>
                {!started && (
                  <div className="overlay">
                    <span className="small-icon">⌨</span>
                    <h3>Every word brings you closer.</h3>
                    <p>
                      Type to follow the story. Paragraphs flow automatically.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        if (input.current) {
                          input.current.readOnly = false;
                          input.current.focus({ preventScroll: true });
                        }
                        setStarted(true);
                        setPaused(false);
                      }}
                    >
                      Begin the story →
                    </button>
                  </div>
                )}
              </div>
              {started && (paused || mistake >= 0) && (
                <div
                  className={`reader-status ${mistake >= 0 ? 'has-error' : ''}`}
                  role="status"
                >
                  {paused
                    ? 'Paused — scroll to look around, then resume.'
                    : `Use backspace to correct the highlighted character. Expected ${expectedCharacter === ' ' ? 'a space' : '“' + expectedCharacter + '”'}.`}
                </div>
              )}
            </>
          )}
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Story progress"
            aria-valuenow={finished ? 100 : progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${finished ? 100 : progress}%` }} />
          </div>
        </section>
      </div>
      {!finished && <ReaderControls game={game} />}
    </>
  );
}
