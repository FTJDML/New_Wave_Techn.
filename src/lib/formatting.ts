/** Shared label/formatting helpers for catalogue pages — turns SCREAMING_SNAKE_CASE enum-ish values into readable text. */
export function humanize(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Unknown';
  if (typeof value === 'number') return String(value);
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDuration(years: number | null, precision: string): string | null {
  if (years === null) return null;
  const approximate = precision.toUpperCase().includes('APPROX') || precision.toUpperCase().includes('MID');
  return approximate ? `circa ${years} years` : `${years} years`;
}
