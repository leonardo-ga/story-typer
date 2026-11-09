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
      aria-label="Filter stories"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="library-toolbar">
        <label className="story-search">
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Find a story…"
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
          Filters{advancedCount > 0 && <span>{advancedCount}</span>}
        </button>
      </div>
      {open && (
        <div className="filter-panel" id={panelId}>
          <label>
            <span>Genre</span>
            <select
              value={filters.genre}
              onChange={(event) => change('genre', event.target.value)}
            >
              <option value="all">All genres</option>
              {genres.map((genre) => (
                <option key={genre}>{genre}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Language</span>
            <select
              value={filters.language}
              onChange={(event) => change('language', event.target.value)}
            >
              <option value="all">All languages</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {languageNames[language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Typing time</span>
            <select
              value={filters.time}
              onChange={(event) => change('time', event.target.value)}
            >
              <option value="all">Any length</option>
              <option value="short">Up to 5 min</option>
              <option value="medium">6–10 min</option>
              <option value="long">Over 10 min</option>
            </select>
          </label>
          <label>
            <span>Progress</span>
            <select
              value={filters.progress}
              onChange={(event) => change('progress', event.target.value)}
            >
              <option value="all">Any progress</option>
              <option value="new">Not started</option>
              <option value="started">In progress</option>
              <option value="finished">Completed</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => change('sort', event.target.value)}
            >
              <option value="collection">Collection order</option>
              <option value="title">Title A–Z</option>
              <option value="shortest">Shortest first</option>
            </select>
          </label>
        </div>
      )}
      {active && (
        <button
          type="button"
          className="clear-filters"
          onClick={() => onChange({ ...defaultFilters })}
        >
          Reset filters
        </button>
      )}
    </form>
  );
}
