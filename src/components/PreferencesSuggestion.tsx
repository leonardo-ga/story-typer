import { useId } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { SettingsIcon } from './SettingsIcon';

export function PreferencesSuggestion({
  onOpen,
  onDismiss,
  onLater,
}: {
  onOpen: () => void;
  onDismiss: () => void;
  onLater: () => void;
}) {
  const { t } = useI18n();
  const title = useId();
  return (
    <aside
      className="preferences-suggestion"
      aria-labelledby={title}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onLater();
        }
      }}
    >
      <span className="preferences-suggestion-icon" aria-hidden="true">
        <SettingsIcon />
      </span>
      <div>
        <h3 id={title}>{t('Ready to begin')}</h3>
        <p role="status">{t('Adjust your preferences if needed.')}</p>
        <div className="preferences-suggestion-actions">
          <button
            type="button"
            className="preferences-suggestion-open"
            onClick={onOpen}
          >
            {t('Preferences')} <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            className="preferences-suggestion-later"
            onClick={onLater}
            title={t('Remind me next visit')}
          >
            {t('Not now')}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="dialog-close"
        aria-label={t('Don’t show again')}
        title={t('Don’t show again')}
        onClick={onDismiss}
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
    </aside>
  );
}
