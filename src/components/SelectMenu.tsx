import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
  lang?: string;
}

interface Props<Value extends string> {
  multiple: boolean;
  searchable?: boolean;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  label: string;
  options: readonly SelectOption<Value>[];
  value: readonly Value[];
  onChange: (value: Value[]) => void;
}

const searchable = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

/** Reveal a row within its list without scrolling the dialog or page. */
function revealOption(option: HTMLElement | null | undefined) {
  const list = option?.closest<HTMLElement>('.select-menu-options');
  if (!option || !list) return;
  const row = option.getBoundingClientRect();
  const bounds = list.getBoundingClientRect();
  if (row.top < bounds.top) list.scrollTop -= bounds.top - row.top;
  else if (row.bottom > bounds.bottom)
    list.scrollTop += row.bottom - bounds.bottom;
}

/** Shared single- and multiple-choice dropdown behavior and positioning. */
export function SelectMenu<Value extends string>({
  multiple,
  searchable: useSearch = multiple,
  triggerRef,
  label,
  options,
  value,
  onChange,
}: Props<Value>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const internalTrigger = useRef<HTMLButtonElement>(null);
  const trigger = triggerRef ?? internalTrigger;
  const typeahead = useRef({ query: '', at: 0 });
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const selected = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)
    .join(', ');
  const visible = options.filter((option) =>
    searchable(`${option.label} ${option.value}`).includes(
      searchable(query.trim()),
    ),
  );

  function toggle(option: Value) {
    if (!multiple) {
      onChange([option]);
      close(true);
      return;
    }
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option],
    );
  }

  function close(restoreFocus = false) {
    setOpen(false);
    setQuery('');
    typeahead.current = { query: '', at: 0 };
    if (restoreFocus) trigger.current?.focus();
  }
  useLayoutEffect(() => {
    if (!open || !trigger.current) {
      setPosition(null);
      return;
    }
    const rect = trigger.current.getBoundingClientRect();
    const dialog = trigger.current.closest('dialog')?.getBoundingClientRect();
    const bounds =
      dialog && dialog.width > 0
        ? dialog
        : {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
          };
    const below = Math.max(0, bounds.bottom - rect.bottom - 12);
    const above = Math.max(0, rect.top - bounds.top - 12);
    const down = below >= 180 || below >= above;
    const desiredHeight = Math.min(
      250,
      options.length * 38 + 16 + (useSearch ? 42 : 0) + (multiple ? 30 : 0),
    );
    const height = Math.min(desiredHeight, down ? below : above);
    const width = Math.min(rect.width || 300, bounds.right - bounds.left - 16);
    setPosition({
      left: Math.max(
        bounds.left + 8,
        Math.min(rect.left, bounds.right - width - 8),
      ),
      top: down ? rect.bottom + 4 : rect.top - height - 4,
      width,
      height,
    });
  }, [open, options.length, useSearch, multiple]);
  useEffect(() => {
    if (!open || !position) return;
    const selectedOption =
      root.current?.querySelector<HTMLElement>(
        '[aria-selected="true"], [aria-pressed="true"]',
      ) ?? root.current?.querySelector<HTMLElement>('.select-menu-option');
    if (useSearch) search.current?.focus({ preventScroll: true });
    else selectedOption?.focus({ preventScroll: true });
    revealOption(selectedOption);
  }, [open, position, useSearch]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const dismiss = () => close();
    const scroll = (event: Event) => {
      if (
        event.target === window ||
        !root.current?.contains(event.target as Node)
      )
        close();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  return (
    <div
      className={multiple ? 'multi-select' : 'single-select'}
      ref={root}
      onBlur={(event) => {
        // Pointer dismissal handles transient focus loss without a destination.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        )
          close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
          return;
        }
        if (!open || multiple) return;
        if (
          event.target === search.current &&
          (event.key === 'Home' || event.key === 'End')
        )
          return;
        const rows = [
          ...(root.current?.querySelectorAll<HTMLButtonElement>(
            '.select-menu-option',
          ) ?? []),
        ];
        const current = rows.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        let next = -1;
        if (event.key === 'ArrowDown') next = (current + 1) % rows.length;
        if (event.key === 'ArrowUp')
          next =
            current < 0
              ? rows.length - 1
              : (current - 1 + rows.length) % rows.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = rows.length - 1;
        if (
          event.key.length === 1 &&
          event.key !== ' ' &&
          event.target !== search.current &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const now = performance.now();
          typeahead.current.query =
            now - typeahead.current.at > 600
              ? event.key
              : typeahead.current.query + event.key;
          typeahead.current.at = now;
          next = rows.findIndex((row) =>
            searchable(row.textContent ?? '').startsWith(
              searchable(typeahead.current.query),
            ),
          );
        }
        if (next >= 0 && rows[next]) {
          event.preventDefault();
          rows.forEach((row, index) => {
            row.tabIndex = index === next ? 0 : -1;
          });
          rows[next].focus({ preventScroll: true });
          revealOption(rows[next]);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        value={multiple ? undefined : value[0]}
        className={`select-menu-trigger ${multiple ? 'multi-select-trigger' : 'single-select-trigger'}`}
        aria-label={label}
        aria-haspopup={multiple ? undefined : 'listbox'}
        aria-describedby={`${id}-value`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        title={selected || t('No preference')}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${id}-value`}>{selected || t('No preference')}</span>
        {multiple && value.length > 0 && <small>{value.length}</small>}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div
          id={id}
          className={`select-menu-panel ${multiple ? 'multi-select-panel' : 'single-select-panel'}`}
          style={{
            left: position?.left,
            top: position?.top,
            width: position?.width,
            height: position?.height,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {useSearch && (
            <input
              ref={search}
              type="search"
              className={`select-menu-search ${multiple ? 'multi-select-search' : 'single-select-search'}`}
              aria-label={multiple ? t('Search languages') : t('Search')}
              placeholder={multiple ? t('Search languages…') : t('Search…')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <div
            className={`select-menu-options ${multiple ? 'multi-select-options' : 'single-select-options'}`}
            role={multiple ? 'group' : 'listbox'}
            aria-label={label}
          >
            {visible.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`select-menu-option ${multiple ? 'multi-select-option' : 'single-select-option'}`}
                role={multiple ? undefined : 'option'}
                aria-pressed={
                  multiple ? value.includes(option.value) : undefined
                }
                aria-selected={
                  multiple ? undefined : value.includes(option.value)
                }
                tabIndex={multiple || value.includes(option.value) ? 0 : -1}
                data-value={option.value}
                onClick={() => toggle(option.value)}
              >
                <span lang={option.lang}>{option.label}</span>
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
            ))}
            {visible.length === 0 && (
              <p role="status">
                {multiple ? t('No languages found') : t('No options found')}
              </p>
            )}
          </div>
          {multiple && value.length > 0 && (
            <button
              type="button"
              className={`select-menu-clear ${multiple ? 'multi-select-clear' : 'single-select-clear'}`}
              onClick={() => onChange([])}
            >
              {t('Clear selection')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
