import type { StoryGame } from '../hooks/useStoryGame';
import { EffectToggle } from './EffectToggle';

export function Header({ game }: { game: StoryGame }) {
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
    </header>
  );
}
