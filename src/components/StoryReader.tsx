import { moveCaretToEnd } from '../typing.mjs';
import { KeyboardCompatibility } from './KeyboardCompatibility';
import type { StoryGame } from '../hooks/useStoryGame';
import { StoryResults } from './StoryResults';
import { ReaderControls } from './ReaderControls';
import { useCompositionInput } from '../hooks/useCompositionInput';
import { matchCharacter } from '../typing.mjs';
import type { Preferences } from '../preferences';

export function StoryReader({
  game,
  preferences,
}: {
  game: StoryGame;
  preferences: Preferences;
}) {
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
    typedCharacters,
    cursorPosition,
    errorMode,
    storyText,
    change,
    mistake,
    expectedCharacter,
    assistance,
    progress,
    setStarted,
    setPaused,
  } = game;
  const specialCharacters = [
    ...new Set(
      paragraphs
        .flatMap((part) => part.characters.map((character) => character.char))
        .filter((char) => /\p{M}/u.test(char.normalize('NFD'))),
    ),
  ];
  const compositionInput = useCompositionInput(
    value,
    change,
    paused,
    selected.id,
    errorMode === 'forward',
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
                      <p
                        className="passage"
                        lang={selected.language}
                        aria-hidden="true"
                      >
                        {part.characters.map(({ char, start }, index) => {
                          const position = part.start + start;
                          const typed =
                            typedCharacters[part.characterStart + index];
                          return (
                            <span
                              key={start}
                              className={`${typed ? matchCharacter(typed.char, char, assistance) : 'pending'} ${position === cursorPosition ? 'cursor' : ''}`}
                            >
                              {char}
                            </span>
                          );
                        })}
                        {index === paragraphs.length - 1 &&
                          cursorPosition >= storyText.length && (
                            <>
                              <span className="cursor"> </span>
                            </>
                          )}
                      </p>
                    </section>
                  ))}
                </div>
                <textarea
                  lang={selected.language}
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
                <p
                  id="passage-description"
                  className="sr-only"
                  lang={selected.language}
                >
                  {storyText}
                </p>
                {!started && (
                  <div className="overlay">
                    <span className="small-icon">⌨</span>
                    <h3>Every word brings you closer.</h3>
                    <p>
                      {errorMode === 'correct'
                        ? 'Correct mistakes to continue.'
                        : errorMode === 'forward'
                          ? 'Keep typing. Corrections are disabled.'
                          : 'Keep typing. Correct mistakes whenever you like.'}{' '}
                      Paragraphs flow automatically.
                    </p>
                    {specialCharacters.length > 0 && (
                      <p className="special-characters">
                        This story uses{' '}
                        <strong>{specialCharacters.join(' ')}</strong>.{' '}
                        {assistance
                          ? 'Matching base letters are accepted in yellow.'
                          : 'Exact accents are required; accent buttons appear when needed.'}
                      </p>
                    )}
                    <KeyboardCompatibility
                      text={storyText}
                      preferences={{
                        keyboard: preferences.keyboard,
                        assistance,
                      }}
                      detailed
                    />
                    <p className="match-legend">
                      <span>Green: exact</span>
                      <span>Yellow: assisted</span>
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
              {started &&
                (paused || (errorMode === 'correct' && mistake >= 0)) && (
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
