import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Howler } from 'howler';
import { currentTrackAtom, isPlayingAtom, queueAtom } from './state/player';
import UnifiedPlayer from './components/UnifiedPlayer';
import { VoiceControl } from './components/VoiceControl';
import { Playlist } from './components/Playlist';
import type { Track } from './types/music';
import { getSongs, getYouTubeRecommendations } from './services/api';

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
            try { if ((Howler as any)?.ctx?.resume) { await (Howler as any).ctx.resume(); } } catch {}
            // Prefer YouTube recommendations; fallback to local songs
            try {
              let list: any[] = [];
              try {
                const yt = await getYouTubeRecommendations({ input: 'chill lofi', mood: 'chill', limit: 10 });
                list = (yt || []).map(it => ({ title: it.title, artist: it.artist, albumArt: it.albumArt, provider: 'youtube', videoId: it.videoId, externalUrl: it.externalUrl }));
              } catch {}
              if (!list?.length) {
                const local = await getSongs();
                list = (local || []).map(it => ({ ...it, provider: 'file' }));
              }
              if (list?.length) {
                setCurrentTrack(list[0] as any);
                const byUrl = new Map<string, any>();
                for (const t of list.slice(1)) {
                  const key = t.provider === 'youtube' && t.videoId ? `yt:${t.videoId}` : t.url;
                  if (key) byUrl.set(key, t);
                }
                for (const t of queue) {
                  const key = (t as any).provider === 'youtube' && (t as any).videoId ? `yt:${(t as any).videoId}` : (t as any).url;
                  if (key) byUrl.set(key, t);
                }
                setQueue(Array.from(byUrl.values()) as any);
                setIsPlaying(true);
              }
            } catch (e) {
              console.error('Sample play error', e);
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
  <UnifiedPlayer track={currentTrack} playing={isPlaying} onPlay={play} onPause={pause} onSkip={skip} />
        <Playlist queue={queue} />
      </main>
    </div>
  );
}
