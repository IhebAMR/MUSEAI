import { Router, Request, Response } from 'express';

const router = Router();

function readEnv() {
  return {
    CLIENT_ID: (process.env.SPOTIFY_CLIENT_ID || '').trim(),
    CLIENT_SECRET: (process.env.SPOTIFY_CLIENT_SECRET || '').trim(),
    REDIRECT_URI: (process.env.SPOTIFY_REDIRECT_URI || '').trim(), // production
    REDIRECT_URI_DEV: (process.env.SPOTIFY_REDIRECT_URI_DEV || '').trim(), // development/local
    SPOTIFY_ENV: (process.env.SPOTIFY_ENV || process.env.NODE_ENV || 'development').trim().toLowerCase(),
    CLIENT_APP_URL: (process.env.CORS_ORIGIN || '').trim()
  };
}

function toBasicAuth(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`).toString('base64');
}

// Simple in-memory cache for app access token
let appTokenCache: { token: string; expiresAt: number } | null = null;
let genreSeedsCache: { values: string[]; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string> {
  const { CLIENT_ID, CLIENT_SECRET } = readEnv();
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('spotify_client_missing');
  const now = Date.now();
  if (appTokenCache && appTokenCache.expiresAt > now + 10_000) {
    return appTokenCache.token;
  }
  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${toBasicAuth(CLIENT_ID, CLIENT_SECRET)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`spotify_app_token_failed ${res.status} ${text}`);
  }
  const json: any = await res.json();
  const expiresIn = Number(json?.expires_in || 3600);
  const token = String(json?.access_token || '');
  if (!token) throw new Error('spotify_app_token_empty');
  appTokenCache = { token, expiresAt: now + (expiresIn * 1000) };
  return token;
}

async function getAvailableGenreSeeds(): Promise<Set<string>> {
  const now = Date.now();
  if (genreSeedsCache && genreSeedsCache.expiresAt > now + 10_000) {
    return new Set(genreSeedsCache.values);
  }
  const token = await getAppAccessToken();
  const res = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // Fallback to a small known-good set
    return new Set(['pop','rock','chill','dance','edm','acoustic','classical','jazz','hip-hop','rap']);
  }
  const json: any = await res.json();
  const values: string[] = Array.isArray(json?.genres) ? json.genres : [];
  genreSeedsCache = { values, expiresAt: now + 24 * 60 * 60 * 1000 };
  return new Set(values);
}

router.get('/login', (req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV } = readEnv();
  if (!CLIENT_ID || !CLIENT_SECRET || (!REDIRECT_URI && !REDIRECT_URI_DEV)) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  const envParam = (req.query.env as string | undefined)?.toLowerCase();
  const useProd = envParam ? envParam === 'production' || envParam === 'prod' : (SPOTIFY_ENV === 'production' || SPOTIFY_ENV === 'prod');
  const chosenRedirect = useProd ? REDIRECT_URI : (REDIRECT_URI_DEV || REDIRECT_URI);
  const state = Math.random().toString(36).slice(2);
  const scope = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ].join(' ');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: chosenRedirect,
    state,
    show_dialog: 'true'
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(url);
});

// Helper: return the exact authorize URL the server will redirect to (for debugging)
router.get('/login-url', (_req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = readEnv();
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  const scope = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ].join(' ');
  const state = 'debug-preview';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: 'true'
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID, scope });
});

// Minimal, sanitized status for debugging env issues
router.get('/status', (_req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV, CLIENT_APP_URL } = readEnv();
  res.json({
    ok: Boolean(CLIENT_ID && CLIENT_SECRET && (REDIRECT_URI || REDIRECT_URI_DEV)),
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
    redirectUri: REDIRECT_URI,
    redirectUriDev: REDIRECT_URI_DEV,
    spotifyEnv: SPOTIFY_ENV,
    clientAppUrl: CLIENT_APP_URL,
  });
});

router.get('/callback', async (req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV, CLIENT_APP_URL } = readEnv();
  const code = req.query.code as string | undefined;
  const oauthError = req.query.error as string | undefined;
  if (oauthError && CLIENT_APP_URL) {
    const errFrag = encodeURIComponent(oauthError);
    return res.redirect(`${CLIENT_APP_URL}/spotify/callback#oauth_error=${errFrag}`);
  }
  if (!code) return res.status(400).json({ error: 'missing code' });
  if (!CLIENT_ID || !CLIENT_SECRET || (!REDIRECT_URI && !REDIRECT_URI_DEV)) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  try {
    const envParam = (req.query.env as string | undefined)?.toLowerCase();
    const useProd = envParam ? envParam === 'production' || envParam === 'prod' : (SPOTIFY_ENV === 'production' || SPOTIFY_ENV === 'prod');
    const chosenRedirect = useProd ? REDIRECT_URI : (REDIRECT_URI_DEV || REDIRECT_URI);
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: chosenRedirect,
    });
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${toBasicAuth(CLIENT_ID, CLIENT_SECRET)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(400).json({ error: 'token_exchange_failed', details: text });
    }
    const json = await tokenRes.json();
    const encodedJson = encodeURIComponent(JSON.stringify(json));
    const redirectHtml = CLIENT_APP_URL
      ? String.raw`<script>
           (function(){
             try { window.opener && window.opener.postMessage(${JSON.stringify(JSON.stringify(json))}, '*'); } catch(e){}
             try { window.location.replace('${CLIENT_APP_URL}/spotify/callback#data=${encodedJson}'); } catch(e){}
           })();
         </script>`
      : `<script>try{ window.opener && window.opener.postMessage(${JSON.stringify(JSON.stringify(json))}, '*'); }catch(e){}</script>`;
    return res.send(`<!doctype html><html><body>${redirectHtml}<pre>${JSON.stringify(json, null, 2)}</pre><p>You can close this window.</p></body></html>`);
  } catch (e: any) {
    return res.status(500).json({ error: 'spotify_oauth_error', message: e?.message || String(e) });
  }
});

