import YouTubePlayer from './YouTubePlayer';
import { AudioPlayer } from './AudioPlayer';
import type { Track } from '../types/music';
import Visualizer from './Visualizer';
import { likeTrack, dislikeTrack, skipTrack } from '../services/prefs';

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
        <Visualizer playing={playing} />
        <div className="controls">
          <button onClick={() => { if (track) dislikeTrack(track); }}>Dislike</button>
          <button onClick={() => { if (track) likeTrack(track); }}>Like</button>
          <button onClick={() => { if (track) { skipTrack(track); } onSkip(); }}>Skip</button>
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
  return (
    <div>
      <AudioPlayer track={track} playing={playing} onPlay={onPlay} onPause={onPause} onSkip={onSkip} />
      <Visualizer playing={playing} />
      <div className="controls">
        <button onClick={() => { if (track) dislikeTrack(track); }}>Dislike</button>
        <button onClick={() => { if (track) likeTrack(track); }}>Like</button>
  <button onClick={() => { if (track) { skipTrack(track); } onSkip(); }}>Skip</button>
        {playing ? (
          <button onClick={() => onPause()}>Pause</button>
        ) : (
          <button onClick={() => onPlay(track)}>Play</button>
        )}
      </div>
    </div>
  );
}
