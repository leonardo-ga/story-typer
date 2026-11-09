import { useStoryGame } from './hooks/useStoryGame';
import { Header } from './components/Header';
import { StoryLibrary } from './components/StoryLibrary';
import { StoryReader } from './components/StoryReader';
import { StoryBackdrop } from './components/StoryBackdrop';
import { useMemo, useRef, useState } from 'react';
import { stories } from './stories';
import { createStoryCatalog } from './stories/catalog';
import { defaultFilters } from './library';
import { usePreferences } from './hooks/usePreferences';
import { PreferencesDialog } from './components/PreferencesDialog';
import { I18nProvider } from './i18n/I18nProvider';
import { usePreferencesSuggestion } from './hooks/usePreferencesSuggestion';
import { PreferencesSuggestion } from './components/PreferencesSuggestion';

export function App() {
  const preferences = usePreferences();
  return (
    <I18nProvider language={preferences.preferences.siteLanguage}>
      <AppContent settings={preferences} />
    </I18nProvider>
  );
}

function AppContent({
  settings: preferences,
}: {
  settings: ReturnType<typeof usePreferences>;
}) {
  const catalog = useMemo(() => createStoryCatalog(stories), []);
  const game = useStoryGame({
    catalog,
    defaultAssistance: preferences.preferences.assistance,
    defaultErrorMode: preferences.preferences.errorMode,
  });
  const [filters, setFilters] = useState({
    ...defaultFilters,
    language: 'preferred',
  });
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const preferencesButton = useRef<HTMLButtonElement>(null);
  const suggestion = usePreferencesSuggestion(
    preferences.preferencesConfigured,
    !preferencesOpen && (!game.inStory || !game.started),
  );
  function openPreferences() {
    suggestion.dismiss();
    if (game.inStory && game.started && !game.paused && !game.finished)
      game.togglePause();
    setPreferencesOpen(true);
  }
  function closeSuggestion(permanent: boolean) {
    if (permanent) suggestion.dismiss();
    else suggestion.postpone();
    preferencesButton.current?.focus({ preventScroll: true });
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
        preferencesSuggestion={
          suggestion.visible ? (
            <PreferencesSuggestion
              onOpen={openPreferences}
              onDismiss={() => closeSuggestion(true)}
              onLater={() => closeSuggestion(false)}
            />
          ) : undefined
        }
      />
      <main>
        {game.inStory ? (
          <StoryReader game={game} preferences={preferences.preferences} />
        ) : (
          <StoryLibrary
            catalog={catalog}
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
