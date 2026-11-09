import { SingleSelect } from './SingleSelect';
import { useI18n } from '../i18n/I18nProvider';
import { languageNames } from '../languages';
import { useId, useState } from 'react';
import type { StoryCatalog } from '../stories/catalog';
import { defaultFilters, type LibraryFilters as Filters } from '../library';

interface Props {
  catalog: StoryCatalog;
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function LibraryFilters({ catalog, filters, onChange }: Props) {
  const { t, text } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  function change(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }
  const { genres, languages } = catalog;
  const advancedCount = (
    ['genre', 'language', 'time', 'progress', 'sort'] as const
  ).filter((key) => filters[key] !== defaultFilters[key]).length;
  const active = advancedCount > 0 || filters.query !== '';
  return (
    <form
      className="library-filters"
      aria-label={t('Filter stories')}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="library-toolbar">
        <label className="story-search">
          <span className="sr-only">{t('Search')}</span>
          <input
            type="search"
            placeholder={t('Find a story…')}
            value={filters.query}
            onChange={(event) => change('query', event.target.value)}
          />
        </label>
        <button
          type="button"
          className="filter-button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          {t('Filters')}
          {advancedCount > 0 && <span>{advancedCount}</span>}
        </button>
      </div>
      {open && (
        <div className="filter-panel" id={panelId}>
          <div className="filter-field">
            <span>{t('Genre')}</span>
            <SingleSelect
              label={t('Genre')}
              value={filters.genre}
              onChange={(value) => change('genre', value)}
              options={[
                { value: 'all', label: t('All genres') },
                ...genres.map((genre) => ({
                  value: genre,
                  label: text(genre),
                })),
              ]}
            />
          </div>
          <div className="filter-field">
            <span>{t('Language')}</span>
            <SingleSelect
              label={t('Language')}
              value={filters.language}
              onChange={(value) => change('language', value)}
              options={[
                { value: 'all', label: t('All languages') },
                ...languages.map((language) => ({
                  value: language,
                  label: languageNames[language],
                  lang: language,
                })),
              ]}
            />
          </div>
          <div className="filter-field">
            <span>{t('Typing time')}</span>
            <SingleSelect
              label={t('Typing time')}
              value={filters.time}
              onChange={(value) => change('time', value)}
              options={[
                { value: 'all', label: t('Any length') },
                { value: 'short', label: t('Up to 5 min') },
                { value: 'medium', label: t('6\u201310 min') },
                { value: 'long', label: t('Over 10 min') },
              ]}
            />
          </div>
          <div className="filter-field">
            <span>{t('Progress')}</span>
            <SingleSelect
              label={t('Progress')}
              value={filters.progress}
              onChange={(value) => change('progress', value)}
              options={[
                { value: 'all', label: t('Any progress') },
                { value: 'new', label: t('Not started') },
                { value: 'started', label: t('In progress') },
                { value: 'finished', label: t('Completed') },
              ]}
            />
          </div>
          <div className="filter-field">
            <span>{t('Sort')}</span>
            <SingleSelect
              label={t('Sort')}
              value={filters.sort}
              onChange={(value) => change('sort', value)}
              options={[
                { value: 'collection', label: t('Collection order') },
                { value: 'title', label: t('Title A\u2013Z') },
                { value: 'shortest', label: t('Shortest first') },
              ]}
            />
          </div>
        </div>
      )}
      {active && (
        <button
          type="button"
          className="clear-filters"
          onClick={() => onChange({ ...defaultFilters })}
        >
          {t('Reset filters')}
        </button>
      )}
    </form>
  );
}
