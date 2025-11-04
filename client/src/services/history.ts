import type { Track } from '../types/music';

export type PlayedItem = {
  key: string; // provider-specific key (yt:VIDEOID or url)
  title: string;
  artist: string;
  albumArt?: string;
  provider?: string;
  videoId?: string;
  url?: string;
  at: number; // timestamp
};

export type SearchItem = { q: string; at: number };

type HistoryStore = {
  played: PlayedItem[];
  searches: SearchItem[];
};

const KEY = 'museai_history_v1';
const PLAYED_LIMIT = 200;
const SEARCH_LIMIT = 20;

function read(): HistoryStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { played: [], searches: [] };
    const j = JSON.parse(raw);
    return {
      played: Array.isArray(j?.played) ? j.played : [],
      searches: Array.isArray(j?.searches) ? j.searches : [],
    };
  } catch { return { played: [], searches: [] }; }
}

function write(h: HistoryStore) {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {}
}

function trackKey(t: Track): string {
  return t.provider === 'youtube' && (t as any).videoId ? `yt:${(t as any).videoId}` : (t.url || `${t.title}-${t.artist}`);
}

export function addPlayed(t: Track) {
  const h = read();
  const key = trackKey(t);
  const item: PlayedItem = {
    key,
    title: t.title,
    artist: t.artist,
    albumArt: (t as any).albumArt,
    provider: (t as any).provider,
    videoId: (t as any).videoId,
    url: (t as any).url,
    at: Date.now(),
  };
  // de-dup consecutive entries with same key
  const last = h.played[0];
  if (!last || last.key !== key) {
    h.played.unshift(item);
    if (h.played.length > PLAYED_LIMIT) h.played.length = PLAYED_LIMIT;
    write(h);
  }
}

export function getPlayed(): PlayedItem[] { return read().played; }
export function clearPlayed() { const h = read(); h.played = []; write(h); }

export function addSearchQuery(q: string) {
  const h = read();
  const trimmed = q.trim();
  if (!trimmed) return;
  // remove duplicates by value
  h.searches = [{ q: trimmed, at: Date.now() }, ...h.searches.filter(x => x.q !== trimmed)];
  if (h.searches.length > SEARCH_LIMIT) h.searches.length = SEARCH_LIMIT;
  write(h);
}

export function getSearches(): SearchItem[] { return read().searches; }
export function clearSearches() { const h = read(); h.searches = []; write(h); }
