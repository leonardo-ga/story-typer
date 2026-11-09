import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useRef, type RefObject } from 'react';
import { TypingPreferences } from './TypingPreferences';
import type { Preferences } from '../preferences';
import { SettingsIcon } from './SettingsIcon';

interface Props {
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  preferencesSaved: boolean;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement>;
}

export function PreferencesDialog({
  preferences,
  updatePreferences,
  preferencesSaved,
  onClose,
  returnFocus,
}: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      returnFocus.current?.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return (
    <dialog
      ref={dialog}
      className="preferences-dialog"
      aria-labelledby="preferences-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="preferences-content">
        <div className="preferences-heading">
          <span className="preferences-heading-icon">
            <SettingsIcon />
          </span>
          <div>
            <h2 id="preferences-title">{t('Preferences')}</h2>
            <p>
              {preferencesSaved
                ? t('Saves automatically')
                : t('This visit only')}
            </p>
          </div>
          <button
            type="button"
            className="dialog-close"
            aria-label={t('Close preferences')}
            onClick={onClose}
            autoFocus
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
        <TypingPreferences
          preferences={preferences}
          onChange={updatePreferences}
          saved={preferencesSaved}
        />
      </div>
    </dialog>
  );
}
