import { useEffect, useRef } from 'react';

declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; } }

export default function YouTubePlayer({ videoId, onEnded, onReady }: Readonly<{ videoId: string; onEnded?: () => void; onReady?: () => void }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const ensureAPI = () => new Promise<void>((resolve) => {
      if ((globalThis as any)?.YT?.Player) return resolve();
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.body.appendChild(s);
      (globalThis as any).onYouTubeIframeAPIReady = () => resolve();
    });

    let cancelled = false;
    ensureAPI().then(() => {
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;
  playerRef.current = new (globalThis as any).YT.Player(el, {
        height: '1',
        width: '1',
        playerVars: { autoplay: 1, controls: 0 },
        videoId,
        events: {
          onReady: () => { try { playerRef.current?.playVideo?.(); } catch {} onReady?.(); },
          onStateChange: (e: any) => { if (e?.data === 0) onEnded?.(); },
        },
      });
    });
    return () => { cancelled = true; try { playerRef.current?.destroy?.(); } catch {} };
  }, [videoId, onEnded, onReady]);

  return <div ref={containerRef} style={{ position: 'absolute', left: -9999, top: -9999 }} />;
}
