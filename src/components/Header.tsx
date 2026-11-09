import type { StoryGame } from '../hooks/useStoryGame';
import { EffectToggle } from './EffectToggle';
import { SettingsIcon } from './SettingsIcon';
import type { RefObject } from 'react';

export function Header({
  game,
  onOpenPreferences,
  preferencesOpen,
  preferencesButton,
}: {
  game: StoryGame;
  onOpenPreferences: () => void;
  preferencesOpen: boolean;
  preferencesButton: RefObject<HTMLButtonElement>;
}) {
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
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Story Typer home">
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
            aria-label="Story effects"
          >
            <EffectToggle
              label="Typing sounds"
              icon="keyboard"
              active={typingSound}
              onToggle={toggleTypingSound}
            />
            {selected.effect && (
              <EffectToggle
                label={`${selected.effect} animation`}
                icon={selected.theme === 'orbit' ? 'stars' : 'rain'}
                active={rain}
                onToggle={() => {
                  setRain(!rain);
                  focusTyping();
                }}
              />
            )}
            <EffectToggle
              label="Ambient sound"
              icon="sound"
              active={sound}
              onToggle={() => {
                setSound(!sound);
                focusTyping();
              }}
            />
          </div>
        ) : (
          <span className="library-label">STORIES AT YOUR FINGERTIPS</span>
        )}
        <button
          ref={preferencesButton}
          type="button"
          className="effect-toggle settings-trigger"
          aria-label="Preferences"
          aria-haspopup="dialog"
          aria-expanded={preferencesOpen}
          onClick={onOpenPreferences}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
}
