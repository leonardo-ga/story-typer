import { useI18n } from '../i18n/I18nProvider';
import { KeyboardPreference } from './KeyboardPreference';
import {
  SiteLanguagePreference,
  ReadingLanguagesPreference,
} from './LanguagePreferences';
import { InfoTip } from './InfoTip';
import { type ErrorMode, type Preferences } from '../preferences';
import { SingleSelect } from './SingleSelect';

interface Props {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  saved: boolean;
}

export function TypingPreferences({ preferences, onChange, saved }: Props) {
  const { t } = useI18n();
  return (
    <section
      className="typing-preferences"
      aria-label={t('Language and keyboard preferences')}
    >
      <SiteLanguagePreference preferences={preferences} onChange={onChange} />
      <KeyboardPreference preferences={preferences} onChange={onChange} />
      <ReadingLanguagesPreference
        preferences={preferences}
        onChange={onChange}
      />
      <div className="preference-section preference-section--typing">
        <div className="typing-behavior-grid">
          <div className="error-mode-group">
            <fieldset className="error-mode-options">
              <legend>
                <span className="preference-symbol" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="m8 12 3 3 5-6" />
                  </svg>
                </span>
                <span>{t('Error handling')}</span>
                <InfoTip label={t('About typing settings')}>
                  {t(
                    'Story: read freely and fix mistakes if you like. Accuracy: fix errors to continue. Speed: no backtracking. Changes apply to new or restarted attempts.',
                  )}
                </InfoTip>
              </legend>
              <SingleSelect<ErrorMode>
                label={t('Error handling')}
                value={preferences.errorMode}
                onChange={(errorMode) => onChange({ errorMode })}
                options={[
                  { value: 'free', label: t('Story — corrections optional') },
                  {
                    value: 'correct',
                    label: t('Accuracy — fix errors to continue'),
                  },
                  {
                    value: 'forward',
                    label: t('Speed — corrections disabled'),
                  },
                ]}
              />
            </fieldset>
          </div>
          <div className="assistance-group">
            <div className="assistance-description">
              <span className="assistance-label">
                <span>{t('Character help')}</span>
                <small>{t('Accept a for à')}</small>
              </span>
              <InfoTip label={t('About similar characters')}>
                {t(
                  'Accept base letters for accents and similar punctuation. Yellow means accepted with help; green means exact. Other letters and case still need to match.',
                )}
              </InfoTip>
            </div>
            <label className="switch-control">
              <input
                className="switch-input"
                type="checkbox"
                role="switch"
                aria-label={t('Accept similar characters')}
                checked={preferences.assistance}
                onChange={(event) =>
                  onChange({ assistance: event.target.checked })
                }
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </div>
        </div>
      </div>
      {!saved && (
        <p className="preference-message storage-warning" role="status">
          {t(
            'Browser storage is unavailable. These preferences will last for this visit only.',
          )}
        </p>
      )}
    </section>
  );
}
