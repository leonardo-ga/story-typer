# Story Typer

A small, atmospheric typing game built with React, TypeScript, and Vite.

## Play locally

Requires Node.js 18.18+ (Node.js 22+ recommended).

```sh
npm install
npm run dev
```

Open the local address printed by Vite and choose a story from the collection. Type each passage exactly as shown, including punctuation. Completing a paragraph automatically advances to the next; completing the last opens the results. Mistakes can be corrected with backspace. Escape pauses the exercise. There is no time limit.

The reading view uses the available viewport with a wide text column and no headings between paragraphs. Press Enter or Space between paragraphs. Enter only advances at a paragraph break and does not insert extra lines within a paragraph. A mistake is highlighted and blocks further typing until corrected with backspace, with a hint showing the expected character. One continuous input buffer lets you backspace across paragraph boundaries without losing text. Completed and upcoming paragraphs are dimmed. Use the single Pause/Resume control (or Escape) to pause and scroll manually, then resume at the active line. Automatic scrolling respects reduced-motion preferences, and the view adjusts to the mobile visual viewport when the keyboard opens.

Use **All stories** or the logo to return to the menu. Your current session is paused and can be continued from its story card; refreshing resets progress. Story links and browser back/forward navigation are supported. The browser tab uses an SVG version of the `st_` logo.

## Features

- Four original stories: **The Last Frequency** (coastal mystery), **One Small Garden** (gentle science fiction), **The Oven Inspector** (comic fantasy), and **The Last Repair** (slice of life).
- Separate in-memory progress, statistics, and results for each story, with direct links at `#last-frequency` and `#one-small-garden`.
- Character highlighting, story progress, accuracy, and WPM.
- Pause/resume, always-visible live stats, and final results. Switching away from the tab automatically pauses the story and ambience; resume explicitly when you return.
- Optional locally synthesized radio ambience; no audio files or account required.
- Independent top-bar switches for soft typing clicks and story-specific animations, both off by default. The coastal mystery has rain and radio static; the orbital greenhouse has drifting stardust and a quiet station hum. Animations stay at the edges, freeze while paused, and are disabled by reduced-motion settings. Coastal rain clears for the final morning paragraph.
- Responsive lighthouse illustration made with CSS, with reduced-motion support.
- Each story has its own illustrated cover and ending. The two longer stories have optional oven ambience or a quiet workshop clock, with no background animation where it would distract from the story.

WPM uses correctly transcribed characters divided by five and active typing time. Time spent paused is excluded. Accuracy counts correct entries against all entered characters, so corrected mistakes still affect accuracy. Pasting and dropping text are disabled for the exercise. Progress is held in memory and resets on refresh.

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
- `src/stories/` contains one typed content file per story and a central registry in `index.ts`. Add a story file implementing `Story`, then register it there; cards and collection counts update automatically.
- `src/components/` contains the header, library, cover art, reader, controls, results, and backdrop.
- `src/hooks/` separates gameplay and sessions, audio lifecycle, and viewport/automatic scrolling.
- `src/audio/` contains the local audio synthesizers.
- `src/styles/` separates shared design tokens and header rules from library, reader, cover art, and effects styles. Both pages use the same header height and responsive breakpoints.
- `src/typing.mjs` and `src/metrics.mjs` hold the input and scoring logic independently of React.

Run `npm run format` for consistent source formatting. Google Fonts are optional: system fonts are used when unavailable. No backend or external assets are required.

The tests include Unicode scoring, composition-input handling, focus restoration, tooltip dismissal, automatic pausing, cross-story sessions, and completion checks for every story in the registry. DOM interaction tests do not replace testing real mobile keyboards or platform IMEs in a browser.
