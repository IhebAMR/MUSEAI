import { useAtom } from 'jotai';
import { currentTrackAtom, isPlayingAtom, queueAtom } from './state/player';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceControl } from './components/VoiceControl';
import { Playlist } from './components/Playlist';
import type { Track } from './types/music';

export default function App() {
  const [queue, setQueue] = useAtom(queueAtom);
  const [currentTrack, setCurrentTrack] = useAtom(currentTrackAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

  const play = (track?: Track) => {
    if (track) setCurrentTrack(track);
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

  return (
    <div className="app">
      <header>
        <h1>MuseAI</h1>
      </header>
      <main>
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
