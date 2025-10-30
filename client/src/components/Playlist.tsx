import type { Track } from '../types/music';

export function Playlist({ queue }: Readonly<{ queue: Track[] }>) {
  return (
    <div className="playlist">
      <h3>Queue</h3>
      <ul>
        {queue.map((t) => {
          const key = t.provider === 'youtube' && t.videoId ? `yt:${t.videoId}` : (t.url || `${t.title}-${t.artist}`);
          return (
          <li key={key}>
            <span className="title">{t.title}</span>
            <span className="artist">{t.artist}</span>
          </li>
        );})}
      </ul>
    </div>
  );
}
