# Adding stories

Each language edition is a content file under `src/stories/`. Adding a story with an existing theme requires no changes to gameplay or UI components.

1. Create a file such as `src/stories/the-example.ts`. Export an object ending with `satisfies Story` (import `Story` from `./types`). Follow an existing story for the required metadata and paragraph structure.
2. Give the edition a unique, URL-safe `id`, such as `the-example-en`. Use the same `storyId` for all translations of that story. A family may have one edition per language.
3. Set its language, title, description, caption, setting, ending, epilogue, genre, estimated typing minutes, and paragraphs. Choose an existing theme from `themes.ts`. Paragraph titles and times are metadata; only `text` is typed.
4. Import the edition in `src/stories/index.ts` and add it to `stories`. Registry order determines collection order. The library derives genre/language options and edition links automatically.
5. Run `npm test` and `npm run typecheck`. Tests cover registration, presentation metadata, and completion for every registered story. The project owner runs the production build separately.

Write ordinary Unicode text. Paragraphs are normalized to NFC, segmented into visible characters, and joined with one space. Do not add a newline or trailing separator to paragraph text. Quotes, accents, and punctuation are part of the exercise; check their keyboard requirements before publishing.

## Translations

Translations share a `storyId`, not an `id`. They have independent typing sessions and estimates. Use the garden editions as examples: shared presentation may be inherited, but translate all reader-facing content, including the title, description, caption, setting, ending, epilogue, and paragraphs. Register each edition separately.

For a new language, add its code and native display name to `src/languages.ts`. The language type, preference validation, and selectors derive from that definition. No keyboard profile is inferred from a story's language: input methods and keyboard layouts are separate settings.

## Site translations

Story languages and interface languages are independent. Site preferences store one `siteLanguage` and an array of `readingLanguages`; an empty array means no reading preference. Keep native language names unchanged and mark story content with the edition's `lang` attribute.

Interface messages live in `src/i18n/messages.ts`. English source messages are typed keys, Italian supplies the initial translation, and the provider exposes `t(message, values)` for interface copy. Use named placeholders for dynamic text instead of concatenating translated sentence fragments. Never translate story prose through this catalog. The `text` helper handles known metadata labels such as genres and artwork descriptions, leaving new content labels unchanged until a translation is added.

To add a site language, register its native name in `siteLanguageNames` and supply a complete `Record<MessageKey, string>` in the translations registry. TypeScript requires every message. The tests check interpolation parameters, preference migration, persistence, and switching site language during an attempt. A story language does not need to have a site translation, or vice versa.

## Presentation themes

Reuse a theme when its artwork, accent, and ambience fit the story. For a new theme:

1. Add its animation and ambience settings to `src/stories/themes.ts`. Select an existing audio texture or implement a new one in `src/audio/ambience.ts`. Use `null` for animation when motion would not fit.
2. Add an artwork component under `src/components/covers/` and register it in that folder's `index.ts`. TypeScript requires a cover for every theme. Artwork supplies only the illustration; `StoryCover` owns the common frame and localized caption.
3. Add its `.theme-<name>` accent rule and any artwork CSS under `src/styles/`; import a new stylesheet in `src/styles/index.css`.

Keep visual and audio behavior out of story prose files. Do not add per-story branches to the header, reader, or library.

## Scope and verification

The catalog is a static collection for each mounted app. Story content objects are treated as immutable so prepared text can be reused. Tests may supply independent collections through `createStoryCatalog`.

The app currently bundles registered content locally; it has no content server or account dependency. If the collection grows enough to make initial download size significant, add lazy content loading at the catalog boundary rather than changing the reader or card components.

DOM tests validate application composition handling, but real mobile keyboards and OS input methods still need browser testing. Build output belongs in `docs/`; do not put authoring documentation there.
