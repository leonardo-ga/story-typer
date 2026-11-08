import { useStoryGame } from './hooks/useStoryGame';
import { Header } from './components/Header';
import { StoryLibrary } from './components/StoryLibrary';
import { StoryReader } from './components/StoryReader';
import { StoryBackdrop } from './components/StoryBackdrop';

export function App() {
  const game = useStoryGame();
  return (
    <div
      className={
        game.inStory ? `app story-mode theme-${game.selected.theme}` : 'app'
      }
    >
      <StoryBackdrop game={game} />
      <Header game={game} />
      <main>
        {game.inStory ? (
          <StoryReader game={game} />
        ) : (
          <StoryLibrary sessions={game.sessions.current} />
        )}
      </main>
    </div>
  );
}
