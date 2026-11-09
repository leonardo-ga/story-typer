export const languageNames = {
  en: 'English',
  ko: '한국어',
  it: 'Italiano',
  fr: 'Français',
} as const;

export type Language = keyof typeof languageNames;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && Object.hasOwn(languageNames, value);
}
