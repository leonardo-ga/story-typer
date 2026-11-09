import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  italian,
  translate,
  type SiteLanguage,
  type MessageKey,
} from './messages';

type Translator = (
  key: MessageKey,
  values?: Record<string, string | number>,
) => string;
function createTranslations(language: SiteLanguage) {
  const t: Translator = (key, values) => translate(language, key, values);
  return {
    language,
    t,
    text: (value: string) =>
      Object.hasOwn(italian, value) ? t(value as MessageKey) : value,
  };
}
const I18nContext = createContext(createTranslations('en'));

export function I18nProvider({
  language,
  children,
}: {
  language: SiteLanguage;
  children: ReactNode;
}) {
  const value = useMemo(() => createTranslations(language), [language]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
