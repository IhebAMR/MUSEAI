import type { Track } from '../types/music';

type Prefs = {
  likes: { artists: string[]; titles: string[] };
  dislikes: { artists: string[]; titles: string[] };
  skips: { artists: string[]; titles: string[] };
};

const KEY = 'museai_prefs_v1';

function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { likes: { artists: [], titles: [] }, dislikes: { artists: [], titles: [] }, skips: { artists: [], titles: [] } };
    const j = JSON.parse(raw);
    return {
      likes: { artists: j?.likes?.artists || [], titles: j?.likes?.titles || [] },
      dislikes: { artists: j?.dislikes?.artists || [], titles: j?.dislikes?.titles || [] },
      skips: { artists: j?.skips?.artists || [], titles: j?.skips?.titles || [] },
    };
  } catch {
    return { likes: { artists: [], titles: [] }, dislikes: { artists: [], titles: [] }, skips: { artists: [], titles: [] } };
  }
}

function write(p: Prefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

function norm(s?: string) { return (s || '').trim().toLowerCase(); }

export function likeTrack(t: Track) {
  const p = read();
  const a = norm(t.artist);
  const ti = norm(t.title);
  if (a && !p.likes.artists.includes(a)) p.likes.artists.push(a);
  if (ti && !p.likes.titles.includes(ti)) p.likes.titles.push(ti);
  // Remove from dislikes
  p.dislikes.artists = p.dislikes.artists.filter(x => x !== a);
  p.dislikes.titles = p.dislikes.titles.filter(x => x !== ti);
  write(p);
}

export function dislikeTrack(t: Track) {
  const p = read();
  const a = norm(t.artist);
  const ti = norm(t.title);
  if (a && !p.dislikes.artists.includes(a)) p.dislikes.artists.push(a);
  if (ti && !p.dislikes.titles.includes(ti)) p.dislikes.titles.push(ti);
  // Remove from likes
  p.likes.artists = p.likes.artists.filter(x => x !== a);
  p.likes.titles = p.likes.titles.filter(x => x !== ti);
  write(p);
}

export function skipTrack(t: Track) {
  const p = read();
  const a = norm(t.artist);
  const ti = norm(t.title);
  if (a && !p.skips.artists.includes(a)) p.skips.artists.push(a);
  if (ti && !p.skips.titles.includes(ti)) p.skips.titles.push(ti);
  write(p);
}

export function getPrefs(): Prefs { return read(); }
