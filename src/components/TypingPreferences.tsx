import { KeyboardPreference } from './KeyboardPreference';
import { languageNames } from '../languages';
import type { Language } from '../stories/types';
import { InfoTip } from './InfoTip';
import { type ErrorMode, type Preferences } from '../preferences';

interface Props {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  saved: boolean;
}

export function TypingPreferences({ preferences, onChange, saved }: Props) {
  return (
    <section
      className="typing-preferences"
      aria-label="Language and keyboard preferences"
    >
      <div className="preference-section preference-section--language">
        <div className="preference-section-heading">
          <span className="preference-symbol" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="8" />
              <path d="M4 12h16M12 4c5 5 5 11 0 16-5-5-5-11 0-16Z" />
            </svg>
          </span>
          <div>
            <h3>Language</h3>
          </div>
          <InfoTip label="About story language">
            Your preferred edition is selected when available. Stories in other
            languages stay visible.
          </InfoTip>
        </div>
        <label className="preferred-language">
          <span className="sr-only">Preferred story language</span>
          <select
            value={preferences.language}
            onChange={(event) =>
              onChange({ language: event.target.value as Language | 'none' })
            }
          >
            <option value="none">No preference</option>
            {Object.entries(languageNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <KeyboardPreference preferences={preferences} onChange={onChange} />
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
                <span>Error handling</span>
                <InfoTip label="About typing settings">
                  Story: read freely and fix mistakes if you like. Accuracy: fix
                  errors to continue. Speed: no backtracking. Changes apply to
                  new or restarted attempts.
                </InfoTip>
              </legend>
              <select
                aria-label="Error handling"
                value={preferences.errorMode}
                onChange={(event) =>
                  onChange({ errorMode: event.target.value as ErrorMode })
                }
              >
                <option value="free">Story — corrections optional</option>
                <option value="correct">
                  Accuracy — fix errors to continue
                </option>
                <option value="forward">Speed — corrections disabled</option>
              </select>
            </fieldset>
          </div>
          <div className="assistance-group">
            <div className="assistance-description">
              <span className="assistance-label">
                <span>Character help</span>
                <small>
                  Accept <b>a</b> for <b>à</b>
                </small>
              </span>
              <InfoTip label="About similar characters">
                Accept base letters for accents and similar punctuation. Yellow
                means accepted with help; green means exact. Other letters and
                case still need to match.
              </InfoTip>
            </div>
            <label className="switch-control">
              <input
                className="switch-input"
                type="checkbox"
                role="switch"
                aria-label="Accept similar characters"
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
          Browser storage is unavailable. These preferences will last for this
          visit only.
        </p>
      )}
    </section>
  );
}
