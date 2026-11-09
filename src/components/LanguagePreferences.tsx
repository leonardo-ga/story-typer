import { languageNames, type Language } from '../languages';
import { siteLanguageNames, type SiteLanguage } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import type { Preferences } from '../preferences';
import { InfoTip } from './InfoTip';
import { MultiSelect } from './MultiSelect';
import { SingleSelect } from './SingleSelect';

interface Props {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}

export function SiteLanguagePreference({ preferences, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="preference-section">
      <div className="preferred-language">
        <span className="preference-section-heading site-language-heading">
          {t('Site language')}
        </span>
        <SingleSelect
          label={t('Site language')}
          value={preferences.siteLanguage}
          onChange={(siteLanguage) => onChange({ siteLanguage })}
          options={Object.entries(siteLanguageNames).map(([value, label]) => ({
            value: value as SiteLanguage,
            label,
            lang: value,
          }))}
        />
      </div>
    </div>
  );
}

export function ReadingLanguagesPreference({ preferences, onChange }: Props) {
  const { t } = useI18n();
  return (
    <fieldset className="preference-section reading-languages">
      <legend className="preference-section-heading">
        <span>{t('Reading languages')}</span>
        <InfoTip label={t('About reading languages')}>
          {t(
            'Choose the languages you like to read. Preferred editions are selected when available; other stories remain visible. No selection means no preference.',
          )}
        </InfoTip>
      </legend>
      <MultiSelect
        label={t('Reading languages')}
        options={Object.entries(languageNames).map(([value, label]) => ({
          value: value as Language,
          label,
          lang: value,
        }))}
        value={preferences.readingLanguages}
        onChange={(readingLanguages) => onChange({ readingLanguages })}
      />
    </fieldset>
  );
}
