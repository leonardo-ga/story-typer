# Story Typer

A small, atmospheric typing game built with React, TypeScript, and Vite.

## Play locally

Requires Node.js 18.18+ (Node.js 22+ recommended).

```sh
npm install
npm run dev
```

Open the local address printed by Vite and choose a story from the collection. Type each passage exactly as shown, including punctuation. Completing a paragraph automatically advances to the next; completing the last opens the results. Mistakes can be corrected with backspace. Escape pauses the exercise. There is no time limit.

The reading view uses the available viewport with a wide text column and no headings between paragraphs. Press Enter or Space between paragraphs. Enter only advances at a paragraph break and does not insert extra lines within a paragraph. Mistakes remain red and affect accuracy. Free flow is the default: errors do not block progress and backspace is optional. Correct mistakes mode requires corrections before continuing; Keep moving mode records errors and disables backspace/undo. Uncorrected errors still allow completion in the two nonblocking modes. One continuous input buffer keeps paragraph transitions aligned, with backspace across paragraphs available when the mode permits it. Completed and upcoming paragraphs are dimmed. Use the single Pause/Resume control (or Escape) to pause and scroll manually, then resume at the active line. Automatic scrolling respects reduced-motion preferences, and the view adjusts to the mobile visual viewport when the keyboard opens.

Use **All stories** or the logo to return to the menu. Your current session is paused and can be continued from its story card; refreshing resets progress. Story links and browser back/forward navigation are supported. The browser tab uses an SVG version of the `st_` logo.

## Features

- Four original stories: **The Last Frequency** (coastal mystery), **One Small Garden** (gentle science fiction), **The Oven Inspector** (comic fantasy), and **The Last Repair** (slice of life).
- Compact search, with genre/time/progress/language filters and sorting inside a collapsible Filters panel. Language and keyboard preferences live in the top-right settings popup on both pages. Filters stay selected when returning from a story. Resetting filters does not clear personal preferences.
- **One Small Garden** also has an Italian edition, **Un piccolo giardino**, at `#un-piccolo-giardino`. Language editions share a catalog card, artwork, and effects, with separate text, estimates, routes, and progress. Stories are authored language editions, not translated at runtime; the interface currently remains English.
- Its French edition, **Un petit jardin**, is available at `#un-petit-jardin`, in the language filters, and as a remembered preferred language. Like the Italian edition, it keeps separate progress and supports accented characters and optional character help.
- Separate in-memory progress, statistics, and results for each story, with direct links at `#last-frequency` and `#one-small-garden`.
- Character highlighting, story progress, accuracy, and WPM.
- Pause/resume, always-visible live stats, and final results. Switching away from the tab automatically pauses the story and ambience; resume explicitly when you return.
- Optional locally synthesized radio ambience; no audio files or account required.
- Independent top-bar switches for soft typing clicks and story-specific animations, both off by default. The coastal mystery has rain and radio static; the orbital greenhouse has drifting stardust and a quiet station hum. Animations stay at the edges, freeze while paused, and are disabled by reduced-motion settings. Coastal rain clears for the final morning paragraph.
- Responsive lighthouse illustration made with CSS, with reduced-motion support.
- Each story has its own illustrated cover and ending. The two longer stories have optional oven ambience or a quiet workshop clock, with no background animation where it would distract from the story.

WPM uses accepted visible characters divided by five and active typing time. Time spent paused is excluded. Accuracy counts accepted entries against all entered characters, so corrected mistakes still affect accuracy. Pasting and dropping text are disabled for the exercise. Progress is held in memory and resets on refresh.

## Language and keyboard preferences

The collection also includes **비를 멈추는 버튼 (The Rain Button)**, an original Korean urban fantasy about a bus-stop button that suspends rain and the unexpected condition for starting it again. It has its own city cover, gold accent, and rain ambience. Select 한국어 in the language filter to find it. Hangul requires a Korean input method; Latin-layout compatibility checks warn about this even when character help is enabled. Composition drafts are buffered until committed, so partially formed syllables are not scored as mistakes.

Story cards and the start screen check the story text against the selected English (US), Italian QWERTY, or classic French AZERTY layout. The result distinguishes exact compatibility, compatibility with character help, and characters needing extra input. Broad AZERTY/QWERTZ, unknown, and custom layouts remain unverified. Checks use conservative character inventories (including common modifiers and French accent composition), not a guarantee about the physical keyboard or every OS input method. Missing characters are listed before starting; the check never blocks a story. Character-help checks use the same matching rules as gameplay.

Open the top-right settings icon to choose your story language, keyboard layout, and assisted typing. Changes save immediately, without a Done or Save step. Opening preferences pauses an active attempt; close with Escape, the close button, or the backdrop, then resume explicitly. The preferred story language, error-handling mode, assisted-typing preference, and confirmed keyboard profile are remembered in this browser using local storage. Preferred language selects an edition when available; other stories remain visible with a fallback-language label. The interface language remains English, independently of story language.

Assisted typing is on by default for new attempts. Defined equivalents (for example `a` for `à`, straight/curly quotes, and hyphen/en/em dashes) are accepted in yellow, while exact entries are green. Case and unrelated letters remain strict. Assisted entries count toward accepted accuracy, and results also show assisted-entry totals and exact accuracy. The original story spelling is preserved. Each attempt keeps its error-handling and assistance modes even if preferences change before returning to it. Results identify the attempt mode. Strict mode requires exact characters. Accent buttons appear at accented characters so exact typing remains possible without a dedicated key.

**Settings icon → Keyboard** automatically checks an unset layout when supported, or lets you use the **Detect** button beside the layout dropdown. Detection uses the browser's keyboard-layout API when supported. It proposes a broad layout profile and requires explicit confirmation before saving it; manual selection works when detection is unavailable or uncertain. The profile is advisory and never blocks stories or changes OS keyboard settings. A layout map cannot prove whether shortcuts or an input method can produce a character. Raw layout maps are not stored or sent anywhere. If browser storage is blocked, preferences work for the current visit and the interface explains that they could not be saved.

## Development

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

The production build writes to `docs/`. Assets use relative paths so the output can be hosted under a repository subdirectory. `npm run preview` serves that same build directory. The `docs/` directory is not ignored, so it can be committed for hosting if needed.

Builds are run by the project owner; do not run a build automatically when making changes unless explicitly requested.

## Project structure

- `src/App.tsx` composes the shared header, story library, reader, and background effects. `main.tsx` only starts React.
- `src/stories/` contains typed content files and a central registry in `index.ts`. Each edition has a unique `id`, a shared `storyId`, a `language`, and numeric `estimatedMinutes`. Add an edition implementing `Story`, then register it there; cards, filters, language options, and tests update automatically. Add new language names to `src/library.ts` and the `Language` type when introducing another language. Estimates describe typing time and vary with the player's speed.
- `src/components/` contains the header, library, cover art, reader, controls, results, and backdrop.
- `src/hooks/` separates gameplay and sessions, audio lifecycle, and viewport/automatic scrolling.
- `src/audio/` contains the local audio synthesizers.
- `src/styles/` separates shared design tokens and header rules from library, reader, cover art, and effects styles. Both pages use the same header height and responsive breakpoints.
- `src/typing.mjs` and `src/metrics.mjs` hold the input and scoring logic independently of React.

Run `npm run format` for consistent source formatting. Google Fonts are optional: system fonts are used when unavailable. No backend or external assets are required.

The tests include Unicode scoring, composition-input handling, focus restoration, tooltip dismissal, automatic pausing, cross-story sessions, and completion checks for every story in the registry. DOM interaction tests do not replace testing real mobile keyboards or platform IMEs in a browser.
