import UnifiedPlayer from './UnifiedPlayer';
import type { Track } from '../types/music';
import { useEffect, useRef } from 'react';
import { addPlayed } from '../services/history';

export default function NowPlayingBar({ track, playing, onPlay, onPause, onSkip }: Readonly<{
  track?: Track | null;
  playing: boolean;
  onPlay: (t?: Track) => void;
  onPause: () => void;
  onSkip: () => void;
}>) {
  const lastKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!track) return;
    const key = (track as any).videoId ? `yt:${(track as any).videoId}` : (track as any).url || `${track.title}-${track.artist}`;
    if (playing && key && lastKeyRef.current !== key) {
      addPlayed(track);
      lastKeyRef.current = key;
    }
  }, [track, playing]);
  if (!track) return null;
  return (
    <div className="now-playing">
      <UnifiedPlayer track={track} playing={playing} onPlay={onPlay} onPause={onPause} onSkip={onSkip} />
    </div>
  );
}
