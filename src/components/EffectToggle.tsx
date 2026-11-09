import { useI18n } from '../i18n/I18nProvider';
import { useId, useState } from 'react';

const icons = {
  leaves: 'M19 4C8 3 3 8 5 15c5 7 13 3 14-11ZM6 18 16 8',
  snow: 'M12 3v18M4 7l16 10M4 17 20 7M9 4l3 3 3-3M9 20l3-3 3 3',
  dust: 'M5 5h.01M16 4h.01M11 12h.01M4 18h.01M19 17h.01M19 9h.01',
  tracks: 'M4 5h16M4 19h16M8 5v14M16 5v14M8 9h8M8 15h8',
  keyboard:
    'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 9h.01M11 9h.01M15 9h.01M17 12h.01M13 12h.01M9 12h.01M7 15h10',
  rain: 'M7 14a4 4 0 1 1 .6-7.95A5 5 0 0 1 17 7a3.5 3.5 0 0 1 0 7M8 17l-1 3m6-4-1 3m6-2-1 3',
  stars:
    'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4M4 19v3m-1.5-1.5h3',
  sound:
    'M9 18V5l10-2v13M9 9l10-2M9 18a3 2.5 0 1 1-6 0 3 2.5 0 1 1 6 0ZM19 16a3 2.5 0 1 1-6 0 3 2.5 0 1 1 6 0Z',
};

interface Props {
  label: string;
  icon: keyof typeof icons;
  active: boolean;
  onToggle: () => void;
}

export function EffectToggle({ label, icon, active, onToggle }: Props) {
  const { t } = useI18n();
  const tooltipId = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <div
      className="effect-control"
      data-tooltip-dismissed={dismissed}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setDismissed(false);
      }}
      onPointerLeave={() => setDismissed(true)}
      onBlur={() => setDismissed(true)}
    >
      <button
        className="effect-toggle"
        type="button"
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible'))
            setDismissed(false);
        }}
        onClick={() => {
          setDismissed(true);
          onToggle();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setDismissed(true);
          }
        }}
        aria-label={label}
        aria-pressed={active}
        aria-describedby={tooltipId}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d={icons[icon]} />
        </svg>
        <span className="effect-indicator" aria-hidden="true" />
      </button>
      <span className="effect-tooltip" id={tooltipId} role="tooltip">
        {label}
        <span className="effect-tooltip-state">
          {active ? t('On') : t('Off')}
        </span>
      </span>
    </div>
  );
}
