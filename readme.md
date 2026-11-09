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
- **One Small Garden** also has an Italian edition, **Un piccolo giardino**, at `#un-piccolo-giardino`. Language editions share a catalog card, artwork, and effects, with separate text, estimates, routes, and progress. Stories are authored language editions, not translated at runtime. The site interface has its own independent language setting.
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

For a new visitor, the site language follows the browser's primary language when a site translation exists, otherwise English. Reading languages start with that language when supported, plus English without duplicates. Regional tags such as `it-IT` use their base language. The keyboard stays unset. These defaults are not saved automatically; explicit saved choices always take priority, including an empty reading-language selection. The browser language is the available proxy for system language and may differ from the operating system's setting.

Visitors with no saved preferences receive a small suggestion below the top-right Preferences button after four seconds on the library or a story's start screen. On the home page, the header hides after 24 pixels of downward movement and reveals after 12 pixels upward, remaining visible near the top. A 200 ms slide respects reduced-motion preferences. Suggestions, an open Preferences dialog, and focused header controls keep it visible; story-page headers stay steady. The suggestion uses the shared dark surface and theme accent, with a small pointer linking it to the settings control. It links to Preferences without moving focus or opening a modal automatically. The main Preferences action and the close button (labeled Don’t show again) stop future reminders in this browser. Not now, or Escape, snoozes the suggestion for the current tab session, including refreshes; a new session may show it again. Permanent dismissal uses localStorage; temporary snoozing uses sessionStorage. Active typing attempts never show the suggestion; when storage is unavailable, dismissal lasts for the current visit.

The collection also includes **비를 멈추는 버튼 (The Rain Button)**, an original Korean urban fantasy about a bus-stop button that suspends rain and the unexpected condition for starting it again. It has its own city cover, gold accent, and rain ambience. Select 한국어 in the language filter to find it. Hangul requires a Korean input method; Latin-layout compatibility checks warn about this even when character help is enabled. Composition drafts are buffered until committed, so partially formed syllables are not scored as mistakes.

Story cards and the start screen check the story text against the selected English (US), Italian QWERTY, or classic French AZERTY layout. The result distinguishes exact compatibility, compatibility with character help, and characters needing extra input. Broad AZERTY/QWERTZ, unknown, and custom layouts remain unverified. Checks use conservative character inventories (including common modifiers and French accent composition), not a guarantee about the physical keyboard or every OS input method. Missing characters are listed before starting; the check never blocks a story. Character-help checks use the same matching rules as gameplay.

Open the top-right settings icon to choose **Site language** (English or Italian) and any number of **Reading languages** (English, Italian, French, Korean). For example, use the interface in English and select English and Italian for reading. Both preferences save independently in this browser. The site language updates navigation, filters, controls, tooltips, accessibility labels, and the document language without translating story prose or resetting an attempt. Existing single-language preferences migrate to the reading-language list.

Reading languages use a compact, searchable multi-select with a selected-language summary, count, and Clear selection action. Its dropdown has a bounded, scrollable list so adding languages does not expand the preferences modal. Escape closes the dropdown before the modal. Clearing the selection means no reading preference.

Site language, keyboard layout, error handling, and library filters use the same dropdown design in single-selection mode. Choosing a row closes the menu and restores focus. Arrow keys, Home/End, typeahead, and Escape are supported; lists with more than eight choices include search. `SelectMenu` owns shared positioning and interaction, with small `SingleSelect` and `MultiSelect` wrappers.

Reading languages favor available editions while keeping one card per story. An unfinished edition in a selected language takes precedence; otherwise the first matching edition in collection order is shown. Edition links still offer every translation, explicit language filters take precedence, and stories outside the preferences remain visible. Site language never changes this selection.

Changes save immediately, without a Done or Save step. Opening preferences pauses an active attempt; close with Escape, the close button, or the backdrop, then resume explicitly. The site and reading languages, error-handling mode, assisted-typing preference, and confirmed keyboard profile are remembered in local storage.

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
- `src/stories/` contains typed content files and a central registry in `index.ts`. `catalog.ts` indexes routes and language editions, derives filter options, and rejects duplicate registrations. `text.ts` caches normalized text and grapheme segmentation for the reader and cards. See [the story authoring guide](CONTRIBUTING.md) for adding stories and translations.
- `src/languages.ts` is the single source of language names and the `Language` type. Adding an entry updates preference validation and language selectors.
- `src/i18n/` contains the typed site-message catalog and React translation context. Site languages are independent of story languages. Interpolation uses plain text, and story text is never passed through interface translation.
- `src/stories/themes.ts` defines animation behavior and ambience settings. Themes are reusable across stories; the `Theme` type is derived from this registry.
- `src/components/` separates library layout, individual story cards, keyboard preferences, reader, controls, and results. `covers/` contains independent artwork components with an exhaustive theme-to-cover registry; `StoryCover` supplies the shared frame and caption.
- `src/hooks/` separates gameplay and sessions, active-time tracking, audio lifecycle, and viewport/automatic scrolling.
- `src/audio/` contains the local audio synthesizers.
- `src/styles/` separates shared design tokens and header rules from library, reader, cover art, and effects styles. Both pages use the same header height and responsive breakpoints.
- `src/typing.mjs` and `src/metrics.mjs` hold the input and scoring logic independently of React.

Run `npm run format` for consistent source formatting. Google Fonts are optional: system fonts are used when unavailable. No backend or external assets are required.

The tests include Unicode scoring, composition-input handling, focus restoration, tooltip dismissal, automatic pausing, cross-story sessions, and completion checks for every story in the registry. DOM interaction tests do not replace testing real mobile keyboards or platform IMEs in a browser.
