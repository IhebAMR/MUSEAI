import { useEffect, useMemo, useState } from 'react';
import { Howler } from 'howler';
import { getYouTubeRecommendations, getYouTubeSearch } from '../services/api';
import { rankTracks } from '../utils/rank';
import { addSearchQuery, getSearches } from '../services/history';
import type { Track } from '../types/music';

type Props = {
  onPlay: (track?: Track) => void;
  onQueue: (tracks: Track[]) => void;
};

const MOODS = ['chill', 'lofi', 'relaxing', 'focus', 'happy', 'sad', 'workout', 'party'];

export default function Suggestions({ onPlay, onQueue }: Readonly<Props>) {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<string>('chill');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<Track[]>([]);
  const [recent, setRecent] = useState<{ q: string; at: number }[]>([]);

  const placeholder = useMemo(() => `Search music (e.g., ${mood} beats)`, [mood]);

  const runSearch = async () => {
    setLoading(true); setError('');
    try {
      let list: any[] = [];
      try {
        if (query.trim()) {
          addSearchQuery(query.trim());
          setRecent(getSearches());
          const yt = await getYouTubeSearch(query.trim(), 12);
          list = (yt || []).map((it) => ({ ...it, provider: 'youtube' }));
        } else {
          const yt = await getYouTubeRecommendations({ input: mood, mood, limit: 12 });
          list = (yt || []).map((it) => ({ ...it, provider: 'youtube' }));
        }
      } catch {}
  setItems(rankTracks(list as Track[]));
    } catch (e: any) {
      setError(e?.message || 'Failed to load suggestions');
    } finally { setLoading(false); }
  };

  useEffect(() => { setRecent(getSearches()); runSearch(); /* load on mount */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const t = setTimeout(runSearch, 250); return () => clearTimeout(t); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  const playItem = async (t: Track) => {
    try { if ((Howler as any)?.ctx?.resume) await (Howler as any).ctx.resume(); } catch {}
    onPlay(t);
    const rest = items.filter((x) => keyOf(x) !== keyOf(t));
    if (rest.length) onQueue(rest);
  };

  const keyOf = (t: Track) => (t.provider === 'youtube' && (t as any).videoId ? `yt:${(t as any).videoId}` : (t.url || `${t.title}-${t.artist}`));

  return (
    <section className="suggestions">
      <div className="section-header">
        <h2>Discover</h2>
        <div className="moods">
          {MOODS.map((m) => (
            <button key={m} className={"chip " + (m === mood ? 'active' : '')} onClick={() => setMood(m)}>{m}</button>
          ))}
        </div>
      </div>
      <div className="searchbar">
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
        />
        <button onClick={runSearch}>Search</button>
      </div>
      {recent.length > 0 && (
        <div className="recents" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
          <span style={{ opacity: 0.7, fontSize: 12 }}>Recent:</span>
          {recent.slice(0, 8).map((r) => (
            <button key={r.q} className="chip" onClick={() => { setQuery(r.q); setTimeout(runSearch, 0); }}>{r.q}</button>
          ))}
        </div>
      )}
      {error && <div className="error">{error}</div>}
      <div className="cards">
        {loading && (<div className="loading">Loading…</div>)}
        {!loading && items.length === 0 && (<div className="empty">No suggestions</div>)}
        {!loading && items.length > 0 && items.map((t) => (
          <div key={keyOf(t)} className="card">
            <div className="thumb">
              {t.albumArt ? (
                <img src={t.albumArt} alt={t.title} />
              ) : (
                <div className="placeholder" />
              )}
            </div>
            <div className="info">
              <div className="title" title={t.title}>{t.title}</div>
              <div className="artist" title={t.artist}>{t.artist}</div>
            </div>
            <div className="actions">
              <button onClick={() => playItem(t)}>Play</button>
              <button onClick={() => onQueue([t])}>Queue</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
