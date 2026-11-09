import { useEffect, useRef, useState } from 'react';
import { languageNames } from '../library';
import type { Language } from '../stories/types';
import { InfoTip } from './InfoTip';
import {
  detectKeyboard,
  supportsKeyboardDetection,
  keyboardNames,
  type ErrorMode,
  type KeyboardLayout,
  type Preferences,
} from '../preferences';

interface Props {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
  saved: boolean;
}

export function TypingPreferences({ preferences, onChange, saved }: Props) {
  const [checking, setChecking] = useState(false);
  const [suggestion, setSuggestion] = useState<KeyboardLayout | null>(null);
  const [message, setMessage] = useState('');
  const request = useRef(0);
  const layoutSelect = useRef<HTMLSelectElement>(null);
  const restoreLayoutFocus = useRef(false);
  useEffect(() => {
    if (!suggestion && restoreLayoutFocus.current) {
      layoutSelect.current?.focus();
      restoreLayoutFocus.current = false;
    }
  }, [suggestion]);
  useEffect(() => {
    if (preferences.keyboard === 'unknown' && supportsKeyboardDetection())
      void check();
    return () => {
      request.current++;
    };
  }, []);
  async function check() {
    const id = ++request.current;
    setChecking(true);
    setSuggestion(null);
    setMessage('');
    try {
      const guess = await detectKeyboard();
      if (id !== request.current) return;
      if (guess === 'unknown')
        setMessage('Detection was inconclusive. Choose your layout manually.');
      else setSuggestion(guess);
    } catch {
      if (id !== request.current) return;
      setMessage('Detection is unavailable. Choose your layout manually.');
    } finally {
      if (id === request.current) setChecking(false);
    }
  }
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
      <div className="preference-section preference-section--keyboard">
        <div className="preference-section-heading">
          <span className="preference-symbol" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M7 9h.01M11 9h.01M15 9h.01M9 12h.01M13 12h.01M17 12h.01M7 15h10" />
            </svg>
          </span>
          <div>
            <h3>Keyboard</h3>
          </div>
          <InfoTip label="About keyboard detection">
            Confirm the suggested layout to check story characters. Choose a
            specific layout: broad AZERTY and QWERTZ families stay unverified.
            Shortcuts and input methods may support additional characters.
          </InfoTip>
        </div>
        <div className="keyboard-controls">
          {suggestion ? (
            <div className="keyboard-confirmation">
              <span
                className="keyboard-suggestion"
                role="status"
                title={`Use ${keyboardNames[suggestion]}?`}
              >
                Use <strong>{keyboardNames[suggestion]}</strong>?
              </span>
              <button
                type="button"
                className="confirm-layout"
                aria-label="Confirm detected keyboard layout"
                title="Use this layout"
                onClick={() => {
                  restoreLayoutFocus.current = true;
                  onChange({ keyboard: suggestion });
                  setSuggestion(null);
                  setMessage('');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </button>
              <button
                type="button"
                className="dismiss-layout"
                aria-label="Choose keyboard layout manually"
                title="Choose manually"
                onClick={() => {
                  restoreLayoutFocus.current = true;
                  setSuggestion(null);
                  setMessage('');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          ) : (
            <label>
              <span className="sr-only">Keyboard layout</span>
              <select
                ref={layoutSelect}
                value={preferences.keyboard}
                onChange={(event) => {
                  request.current++;
                  setChecking(false);
                  onChange({ keyboard: event.target.value as KeyboardLayout });
                  setSuggestion(null);
                  setMessage('');
                }}
              >
                {Object.entries(keyboardNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {value === 'unknown' && checking
                      ? 'Detecting layout…'
                      : label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!suggestion && (
            <button
              type="button"
              className="secondary-button detect-keyboard"
              disabled={checking}
              onClick={() => void check()}
              aria-label="Detect system keyboard layout"
            >
              {checking ? 'Checking…' : 'Detect'}
            </button>
          )}
        </div>
        {(message || checking) && (
          <p className="preference-help" role="status">
            {message || 'Checking your layout…'}
          </p>
        )}
      </div>
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
