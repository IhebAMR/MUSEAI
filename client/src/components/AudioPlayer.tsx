import { Howl } from 'howler';
import { useEffect, useRef } from 'react';
import type { Track } from '../types/music';

export function AudioPlayer({ track, playing, onPlay, onPause, onSkip }: Readonly<{
  track?: Track | null;
  playing: boolean;
  onPlay: (t?: Track) => void;
  onPause: () => void;
  onSkip: () => void;
}>) {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!track || !track.url) return;
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
    if (track?.url) {
      console.log('[AudioPlayer] Loading track URL:', track.url);
    }
    const howl = new Howl({
      src: [track.url],
      html5: true,
      preload: true,
      onload: () => {
        console.log('[AudioPlayer] onload');
        if (playing) {
          try { howl.play(); } catch {}
        }
      },
      onplay: () => { console.log('[AudioPlayer] onplay'); },
      onplayerror: (_id, err) => {
        console.error('Audio play error', err);
        try { howl.once('unlock', () => howl.play()); } catch {}
        // Native fallback attempt
        try {
          const a = new Audio(track.url);
          a.crossOrigin = 'anonymous';
          a.play().catch(() => {});
        } catch {}
      },
      onloaderror: (_id, err) => {
        console.error('Audio load error', err);
        // Native fallback attempt
        try {
          const a = new Audio(track.url);
          a.crossOrigin = 'anonymous';
          a.play().catch(() => {});
        } catch {}
      }
    });
    soundRef.current = howl;
    // If already marked as playing, attempt to play (onload will also handle)
    if (playing) {
      try { howl.play(); } catch {}
    }
    return () => { howl.unload(); };
  }, [track?.url]);

  useEffect(() => {
    const howl = soundRef.current;
    if (!howl) return;
    if (playing && !howl.playing()) howl.play();
    if (!playing && howl.playing()) howl.pause();
  }, [playing]);

  return (
    <div className="audio-player">
      <div className="meta">
        {track?.albumArt && <img src={track.albumArt} alt={track.title} />}
        <div>
          <div className="title">{track?.title || 'Nothing playing'}</div>
          <div className="artist">{track?.artist || ''}</div>
        </div>
      </div>
      <div className="controls">
        <button onClick={() => onSkip()}>Skip</button>
        {playing ? (
          <button onClick={() => onPause()}>Pause</button>
        ) : (
          <button onClick={() => onPlay(track || undefined)}>Play</button>
        )}
      </div>
    </div>
  );
}
