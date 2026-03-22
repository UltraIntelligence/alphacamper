/**
 * Computes the next highlighted index in a search result list based on a keypress.
 * Returns -1 (no selection) when the list is empty.
 */
export function getNextHighlightedIndex(
  key: string,
  current: number,
  total: number,
): number {
  if (total === 0) return -1
  if (key === 'ArrowDown') return (current + 1) % total
  if (key === 'ArrowUp') return current <= 0 ? total - 1 : current - 1
  return current
}
