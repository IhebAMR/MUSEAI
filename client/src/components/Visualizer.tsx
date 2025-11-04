import { useEffect, useRef } from 'react';
import { Howler } from 'howler';

export default function Visualizer({ playing }: Readonly<{ playing: boolean }>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const fakeRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    // Try to hook into Howler's Web Audio graph for real spectrum data
    try {
      const ctx = (Howler as any).ctx as AudioContext | undefined;
      const master = (Howler as any).masterGain as GainNode | undefined;
      const usingWebAudio = (Howler as any).usingWebAudio !== false;
      if (ctx && master && usingWebAudio) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; // 128 bins
        master.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as unknown as Uint8Array;
      }
    } catch {}

    const render = () => {
      const w = canvas.width, h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);

  const analyser = analyserRef.current;
  const dataArray = dataArrayRef.current as any as Uint8Array | null;

      const bars = 48;
      const barW = w / bars;

      let values: number[] = [];
      if (analyser && dataArray) {
        const buf: any = dataArray as any;
        (analyser as any).getByteFrequencyData(buf);
        for (let i = 0; i < bars; i++) {
          const idx = Math.floor((i / bars) * buf.length);
          const v = buf[idx] / 255; // 0..1
          values.push(v);
        }
      } else {
        // Fallback pseudo-visualization when we can't access audio samples (e.g., YouTube)
        if (fakeRef.current.length !== bars) fakeRef.current = Array.from({ length: bars }, () => 0);
        const decay = 0.08;
        const pulse = playing ? 0.35 : 0.08;
        for (let i = 0; i < bars; i++) {
          const base = Math.sin((performance.now() / 800 + i / 8)) * 0.15 + pulse;
          const noise = (Math.random() - 0.5) * 0.08;
          const target = Math.max(0, Math.min(1, base + noise));
          fakeRef.current[i] = fakeRef.current[i] + (target - fakeRef.current[i]) * (playing ? 0.25 : decay);
        }
        values = fakeRef.current.slice();
      }

      for (let i = 0; i < bars; i++) {
        const x = i * barW + barW * 0.15;
        const val = values[i] ?? 0;
        const bh = Math.max(2, val * (h * 0.9));
        const y = h - bh;
        // gradient from brand to brand-2
        const grad = ctx2d.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, '#8b5cf6');
        grad.addColorStop(1, '#22d3ee');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(x, y, barW * 0.7, bh);
        // subtle glow
        ctx2d.globalAlpha = 0.15;
        ctx2d.fillRect(x, y - 6, barW * 0.7, 6);
        ctx2d.globalAlpha = 1;
      }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      try { analyserRef.current?.disconnect(); } catch {}
      analyserRef.current = null;
    };
  }, [playing]);

  return (
    <div className="visualizer">
      <canvas ref={canvasRef} />
    </div>
  );
}
