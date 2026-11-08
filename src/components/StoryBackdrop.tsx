import type { CSSProperties } from 'react';
import type { StoryGame } from '../hooks/useStoryGame';

export function StoryBackdrop({ game }: { game: StoryGame }) {
  const { inStory, rain, finished, selected, scene, paused } = game;
  return (
    inStory &&
    selected.effect &&
    rain &&
    !finished &&
    (selected.theme === 'orbit' || scene < selected.paragraphs.length - 1) && (
      <div
        className={`rain-background ${selected.theme === 'orbit' ? 'star-background' : ''} ${paused ? 'rain-paused' : ''}`}
        aria-hidden="true"
      >
        {Array.from({ length: 28 }, (_, index) => (
          <i
            key={index}
            style={
              {
                '--x': `${(index * 37) % 100}%`,
                '--delay': `${-(index % 11) * 0.43}s`,
                '--duration': `${1.4 + (index % 5) * 0.27}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    )
  );
}
