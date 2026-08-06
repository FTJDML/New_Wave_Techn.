import { useState } from 'react';
import styles from './FilterPanel.module.css';

export interface FilterFieldConfig {
  readonly key: string;
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

interface FilterPanelProps {
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly searchPlaceholder?: string;
  readonly fields: readonly FilterFieldConfig[];
  readonly values: Readonly<Record<string, string>>;
  readonly onFieldChange: (key: string, value: string) => void;
  readonly shownCount: number;
  readonly totalCount: number;
}

/** Discrete, collapsed-by-default filter panel — never a permanently expanded rail. */
export function FilterPanel({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  fields,
  values,
  onFieldChange,
  shownCount,
  totalCount,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeFilterCount = Object.values(values).filter((v) => v !== '').length;

  return (
    <>
      <div className={styles.bar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={searchPlaceholder}
        />
        <button
          type="button"
          className={[styles.toggleButton, open ? styles.toggleButtonOpen : ''].join(' ')}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          data-testid="filter-panel-toggle"
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <span className={styles.count}>
          {shownCount} shown · {totalCount} in catalogue
        </span>
      </div>
      {open ? (
        <div className={styles.panel} data-testid="filter-panel" data-expanded={open}>
          {fields.map((field) => (
            <div key={field.key} className={styles.field}>
              <label className={styles.fieldLabel} htmlFor={`filter-${field.key}`}>
                {field.label}
              </label>
              <select
                id={`filter-${field.key}`}
                className={styles.select}
                value={values[field.key] ?? ''}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
              >
                <option value="">All</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {activeFilterCount > 0 ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => fields.forEach((field) => onFieldChange(field.key, ''))}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
