import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
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
  const [spotifyConnected, setSpotifyConnected] = useState<boolean>(false);

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

  // Listen for Spotify OAuth tokens from popup
  useEffect(() => {
    try {
      const existing = localStorage.getItem('spotify_tokens');
      if (existing) setSpotifyConnected(true);
    } catch {}
    const onMessage = (e: MessageEvent) => {
      let payload: any = e.data;
      try {
        if (typeof payload === 'string') payload = JSON.parse(payload);
      } catch {}
      if (payload && typeof payload === 'object' && 'access_token' in payload) {
        try {
          localStorage.setItem('spotify_tokens', JSON.stringify(payload));
          setSpotifyConnected(true);
        } catch {}
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="app">
      <header>
        <h1>MuseAI</h1>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => {
            try { localStorage.removeItem('auth_token'); } catch {}
            if (typeof globalThis !== 'undefined') (globalThis as any).location.href = '/login';
          }}>Logout</button>
        </div>
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
          <button onClick={() => {
            const base = ((import.meta as any).env?.VITE_API_URL as string) || 'http://localhost:5001';
            const serverBase = base.replace(/\/$/, '');
            const w = 520;
            const h = 720;
            const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
            const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
            const win = window.open(`${serverBase}/api/spotify/login`, 'spotify-auth', `width=${w},height=${h},left=${left},top=${top}`);
            if (!win && typeof globalThis !== 'undefined') (globalThis as any).location.href = `${serverBase}/api/spotify/login`;
          }}>{spotifyConnected ? 'Spotify Connected' : 'Connect Spotify'}</button>
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