export default router;

// Below: Recommendation proxy using the client-provided Spotify token.
// Accepts query params q, mood, genre, limit, market and returns simplified tracks with preview_url.
interface RecQuery {
  q?: string;
  mood?: string;
  genre?: string;
  limit?: string;
  market?: string;
}

function moodToTargets(mood?: string): Record<string, string | number> {
  const m = (mood || '').toLowerCase();
  switch (m) {
    case 'happy':
    case 'joy':
      return { target_valence: 0.8, min_energy: 0.4 };
    case 'sad':
    case 'chill':
    case 'relaxing':
      return { target_valence: 0.3, max_energy: 0.5 };
    case 'energetic':
    case 'workout':
      return { target_energy: 0.8, min_tempo: 110 };
    case 'focus':
    case 'lofi':
      return { max_energy: 0.6, target_instrumentalness: 0.7 };
    default:
      return {};
  }
}

function moodToGenres(mood?: string): string[] {
  const m = (mood || '').toLowerCase();
  switch (m) {
    case 'happy': return ['pop'];
    case 'sad': return ['acoustic'];
    case 'chill':
    case 'relaxing': return ['chill', 'ambient'];
    case 'energetic':
    case 'workout': return ['dance', 'edm'];
    case 'focus':
    case 'lofi': return ['lo-fi', 'chill'];
    default: return [];
  }
}

async function spFetch(path: string, token: string) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`spotify_api_error ${res.status} ${text}`);
  }
  return res.json();
}

router.get('/recommendations', async (req: Request<{}, {}, {}, RecQuery>, res: Response) => {
  try {
    let userToken = (req.headers['x-spotify-token'] as string) || '';

    const { q, mood, genre, limit = '20', market = 'US' } = req.query;
    let seed_genres: string[] = [];
    if (genre) seed_genres = String(genre).split(',').map(s => s.trim()).filter(Boolean);
    if (!seed_genres.length) seed_genres = moodToGenres(mood);

    // Filter seed_genres to Spotify-available seeds
    if (seed_genres.length) {
      try {
        const allowed = await getAvailableGenreSeeds();
        seed_genres = seed_genres.filter(g => allowed.has(g.toLowerCase()));
      } catch {}
    }

    let seed_tracks: string[] = [];
    if (q) {
      // Choose a token for search: prefer user token, else app token
      let searchToken = userToken;
      if (!searchToken) {
        try { searchToken = await getAppAccessToken(); } catch {}
      }
      if (searchToken) {
        try {
          const search: any = await spFetch(`/search?type=track&limit=1&q=${encodeURIComponent(q)}`, searchToken);
          const t = search?.tracks?.items?.[0];
          if (t?.id) seed_tracks = [t.id];
        } catch {}
      }
    }

    // Ensure at least one seed
  if (!seed_genres.length && !seed_tracks.length) seed_genres = ['pop'];

    const targets = moodToTargets(mood);
    const params = new URLSearchParams({
      limit: String(limit || '20'),
      market: String(market || 'US'),
    });
    if (seed_genres.length) params.set('seed_genres', seed_genres.slice(0, 3).join(','));
    if (seed_tracks.length) params.set('seed_tracks', seed_tracks.slice(0, 2).join(','));
    for (const [k, v] of Object.entries(targets)) params.set(k, String(v));

    // Build recommendations using user token if possible, else app token
    const path = `/recommendations?${params.toString()}`;
    let rec: any = null;
    if (userToken) {
      try {
        rec = await spFetch(path, userToken);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (!/spotify_api_error\s+(401|403)/.test(msg)) {
          throw e;
        }
      }
    }
    if (!rec) {
      const appTok = await getAppAccessToken();
      rec = await spFetch(path, appTok);
    }
    const tracks = (rec?.tracks || [])
      .map((t: any) => ({
        id: t?.id,
        title: t?.name,
        artist: t?.artists?.map((a: any) => a?.name).filter(Boolean).join(', '),
        url: t?.preview_url || '',
        albumArt: t?.album?.images?.[0]?.url || '',
        externalUrl: t?.external_urls?.spotify || '',
      }))
      .filter((t: any) => !!t.url);

    return res.json(tracks);
  } catch (e: any) {
    console.error('[Spotify] recommendations error:', e?.message || e);
    return res.status(500).json({ error: 'spotify_recommendations_failed', message: e?.message || String(e) });
  }
});
