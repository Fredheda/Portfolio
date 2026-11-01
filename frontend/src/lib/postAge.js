const DAY_MS = 24 * 60 * 60 * 1000;

// LinkedIn-style age of a post ("3d", "2w", "5mo", "1y"). An invalid or
// future date gives "" so a card never shows "NaN" or a negative age.
export function postAge(dateIso, now) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS);
  if (Number.isNaN(days) || days < 0) return '';
  if (days === 0) return 'today';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}
