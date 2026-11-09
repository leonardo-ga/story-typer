import { useI18n } from '../i18n/I18nProvider';
import { getStoryText } from '../stories/text';
import { moveCaretToEnd } from '../typing.mjs';
import { KeyboardCompatibility } from './KeyboardCompatibility';
import type { StoryGame } from '../hooks/useStoryGame';
import { StoryResults } from './StoryResults';
import { ReaderControls } from './ReaderControls';
import { useCompositionInput } from '../hooks/useCompositionInput';
import { StoryParagraph } from './StoryParagraph';
import type { Preferences } from '../preferences';

export function StoryReader({
  game,
  preferences,
}: {
  game: StoryGame;
  preferences: Preferences;
}) {
  const { t } = useI18n();
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
  const { specialCharacters } = getStoryText(selected);
  const compositionInput = useCompositionInput(
    value,
    change,
    paused,
    selected.id,
    errorMode === 'forward',
  );
  return (
    <>
      <nav className="story-nav" aria-label={t('Story navigation')}>
        <a href="#">{t('← All stories')}</a>
        <span lang={selected.language}>{selected.title}</span>
      </nav>
      <div className="game-layout">
        <section className="console" aria-label={t('Typing exercise')}>
          {finished ? (
            <StoryResults game={game} />
          ) : (
            <>
              <div className="reader-shell">
                <div
                  ref={reader}
                  className={`story-stream ${paused || !started ? 'stream-paused' : ''}`}
                  tabIndex={paused ? 0 : -1}
                  aria-label={t('Story paragraphs')}
                  onClick={() => {
                    if (!paused) {
                      input.current?.focus({ preventScroll: true });
                      if (input.current) moveCaretToEnd(input.current);
                    }
                  }}
                >
                  {paragraphs.map((part, index) => {
                    const first = typedCharacters[part.characterStart];
                    const last =
                      typedCharacters[
                        Math.min(part.characterEnd, typedCharacters.length) - 1
                      ];
                    const typedText =
                      first && last ? value.slice(first.start, last.end) : '';
                    const cursor =
                      cursorPosition >= part.start &&
                      (cursorPosition < part.end ||
                        index === paragraphs.length - 1)
                        ? cursorPosition - part.start
                        : -1;
                    return (
                      <StoryParagraph
                        key={part.title}
                        part={part}
                        typedText={typedText}
                        cursor={cursor}
                        current={index === scene}
                        past={index < scene}
                        final={index === paragraphs.length - 1}
                        language={selected.language}
                        assistance={assistance}
                        label={t('Paragraph {count}', { count: index + 1 })}
                        activeRef={
                          index === scene ? activeParagraph : undefined
                        }
                      />
                    );
                  })}
                </div>
                <textarea
                  lang={selected.language}
                  readOnly={!started || paused}
                  tabIndex={started && !paused ? 0 : -1}
                  className="reader-input"
                  ref={input}
                  aria-label={t('Type the story passage')}
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
                    <h3>{t('Every word brings you closer.')}</h3>
                    <p>
                      {errorMode === 'correct'
                        ? t('Correct mistakes to continue.')
                        : errorMode === 'forward'
                          ? t('Keep typing. Corrections are disabled.')
                          : t(
                              'Keep typing. Correct mistakes whenever you like.',
                            )}{' '}
                      {t('Paragraphs flow automatically.')}
                    </p>
                    {specialCharacters.length > 0 && (
                      <p className="special-characters">
                        {t('This story uses')}{' '}
                        <strong>{specialCharacters.join(' ')}</strong>.{' '}
                        {assistance
                          ? t('Matching base letters are accepted in yellow.')
                          : t(
                              'Exact accents are required; accent buttons appear when needed.',
                            )}
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
                      <span>{t('Green: exact')}</span>
                      <span>{t('Yellow: assisted')}</span>
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
                      {t('Begin the story →')}
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
                      ? t('Paused — scroll to look around, then resume.')
                      : t(
                          'Use backspace to correct the highlighted character. Expected {character}.',
                          {
                            character:
                              expectedCharacter === ' '
                                ? t('a space')
                                : '“' + expectedCharacter + '”',
                          },
                        )}
                  </div>
                )}
            </>
          )}
          <div
            className="progress-track"
            role="progressbar"
            aria-label={t('Story progress')}
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
