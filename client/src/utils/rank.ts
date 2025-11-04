import type { Track } from '../types/music';
import { getPrefs } from '../services/prefs';

function norm(s?: string) { return (s || '').trim().toLowerCase(); }

function scoreTrack(t: Track): number {
  const p = getPrefs();
  const a = norm(t.artist);
  const ti = norm(t.title);

  let score = 0;
  if (a && p.likes.artists.includes(a)) score += 3;
  if (ti && p.likes.titles.includes(ti)) score += 2;

  if (a && p.dislikes.artists.includes(a)) score -= 4;
  if (ti && p.dislikes.titles.includes(ti)) score -= 3;

  if (a && p.skips.artists.includes(a)) score -= 1;
  if (ti && p.skips.titles.includes(ti)) score -= 1;

  // Minor boost for known channels like "Topic" which often are official uploads
  if ((a || '').toLowerCase().endsWith(' - topic')) score += 1;

  return score;
}

export function rankTracks(list: Track[]): Track[] {
  return [...list].sort((x, y) => scoreTrack(y) - scoreTrack(x));
}
