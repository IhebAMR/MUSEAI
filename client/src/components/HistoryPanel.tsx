import { useEffect, useState } from 'react';
import type { Track } from '../types/music';
import { getPlayed, clearPlayed, PlayedItem } from '../services/history';

export default function HistoryPanel({ onPlay, onQueue }: Readonly<{ onPlay: (t: Track) => void; onQueue: (ts: Track[]) => void }>) {
  const [items, setItems] = useState<PlayedItem[]>([]);

  const refresh = () => setItems(getPlayed());
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, []);

  const toTrack = (p: PlayedItem): Track => ({
    title: p.title,
    artist: p.artist,
    albumArt: p.albumArt,
    provider: (p as any).provider || (p.videoId ? 'youtube' : 'file'),
    videoId: p.videoId as any,
    url: p.url as any,
  } as any);

  return (
    <section className="history">
      <div className="section-header">
        <h2>Recently Played</h2>
        <button className="secondary" onClick={() => { clearPlayed(); refresh(); }}>Clear</button>
      </div>
      <div className="list">
        {items.length === 0 && <div className="empty">No history yet</div>}
        {items.map((p) => (
          <div key={`${p.key}-${p.at}`} className="row">
            <div className="thumb">{p.albumArt ? <img src={p.albumArt} alt="thumb" /> : <div className="placeholder" />}</div>
            <div className="info">
              <div className="title" title={p.title}>{p.title}</div>
              <div className="artist" title={p.artist}>{p.artist}</div>
            </div>
            <div className="actions">
              <button onClick={() => onPlay(toTrack(p))}>Play</button>
              <button onClick={() => onQueue([toTrack(p)])}>Queue</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
