import { Router, Request, Response } from 'express';

const router = Router();

function getKey() {
  const key = (process.env.YOUTUBE_API_KEY || '').trim();
  return key || null;
}

function buildQuery(input?: string, mood?: string, genre?: string) {
  const terms: string[] = [];
  if (input) terms.push(input);
  if (mood) terms.push(mood);
  if (genre) terms.push(genre);
  terms.push('music');
  return terms.join(' ');
}

// GET /api/youtube/search?q=&limit=&region=
router.get('/search', async (req: Request, res: Response) => {
  try {
    const key = getKey();
    if (!key) return res.status(500).json({ error: 'youtube_key_missing' });

    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'q_required' });

    const maxResults = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const region = String(req.query.region || 'US');

    const params = new URLSearchParams({
      key,
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: String(maxResults),
      regionCode: region,
      q,
    });

    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (j as any)?.error || 'yt_search_failed' });

    const tracks = (j as any).items?.map((it: any) => ({
      provider: 'youtube',
      videoId: it.id?.videoId,
      title: it.snippet?.title,
      artist: it.snippet?.channelTitle,
      albumArt: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
      externalUrl: it.id?.videoId ? `https://www.youtube.com/watch?v=${it.id.videoId}` : undefined,
    }))?.filter((t: any) => t.videoId) || [];

    res.json({ tracks });
  } catch (e: any) {
    res.status(500).json({ error: 'yt_search_failed', message: e?.message || String(e) });
  }
});

// GET /api/youtube/recommend?input=&mood=&genre=&limit=&region=
router.get('/recommend', async (req: Request, res: Response) => {
  try {
    const key = getKey();
    if (!key) return res.status(500).json({ error: 'youtube_key_missing' });

    const q = buildQuery(String(req.query.input || ''), String(req.query.mood || ''), String(req.query.genre || ''));
    const maxResults = Math.min(50, Math.max(1, Number(req.query.limit || 12)));
    const region = String(req.query.region || 'US');

    const params = new URLSearchParams({
      key,
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: String(maxResults),
      regionCode: region,
      q,
    });

    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const r = await fetch(url);
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (j as any)?.error || 'yt_recommend_failed' });

    const tracks = (j as any).items?.map((it: any) => ({
      provider: 'youtube',
      videoId: it.id?.videoId,
      title: it.snippet?.title,
      artist: it.snippet?.channelTitle,
      albumArt: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url,
      externalUrl: it.id?.videoId ? `https://www.youtube.com/watch?v=${it.id.videoId}` : undefined,
    }))?.filter((t: any) => t.videoId) || [];

    res.json({ tracks });
  } catch (e: any) {
    res.status(500).json({ error: 'yt_recommend_failed', message: e?.message || String(e) });
  }
});

export default router;
