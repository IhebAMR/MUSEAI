import type { Track } from '../types/music';

export function Playlist({ queue }: Readonly<{ queue: Track[] }>) {
  return (
    <div className="playlist">
      <h3>Queue</h3>
      <ul>
        {queue.map((t) => (
          <li key={`${t.title}-${t.artist}-${t.url}`}>
            <span className="title">{t.title}</span>
            <span className="artist">{t.artist}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
