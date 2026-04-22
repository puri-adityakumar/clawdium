/**
 * Shared helpers for Phase 1 UI overhaul.
 */

/** Deterministic color from a UUID string. Returns an oklch color string. */
const AVATAR_COLORS = [
  'oklch(0.65 0.18 15)',   // warm red
  'oklch(0.65 0.18 45)',   // orange
  'oklch(0.70 0.15 85)',   // gold
  'oklch(0.65 0.15 145)',  // green
  'oklch(0.60 0.15 175)',  // teal
  'oklch(0.60 0.15 230)',  // blue
  'oklch(0.60 0.15 270)',  // indigo
  'oklch(0.65 0.15 310)',  // purple
  'oklch(0.65 0.15 340)',  // pink
  'oklch(0.55 0.12 30)',   // brown
  'oklch(0.60 0.10 200)',  // slate blue
  'oklch(0.70 0.12 120)',  // lime
] as const;

export function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const IDENTICON_COLORS = [
  '#e06c4f', '#d97a2b', '#c9a032', '#5da04e', '#3da086',
  '#4486c5', '#6860b8', '#a050a8', '#c04e72', '#7a6040',
  '#4e8098', '#6a9e3a',
] as const;

export function generateIdenticon(id: string): { grid: boolean[][]; color: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const color = IDENTICON_COLORS[Math.abs(hash) % IDENTICON_COLORS.length];
  const grid: boolean[][] = [];
  let h = Math.abs(hash);
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    for (let col = 0; col < 3; col++) {
      h = ((h << 5) - h + row * 7 + col * 13) | 0;
      grid[row][col] = Math.abs(h) % 3 !== 0;
    }
    for (let col = 3; col < 5; col++) {
      grid[row][col] = grid[row][4 - col];
    }
  }
  return { grid, color };
}

/** Estimate read time in minutes from HTML string. */
export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}

/** Word count from HTML string. */
export function wordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(Boolean).length;
}

/** Format USDC micro-units to human-readable price string (e.g. "$1.50"). */
export function formatPrice(usdcMicro: number): string {
  const dollars = usdcMicro / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: dollars >= 1 ? 2 : 4,
    maximumFractionDigits: dollars >= 1 ? 2 : 4,
  }).format(dollars);
}

/** Format integer base-units (6 decimals) with a token symbol, e.g. "1.50 AUDD". */
export function formatTokenAmount(baseUnits: number, symbol: string, decimals = 6): string {
  const whole = baseUnits / 10 ** decimals;
  const digits = whole >= 1 ? 2 : 4;
  const num = whole.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${num} ${symbol}`;
}

/** Render USDC+AUDD prices as "1.50 USDC · 2.25 AUDD" (omitting zero prices). */
export function formatDualPrice(priceUsdc: number, priceAudd: number): string {
  const parts: string[] = [];
  if (priceUsdc > 0) parts.push(formatTokenAmount(priceUsdc, 'USDC'));
  if (priceAudd > 0) parts.push(formatTokenAmount(priceAudd, 'AUDD'));
  return parts.join(' · ');
}

/** Short agent ID (first 8 chars). */
export function shortId(id: string): string {
  return id.slice(0, 8);
}

/** Plain text excerpt from HTML. */
export function plainExcerpt(html: string, maxLength = 180): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}\u2026`;
}

/** Vote tier for styling post cards. */
export type VoteTier = 'default' | 'warm' | 'top';

export function voteTier(votes: number): VoteTier {
  if (votes >= 10) return 'top';
  if (votes >= 3) return 'warm';
  return 'default';
}
