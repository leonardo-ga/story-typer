import { useStoryGame } from './hooks/useStoryGame';
import { Header } from './components/Header';
import { StoryLibrary } from './components/StoryLibrary';
import { StoryReader } from './components/StoryReader';
import { StoryBackdrop } from './components/StoryBackdrop';
import { useRef, useState } from 'react';
import { defaultFilters } from './library';
import { usePreferences } from './hooks/usePreferences';
import { PreferencesDialog } from './components/PreferencesDialog';

export function App() {
  const preferences = usePreferences();
  const game = useStoryGame(
    preferences.preferences.assistance,
    preferences.preferences.errorMode,
  );
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const preferencesButton = useRef<HTMLButtonElement>(null);
  function openPreferences() {
    if (game.inStory && game.started && !game.paused && !game.finished)
      game.togglePause();
    setPreferencesOpen(true);
  }
  return (
    <div
      className={
        game.inStory ? `app story-mode theme-${game.selected.theme}` : 'app'
      }
    >
      <StoryBackdrop game={game} />
      <Header
        game={game}
        onOpenPreferences={openPreferences}
        preferencesOpen={preferencesOpen}
        preferencesButton={preferencesButton}
      />
      <main>
        {game.inStory ? (
          <StoryReader game={game} preferences={preferences.preferences} />
        ) : (
          <StoryLibrary
            sessions={game.sessions.current}
            filters={filters}
            onFiltersChange={setFilters}
            preferences={preferences.preferences}
          />
        )}
      </main>
      {preferencesOpen && (
        <PreferencesDialog
          {...preferences}
          onClose={() => setPreferencesOpen(false)}
          returnFocus={preferencesButton}
        />
      )}
    </div>
  );
}
