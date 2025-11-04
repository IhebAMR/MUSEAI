import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Howler } from 'howler';
import { currentTrackAtom, isPlayingAtom, queueAtom } from './state/player';
import NowPlayingBar from './components/NowPlayingBar';
import { VoiceControl } from './components/VoiceControl';
import { Playlist } from './components/Playlist';
import type { Track } from './types/music';
import { getYouTubeRecommendations } from './services/api';
import Suggestions from './components/Suggestions';
import StatusChips from './components/StatusChips';
import HistoryPanel from './components/HistoryPanel';

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
  const queueTracks = (tracks: Track[]) => {
    const byUrl = new Map<string, Track>();
    for (const t of [...queue, ...tracks]) { if (t?.url) byUrl.set(t.url, t); }
    setQueue(Array.from(byUrl.values()));
  };

  // Removed preloading of static sample audio.

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
      <header className="topbar">
        <div className="brand"><span className="logo">♪</span> MuseAI</div>
        <div className="actions">
          <StatusChips />
          <button className="secondary" onClick={() => {
            try { localStorage.removeItem('auth_token'); } catch {}
            if (typeof globalThis !== 'undefined') (globalThis as any).location.href = '/login';
          }}>Logout</button>
        </div>
      </header>
      <main className="layout">
        <section className="left">
          <div className="cta-row">
            <button className={spotifyConnected ? 'connected' : ''} onClick={() => {
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
          <Suggestions onPlay={(t) => play(t)} onQueue={(tracks) => queueTracks(tracks)} />
        </section>
        <aside className="right">
          <Playlist queue={queue} />
          <HistoryPanel onPlay={(t) => play(t)} onQueue={(ts) => queueTracks(ts)} />
        </aside>
      </main>
      <NowPlayingBar track={currentTrack} playing={isPlaying} onPlay={play} onPause={pause} onSkip={skip} />
    </div>
  );
}
