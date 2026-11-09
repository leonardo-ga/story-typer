import { useI18n } from '../i18n/I18nProvider';
import type { StoryGame } from '../hooks/useStoryGame';
import { EffectToggle } from './EffectToggle';
import { SettingsIcon } from './SettingsIcon';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { getTheme } from '../stories/themes';
import { useScrollHeader } from '../hooks/useScrollHeader';

export function Header({
  game,
  onOpenPreferences,
  preferencesOpen,
  preferencesButton,
  preferencesSuggestion,
}: {
  game: StoryGame;
  onOpenPreferences: () => void;
  preferencesOpen: boolean;
  preferencesButton: RefObject<HTMLButtonElement>;
  preferencesSuggestion?: ReactNode;
}) {
  const { t } = useI18n();
  const {
    inStory,
    selected,
    typingSound,
    toggleTypingSound,
    rain,
    setRain,
    sound,
    setSound,
    focusTyping,
  } = game;
  const { animation } = getTheme(selected.theme);
  const [focused, setFocused] = useState(false);
  const header = useRef<HTMLElement>(null);
  const keyboardInput = useRef(false);
  useEffect(() => {
    const keyboard = () => {
      keyboardInput.current = true;
      setFocused(header.current?.contains(document.activeElement) ?? false);
    };
    const pointer = () => {
      keyboardInput.current = false;
      setFocused(false);
    };
    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('pointerdown', pointer, true);
    window.addEventListener('wheel', pointer, { passive: true });
    window.addEventListener('touchmove', pointer, { passive: true });
    return () => {
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('wheel', pointer);
      window.removeEventListener('touchmove', pointer);
    };
  }, []);
  const hidden = useScrollHeader(
    !inStory,
    preferencesOpen || !!preferencesSuggestion || focused,
  );
  return (
    <header
      ref={header}
      className={`site-header ${!inStory ? 'site-header--reveal' : ''}`}
      data-hidden={hidden}
      onFocusCapture={() => setFocused(keyboardInput.current)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
    >
      <a className="brand" href="#" aria-label={t('Story Typer home')}>
        <span className="brand-icon">
          st<span>_</span>
        </span>
        <span className="brand-name">story typer</span>
      </a>
      <div className="header-actions">
        {inStory ? (
          <div
            className="experience-controls"
            role="group"
            aria-label={t('Story effects')}
          >
            <EffectToggle
              label={t('Typing sounds')}
              icon="keyboard"
              active={typingSound}
              onToggle={toggleTypingSound}
            />
            {animation && (
              <EffectToggle
                label={
                  animation.kind === 'rain'
                    ? t('Rain animation')
                    : t('Stardust animation')
                }
                icon={animation.kind}
                active={rain}
                onToggle={() => {
                  setRain(!rain);
                  focusTyping();
                }}
              />
            )}
            <EffectToggle
              label={t('Ambient sound')}
              icon="sound"
              active={sound}
              onToggle={() => {
                setSound(!sound);
                focusTyping();
              }}
            />
          </div>
        ) : (
          <span className="library-label">
            {t('STORIES AT YOUR FINGERTIPS')}
          </span>
        )}
        <div className="preferences-anchor">
          <button
            ref={preferencesButton}
            type="button"
            className="effect-toggle settings-trigger"
            aria-label={t('Preferences')}
            aria-haspopup="dialog"
            aria-expanded={preferencesOpen}
            onClick={onOpenPreferences}
          >
            <SettingsIcon />
          </button>
          {preferencesSuggestion}
        </div>
      </div>
    </header>
  );
}
