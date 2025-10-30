import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { currentTrackAtom, isPlayingAtom, queueAtom } from './state/player';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceControl } from './components/VoiceControl';
import { Playlist } from './components/Playlist';
import type { Track } from './types/music';
import { getSongs } from './services/api';

export default function App() {
  const [queue, setQueue] = useAtom(queueAtom);
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

  const play = (track?: Track) => {
    if (track) setCurrentTrack(track);
    else if (!currentTrack && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentTrack(next);
      setQueue(rest);
    }
    setIsPlaying(true);
  };
  const pause = () => setIsPlaying(false);
  const skip = () => {
    if (!queue || queue.length === 0) return;
    const [next, ...rest] = queue;
    setCurrentTrack(next);
    setQueue(rest);
    setIsPlaying(true);
  };
  const queueTracks = (tracks: Track[]) => setQueue([...queue, ...tracks]);

  // Preload a few tracks so "Play" can start immediately
  useEffect(() => {
    (async () => {
      if (currentTrack || queue.length > 0) return;
      try {
        const songs = await getSongs();
        if (songs?.length) setQueue(songs as any);
      } catch {}
    })();
  }, [currentTrack, queue.length, setQueue]);

  return (
    <div className="app">
      <header>
        <h1>MuseAI</h1>
      </header>
      <main>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={async () => {
            const songs = await getSongs();
            if (songs?.length) {
              setCurrentTrack(songs[0] as any);
              setQueue(songs.slice(1) as any);
              setIsPlaying(true);
            }
          }}>Play sample</button>
        </div>
        <VoiceControl
          onPlay={(t?: Track) => play(t)}
          onPause={pause}
          onSkip={skip}
          onQueue={(tracks: Track[]) => queueTracks(tracks)}
          onCreatePlaylist={(name: string) => console.log('Create playlist', name)}
        />
        <AudioPlayer track={currentTrack} playing={isPlaying} onPlay={play} onPause={pause} onSkip={skip} />
        <Playlist queue={queue} />
      </main>
    </div>
  );
}
