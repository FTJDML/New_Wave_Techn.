import { useMemo, useState, type ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  readonly key: string;
  readonly label: string;
  readonly render: (item: T) => ReactNode;
  readonly sortValue?: (item: T) => string | number;
  readonly width?: string;
}

interface DataTableProps<T> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly rows: readonly T[];
  readonly getRowId: (item: T) => string;
  readonly onRowClick?: (item: T) => void;
  readonly selectedId?: string;
  readonly emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({ columns, rows, getRowId, onRowClick, selectedId, emptyMessage = 'No records match the current filters.' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const withValues = rows.map((row) => ({ row, value: column.sortValue!(row) }));
    withValues.sort((a, b) => {
      if (a.value < b.value) return sortDirection === 'asc' ? -1 : 1;
      if (a.value > b.value) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return withValues.map((w) => w.row);
  }, [rows, sortKey, sortDirection, columns]);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    if (sortKey === column.key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(column.key);
      setSortDirection('asc');
    }
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles.headerCell}
                style={{ width: column.width }}
                onClick={() => toggleSort(column)}
                aria-sort={sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {column.label}
                {sortKey === column.key ? <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const id = getRowId(row);
            return (
              <tr
                key={id}
                className={[styles.row, id === selectedId ? styles.rowSelected : ''].join(' ')}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} className={styles.cell}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortedRows.length === 0 ? <p className={styles.emptyState}>{emptyMessage}</p> : null}
    </div>
  );
}
