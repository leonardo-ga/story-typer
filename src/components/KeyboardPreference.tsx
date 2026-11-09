import { useEffect, useRef, useState } from 'react';
import { InfoTip } from './InfoTip';
import {
  detectKeyboard,
  supportsKeyboardDetection,
  keyboardNames,
  type KeyboardLayout,
  type Preferences,
} from '../preferences';

export function KeyboardPreference({
  preferences,
  onChange,
}: {
  preferences: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}) {
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
  );
}
