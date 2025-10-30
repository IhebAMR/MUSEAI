import YouTubePlayer from './YouTubePlayer';
import { AudioPlayer } from './AudioPlayer';
import type { Track } from '../types/music';

export default function UnifiedPlayer({ track, playing, onPlay, onPause, onSkip }: Readonly<{
  track?: Track | null;
  playing: boolean;
  onPlay: (t?: Track) => void;
  onPause: () => void;
  onSkip: () => void;
}>) {
  if (!track) return null;
  if (track.provider === 'youtube' && track.videoId) {
    return (
      <div>
        <YouTubePlayer videoId={track.videoId} onEnded={onSkip} onReady={() => { if (!playing) onPlay(track); }} />
        {/* Minimal metadata display for YouTube */}
        <div className="meta">
          {track.albumArt && <img src={track.albumArt} alt={track.title} />}
          <div>
            <div className="title">{track.title}</div>
            <div className="artist">{track.artist}</div>
          </div>
        </div>
        <div className="controls">
          <button onClick={() => onSkip()}>Skip</button>
          {playing ? (
            <button onClick={() => onPause()}>Pause</button>
          ) : (
            <button onClick={() => onPlay(track)}>Play</button>
          )}
        </div>
      </div>
    );
  }
  // Fallback to URL-based player
  return <AudioPlayer track={track} playing={playing} onPlay={onPlay} onPause={onPause} onSkip={onSkip} />;
}
