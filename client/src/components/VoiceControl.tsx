import { useEffect, useRef, useState } from 'react';
import { Howler } from 'howler';
import { api, getYouTubeRecommendations } from '../services/api';
import { rankTracks } from '../utils/rank';
import type { Track } from '../types/music';

type Props = {
  onPlay: (track?: Track) => void;
  onPause: () => void;
  onSkip: () => void;
  onQueue: (tracks: Track[]) => void;
  onCreatePlaylist: (name: string) => void;
};

async function buildList(input: string, payload: any): Promise<Track[]> {
  try {
    const yt = await getYouTubeRecommendations({ input, mood: payload?.mood, genre: payload?.genre, limit: 20 });
    const list = (yt || []).map(it => ({ title: it.title, artist: it.artist, albumArt: it.albumArt, provider: 'youtube', videoId: it.videoId, externalUrl: it.externalUrl })) as Track[];
    return rankTracks(list);
  } catch {
    return [];
  }
}

export function VoiceControl({ onPlay, onPause, onSkip, onQueue, onCreatePlaylist }: Readonly<Props>) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const recognitionRef = useRef<any>();

  

  useEffect(() => {
    const SpeechRecognition = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';
      recog.onstart = () => { setStatus('Listening…'); setError(''); };
      recog.onerror = (ev: any) => { setError(`Speech error: ${ev?.error || 'speech-error'}`); setStatus(''); setListening(false); };
      recog.onresult = async (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
        setLastTranscript(transcript);
        setListening(false);
        setStatus('');
        api.post('/ai/interpret', { transcript })
          .then(async ({ data }) => {
            const action = data?.action as string;
            const payload = data?.payload || {};
            if (action === 'play') {
              const list = await buildList(transcript, payload);
              if (list?.length) { onPlay(list[0]); if (list.length > 1) onQueue(list.slice(1)); }
              else setError('No songs found for that mood/genre.');
            } else if (action === 'queue') {
              const list = await buildList(transcript, payload);
              if (list?.length) onQueue(list); else setError('No songs found to queue.');
            } else if (action === 'pause') { onPause(); }
            else if (action === 'skip') { onSkip(); }
            else if (action === 'create_playlist') { onCreatePlaylist(payload.playlistName || 'My Playlist'); }
          })
          .catch(() => { console.error('AI interpret error'); setError('Could not contact AI service. Check server and VITE_API_URL.'); });
      };
      recog.onend = () => { setListening(false); setStatus(''); };
      recognitionRef.current = recog;
    }
  }, [onPlay, onPause, onSkip, onQueue, onCreatePlaylist]);

  const toggle = async () => {
    if (!supported) return;
    try {
      if (listening) { recognitionRef.current?.stop(); setListening(false); }
      else {
        setError('');
        navigator.mediaDevices?.getUserMedia?.({ audio: true })?.catch(() => {});
        if ((Howler as any)?.ctx?.resume) { (Howler as any).ctx.resume().catch(() => {}); }
        recognitionRef.current?.abort?.();
        recognitionRef.current?.start();
        setListening(true);
        setStatus('Listening…');
      }
    } catch (e: any) { setError(`Failed to start speech recognition: ${e?.message || e}`); setListening(false); setStatus(''); }
  };

  return (
    <div className="voice-control">
      <button className={"mic " + (listening ? 'listening' : '')} onClick={toggle} disabled={!supported}>
        {listening ? 'Stop Listening' : 'Start Listening'}
      </button>
      {!supported && <p>Your browser does not support speech recognition. Try Chrome on desktop.</p>}
      {status && <p>{status}</p>}
      {lastTranscript && <p>Heard: “{lastTranscript}”</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      <ManualCommand onAction={async (input) => {
        setError(''); setStatus(''); setLastTranscript(input);
        api.post('/ai/interpret', { transcript: input })
          .then(async ({ data }) => {
            const action = data?.action as string;
            const payload = data?.payload || {};
            if (action === 'play') {
              const list = await buildList(input, payload);
              if (list?.length) { onPlay(list[0]); if (list.length > 1) onQueue(list.slice(1)); }
              else setError('No songs found for that mood/genre.');
            } else if (action === 'queue') {
              const list = await buildList(input, payload);
              if (list?.length) onQueue(list); else setError('No songs found to queue.');
            } else if (action === 'pause') { onPause(); }
            else if (action === 'skip') { onSkip(); }
            else if (action === 'create_playlist') { onCreatePlaylist(payload.playlistName || 'My Playlist'); }
          })
          .catch(() => setError('Could not contact AI service. Check server and VITE_API_URL.'));
      }} />
    </div>
  );
}

function ManualCommand({ onAction }: Readonly<{ onAction: (input: string) => void }>) {
  const [value, setValue] = useState('');
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
      <input
        placeholder="Type a command (e.g., Play something relaxing)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #374151', background: '#111827', color: '#fff' }}
      />
      <button className="mic" onClick={() => { if ((Howler as any)?.ctx?.resume) { (Howler as any).ctx.resume().catch(() => {}); } if (value.trim()) onAction(value); }}>
        Send
      </button>
    </div>
  );
}
